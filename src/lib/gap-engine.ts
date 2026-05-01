import { adminDb } from "./firebase-admin";
import { queryGeminiRESTArray } from "./gemini-rest";
import { ComplianceRule, GapResult, Upload } from "./firestore-types";
import { Timestamp } from "firebase-admin/firestore";

export interface GapReportItem {
    gap_title: string;
    standard: string;
    section: string;
    missing_requirement: string;
    severity: "critical" | "major" | "minor";
    citations: { source: string; section: string; quote: string }[];
    status: "compliant" | "gap_detected" | "needs_review";
    reasoning?: string;
    missingEvidence?: string;
}

/**
 * Step A: Query Firestore for all compliance rules matching the selected standards.
 * Note: Rules should be pre-seeded in Firestore or loaded from templates
 */
export async function getRulesForStandards(standards: string[]): Promise<ComplianceRule[]> {
    if (!adminDb) {
        console.warn("Firebase not initialized, returning empty rules");
        return [];
    }

    // Query without orderBy to avoid index requirement
    // We'll sort in memory instead
    const rulesSnapshot = await adminDb
        .collection("complianceRules")
        .where("standard", "in", standards)
        .get();

    const rules = rulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<ComplianceRule, "id">
    }));

    // Sort in memory
    return rules.sort((a, b) => {
        if (a.standard !== b.standard) {
            return a.standard.localeCompare(b.standard);
        }
        return a.section.localeCompare(b.section);
    });
}

/**
 * Determine severity based on standard and section characteristics.
 */
function determineSeverity(
    standard: string,
    section: string,
    requiredForClass: string | null | undefined,
    deviceClass?: string
): "critical" | "major" | "minor" {
    // Soften requiredForClass penalties if the device is a lowly Class I device
    if (deviceClass === "Class I" && requiredForClass && requiredForClass !== "Class I") {
        return "minor";
    }

    // Risk management and safety-related requirements are critical
    if (
        standard.includes("14971") ||
        section.startsWith("7.") ||
        section.startsWith("9.")
    ) {
        return "critical";
    }

    // High classification mandates stricter penalties
    if (deviceClass === "Class III" || requiredForClass === "Class III" || requiredForClass === "C") {
        return "critical";
    }

    // Core development requirements are major
    if (section.startsWith("5.") || section.startsWith("6.")) {
        return "major";
    }

    // Everything else is minor
    return "minor";
}

/**
 * Step B + C: For each rule, query Gemini and combine results.
 * This is the core gap engine pipeline.
 */
export async function runGapAnalysis(
    uploadId: string,
    standards: string[],
    fileBuffers: { data: Buffer; mimeType: string; name: string }[],
    aiEngine: "gemini" | "local" = "gemini"
): Promise<GapReportItem[]> {
    // Step A: Get all applicable rules
    const rules = await getRulesForStandards(standards);

    if (rules.length === 0) {
        throw new Error(
            `No compliance rules found for standards: ${standards.join(", ")}`
        );
    }

    const results: GapReportItem[] = [];

    // Filter out non-applicable rules generically
    let applicableRules = rules.filter(r => 
        r.expectedDocument !== "(Not applicable)" &&
        r.expectedDocument !== "- not applicable -" &&
        r.expectedDocument.trim() !== ""
    );

    // DYNAMIC RULE PURGE OPTIMIZATION: Check FDA Product Code features to delete massive rule categories
    let uploadData: Upload | null = null;
    if (adminDb && uploadId) {
        const uploadDoc = await adminDb.collection("uploads").doc(uploadId).get();
        if (uploadDoc.exists) {
            uploadData = uploadDoc.data() as Upload;
            const features = uploadData.features;

            if (features) {
                // If the device has no software, instantly eliminate IEC 62304 and Cyber rules.
                if (features.requiresSoftware === false) {
                    applicableRules = applicableRules.filter(r => 
                        !r.standard.includes("62304") && 
                        !r.requirement.toLowerCase().includes("software") &&
                        !r.requirement.toLowerCase().includes("cybersecurity")
                    );
                }
                
                // If it is a generic device requiring no trials, skip clinical data rules.
                if (features.requiresClinical === false) {
                    applicableRules = applicableRules.filter(r => 
                        !r.requirement.toLowerCase().includes("clinical") &&
                        !r.requirement.toLowerCase().includes("human factors")
                    );
                }

                // If it doesn't touch the patient, skip biocompatibility entirely.
                if (features.requiresBiocompatibility === false) {
                    applicableRules = applicableRules.filter(r => 
                        !r.standard.includes("10993") &&
                        !r.section.toLowerCase().includes("biocomp") &&
                        !r.requirement.toLowerCase().includes("biocompatibility")
                    );
                }
            }
        }
    }

    // PRECEDENT INJECTION: Fetch real FDA warning letters for this device class
    let fdaPrecedents: any[] = [];
    if (uploadData?.productCode) {
        try {
            console.log(`[Gap Engine] Fetching FDA precedents for product code: ${uploadData.productCode}`);
            // Use longer timeout and handle failures gracefully
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const res = await fetch(`https://api.fda.gov/device/enforcement.json?search=product_code:${uploadData.productCode}&limit=3`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const data = await res.json();
                fdaPrecedents = (data.results || []).map((item: any) => ({
                    firm: item.recalling_firm || "Unknown Firm",
                    reason: item.reason_for_recall || ""
                }));
                console.log(`[Gap Engine] Successfully loaded ${fdaPrecedents.length} FDA precedents.`);
            }
        } catch (e) {
            console.warn("[Gap Engine] OpenFDA API unavailable, continuing without live precedents.");
        }
    }

    // Chunking function to prevent MAX_TOKENS output limits
    const chunkArray = (arr: any[], size: number) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
        );

    const ruleChunks = chunkArray(applicableRules, 15);
    
    // Process all chunks concurrently without the 35-second artificial throttle
    const chunkPromises = ruleChunks.map(async (chunk, c) => {
        let chunkSuccess = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!chunkSuccess && retryCount <= maxRetries) {
            try {
                // If retrying due to a transient API failure, add a small exponential backoff
                if (retryCount > 0) {
                    const delay = Math.pow(2, retryCount) * 2000; // 4s, 8s, 16s
                    console.log(`[Gap Engine] Transient error retry pause for ${delay}ms... (Chunk ${c+1}/${ruleChunks.length}, Attempt ${retryCount+1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const chunkResults = await queryGeminiRESTArray(fileBuffers, chunk.map(r => ({
                    id: r.id || "",
                    requirement: r.requirement,
                    standard: r.standard,
                    section: r.section,
                    expectedDocument: r.expectedDocument
                })), aiEngine, fdaPrecedents);
                
                return chunkResults;
                
            } catch(err: any) {
                console.error(`[Gap Engine] Chunk Analysis Crash (Attempt ${retryCount+1}): `, err.message);
                
                if (retryCount < maxRetries) {
                    console.warn(`[Gap Engine] Transient API failure caught. Escalating backoff and retrying chunk ${c+1}...`);
                    retryCount++;
                } else {
                    console.error(`[Gap Engine] EXHAUSTED RETRIES. Chunk ${c+1} failed permanently. Defaulting to Gap.`);
                    const chunkFails = chunk.map(r => ({
                        ruleId: r.id,
                        found: false,
                        confidence: "low",
                        citations: [],
                        reasoning: `Fatal API Error after ${maxRetries} retries: ${err instanceof Error ? err.message : "Capacity failure"}`,
                    }));
                    return chunkFails;
                }
            }
        }
        return [];
    });

    // Await all chunks in parallel
    const chunkResultsArrays = await Promise.all(chunkPromises);
    const geminiBatchResults = chunkResultsArrays.flat();

    // Map AI output back to individual Firestore records
    let batch = adminDb ? adminDb.batch() : null;
    let batchCount = 0;

    for (const rule of rules) {
        // Find if this rule was skipped because of "(Not applicable)"
        const isApplicable = applicableRules.some(r => r.id === rule.id);
        if (!isApplicable) continue;

        // Find its mapped result
        const geminiResult = geminiBatchResults.find(r => r.ruleId === rule.id) || {
            found: false,
            confidence: "low",
            citations: [],
            analytical_reasoning: "Missing ruleId in AI batch output.",
            exact_missing_evidence: "System failure rendering evidence."
        };

        let status: "compliant" | "gap_detected" | "needs_review";

        if (geminiResult.found && (geminiResult.confidence === "high" || geminiResult.confidence === "medium")) {
            status = "compliant";
        } else if (geminiResult.found && geminiResult.confidence === "low") {
            status = "needs_review";
        } else {
            status = "gap_detected";
        }

        const severity = determineSeverity(rule.standard, rule.section, rule.requiredForClass, uploadData?.deviceClass);

        const gapItem: GapReportItem = {
            gap_title: status === "compliant" ? `${rule.requirement} - Verified` : `Missing: ${rule.requirement}`,
            standard: rule.standard,
            section: rule.section,
            missing_requirement: rule.requirement,
            severity,
            citations: geminiResult.citations || [],
            status,
            reasoning: geminiResult.analytical_reasoning,
            missingEvidence: geminiResult.exact_missing_evidence
        };

        results.push(gapItem);

        const gapResultData: GapResult = {
            uploadId,
            standard: rule.standard,
            section: rule.section,
            requirement: rule.requirement,
            status,
            severity,
            gapTitle: gapItem.gap_title,
            missingRequirement: rule.requirement,
            citations: geminiResult.citations || [],
            reasoning: geminiResult.analytical_reasoning || "No analytical reasoning provided.",
            missingEvidence: geminiResult.exact_missing_evidence || "No specific missing evidence identified.",
            geminiResponse: JSON.stringify(geminiResult, null, 2),
            createdAt: Timestamp.now(),
        };

        if (batch) {
            const docRef = adminDb!.collection("gapResults").doc();
            batch.set(docRef, gapResultData);
            batchCount++;

            // Firestore batch limit is 500
            if (batchCount === 490) {
                await batch.commit();
                batch = adminDb!.batch();
                batchCount = 0;
            }
        }
    }

    if (batch && batchCount > 0) {
        await batch.commit();
    }

    return results;
}

/**
 * Get summary statistics for a gap analysis.
 */
export function getGapSummary(results: GapReportItem[]) {
    return {
        total: results.length,
        compliant: results.filter((r) => r.status === "compliant").length,
        gaps: results.filter((r) => r.status === "gap_detected").length,
        needsReview: results.filter((r) => r.status === "needs_review").length,
        critical: results.filter(
            (r) => r.severity === "critical" && r.status === "gap_detected"
        ).length,
        major: results.filter(
            (r) => r.severity === "major" && r.status === "gap_detected"
        ).length,
        minor: results.filter(
            (r) => r.severity === "minor" && r.status === "gap_detected"
        ).length,
        complianceScore: results.length > 0
            ? Math.round(
                (results.filter((r) => r.status === "compliant").length /
                    results.length) *
                100
            )
            : 0,
    };
}
