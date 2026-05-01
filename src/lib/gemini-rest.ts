/**
 * Direct Gemini REST API implementation
 * Uses v1 API instead of v1beta to avoid model access issues
 */

import mammoth from "mammoth";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

// Configure fetch with longer timeout for Node.js environment
const fetchWithTimeout = async (url: string, options: RequestInit & { timeout?: number } = {}) => {
    const { timeout = 60000, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

/**
 * Query Gemini using direct REST API (v1)
 * Optimized for Single-Prompt Batching
 */
export async function queryGeminiRESTArray(
    fileBuffers: { data: Buffer; mimeType: string; name: string }[],
    rules: { id: string; requirement: string; standard: string; section: string; expectedDocument: string }[],
    aiEngine: "gemini" | "local" = "gemini",
    fdaPrecedents: any[] = []
): Promise<any[]> {
    console.log(`[DEBUG] Querying Gemini REST API for batch of ${rules.length} rules!`);
    console.log(`[DEBUG] API Key present: ${!!GEMINI_API_KEY}`);

    // Build the rules payload string
    const rulesListString = rules.map(r => `ruleId: ${r.id}\nSTANDARD: ${r.standard}\nSECTION: ${r.section}\nREQUIREMENT: ${r.requirement}\nEXPECTED DOCUMENT: ${r.expectedDocument}`).join('\n\n');

    const precedentsString = fdaPrecedents.length > 0 
        ? `\n--- RECENT FDA WARNING LETTERS (ANTI-PATTERNS) ---\n` + 
          `The following are real enforcement actions taken against this device type. Use these as a baseline for strictness. Do NOT accept evidence that repeats these mistakes:\n` +
          fdaPrecedents.map((p, i) => `${i+1}. Firm: ${p.firm}\nReason for Recall: ${p.reason}`).join('\n\n') +
          `\n--------------------------------------------------\n`
        : "";

    const prompt = `You are a regulatory compliance auditor reviewing medical device documentation.

TASK: Determine if the uploaded documents contain sufficient evidence for EACH of the following regulatory requirements. You will return exactly ONE JSON array containing an object for every rule.

--- RULES TO EVALUATE ---
${rulesListString}
-------------------------
${precedentsString}
DOCUMENT SYNONYM GUIDE:
Companies often use different names for the same regulatory document. Match on CONTENT, not just filename.
- "Software Development Plan" = SDP, Dev Plan, Development Plan, SDLC Plan, SRS (when it contains planning sections)
- "Software Requirements Specification" = SRS, Requirements Doc, System Requirements, Software Requirements
- "Software Architecture Document" = SAD, Architecture Doc, Design Specification, Software Design, Comprehensive Software Design Document, CSDD, Design Document
- "Software Detailed Design" = SDD, Detailed Design, Module Design, CSDD (when it covers module-level design)
- "Software Verification Plan" = SVP, Test Plan, Verification Plan, V&V Plan
- "Software Verification Report" = Test Report, Verification Report, V&V Report, Test Protocol, Acceptance Criteria
- "Risk Management File" = RMF, Risk File, Risk Analysis, Risk Assessment, FMEA, Hazard Analysis
- "Risk Management Plan" = RMP, Risk Plan
- "Software of Unknown Provenance" = SOUP List, SOUP Analysis, Third-Party Components, OTS List, COTS
- "Clinical Evaluation Report" = CER, Clinical Evaluation
- "Quality Manual" = QMS Manual, Quality Management System Manual
- "Design History File" = DHF, Design File
- "Design Input" = Design Input Document, PRD, Product Requirements, Design Specification, CSDD (when it contains design inputs/outputs)
- "Design Output" = Design Output Document, Design Specification, CSDD (when it contains design outputs)
- "Post-Market Surveillance Plan" = PMS Plan, Post-Market Plan
- "Software Maintenance Plan" = Maintenance Plan, Support Plan
- "Labeling" = IFU, Instructions for Use, User Manual, Label
- "Technical Documentation" = Technical File, Tech Doc
- "Test Protocol" = Verification Protocol, V&V Protocol, Test Procedure, Test Script, Acceptance Test

IMPORTANT: A single document may satisfy MULTIPLE requirements. An SRS can contain planning sections. A CSDD can be an architecture document AND a design input artifact. A Test Protocol can be both a verification plan AND a verification report.

INSTRUCTIONS FOR COGNITIVE ACCURACY (ZERO HALLUCINATION POLICY) - STRICT REGULATORY COMPLIANCE PROTOCOL:
1. You are conducting a rigorous, evidence-based compliance audit. You require strict objective evidence for compliance. 
2. Search through ALL uploaded documents thoroughly for exact mathematical or procedural proof.
3. EXTREME CAUTION AGAINST FALSE POSITIVES (LETHAL): If a document uses a buzzword (e.g., "We performed Biocompatibility testing") but completely lacks the actual raw proof (e.g., sample sizes, extraction methods, signatures, timestamps), YOU MUST EXPLICITLY FAIL IT. Do not give the company the benefit of the doubt. 
4. CHAIN OF THOUGHT: You must write your 'analytical_reasoning' FIRST. Mentally verify the engineering constraint is met before continuing, but keep this written justification extremely brief (1 short sentence) to conserve processing bandwidth.
5. If found: false, you must populate 'exact_missing_evidence' telling the engineers exactly what physical object or metric they forgot to include.
6. GOLDEN DATASET MEMORY (PSEUDO-RAG): Cross-reference the uploaded document against your vast internal pre-trained knowledge of actual, successfully cleared FDA 510(k) submissions. If the core medical device safety data exists and matches successful historical precedents, but uses slightly different start-up formatting or synonyms, do NOT fail it on semantics. You are strict regarding missing objective evidence, but accommodating to formatting variations.

CONFIDENCE SCALE:
- "high": The requirement is explicitly addressed. You can cite a direct quote.
- "medium": The requirement is addressed, but the evidence is brief or uses alternate terminology. (This still counts as compliant!)
- "low": Tangential or inadequate mention. 

CRITICAL RULE FOR MISSING EVIDENCE: If you cannot find a direct quote that satisfies the requirement, you MUST STRICTLY RETURN "found": false. Do not hallucinate compliance. A false positive in medical device compliance literally risks human lives. Do not automatically return true with low confidence.

AUTOMATED SOURCE EXTRACTION MATRIX (CRITICAL):
If found: true (even with medium confidence), you MUST extract the exact node references into the 'citations' array:
1. "source": The exact filename (e.g., 'Software_Requirements_v2.docx'). Do not invent names.
2. "section": The exact paragraph, page, or subsection number.
3. "quote": An exact string extraction of the evidence. ZERO PARAPHRASING ALLOWED. Treat this like a strict regex match.

FORMATTING & LENGTH CONSTRAINTS (CRITICAL!):
1. "analytical_reasoning": Keep it extremely brief (max 1 sentence or 100 chars). Think step-by-step mathematically, but talk fast.
2. "exact_missing_evidence": If failing them, DO NOT COMPROMISE. Write an extremely detailed, uncompromising description of the exact engineering tests, metrics, equations, and physical artifacts missing. Provide specific, actionable guidance for the regulatory affairs user on how to fix the deficit (Write 2-4 comprehensive sentences).
3. "source" (filename): Never use more than the first 30 characters of a filename. 
4. "quote": Must be strictly under 100 characters. DO NOT get stuck repeating text.
5. "remediationSteps": Provide exactly 1 or 2 short bullet points.

COST & TIMELINE ESTIMATION:
If the requirement is NOT met (found=false or confidence=low), estimate the remediation effort:
- estimatedCost: a cost range in USD (e.g., "$2,000 - $5,000") based on documentation/testing complexity
- estimatedTimeline: a time range (e.g., "4-6 weeks") based on typical regulatory work
- remediationSteps: list of 2-4 specific action items to address the gap

If the requirement IS met (found=true, confidence=high/medium), set cost to "—", timeline to "—", and remediationSteps to [].

RESPOND IN EXACTLY THIS JSON FORMAT (you MUST return a JSON array containing one object per ruleId. Do NOT wrap in markdown codeblocks):
[
  {
    "ruleId": "the string ID from the rules list",
    "analytical_reasoning": "step-by-step analysis of exactly why it passes or fails",
    "exact_missing_evidence": "absent artifact if missing",
    "found": true/false,
    "confidence": "high"/"medium"/"low",
    "citations": [
      {
        "source": "document name",
        "section": "section or page reference",
        "quote": "relevant excerpt (max 200 chars)"
      }
    ],
    "estimatedCost": "$X,XXX - $X,XXX" or "—",
    "estimatedTimeline": "X-X weeks" or "—",
    "remediationSteps": ["step 1", "step 2"]
  }
]`;

    const parts: any[] = [{ text: prompt }];

    for (const file of fileBuffers) {
        if (file.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            console.log(`[DEBUG] Converting .docx file to text: ${file.name}`);
            try {
                const result = await mammoth.extractRawText({ buffer: file.data });
                parts.push({ text: `\n\n--- Document: ${file.name} ---\n${result.value}\n--- End of ${file.name} ---\n` });
                console.log(`[DEBUG] Successfully converted ${file.name} (${result.value.length} chars)`);
            } catch (error) {
                console.error(`[DEBUG] Failed to convert ${file.name}:`, error);
                parts.push({ text: `\n\n--- Document: ${file.name} ---\n[Error: Could not extract text from this document]\n--- End of ${file.name} ---\n` });
            }
        } else if (file.mimeType === "text/plain") {
            console.log(`[DEBUG] Directly injecting plaintext: ${file.name}`);
            try {
                const textValue = file.data.toString("utf-8");
                parts.push({ text: `\n\n--- Document: ${file.name} ---\n${textValue}\n--- End of ${file.name} ---\n` });
                console.log(`[DEBUG] Successfully mapped ${file.name} (${textValue.length} chars)`);
            } catch (err) {
                console.error(`[DEBUG] Failed to map plaintext ${file.name}:`, err);
            }
        } else {
            console.log(`[DEBUG] Attempting secure File API upload for massive payload: ${file.name}`);
            const tempFilePath = path.join(os.tmpdir(), `tracebridge_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
            
            try {
                // 1. Write buffer to secure localhost /tmp path
                await fs.writeFile(tempFilePath, file.data);
                
                // 2. Upload file securely to Google API
                const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
                const uploadResponse = await fileManager.uploadFile(tempFilePath, {
                    mimeType: file.mimeType,
                    displayName: file.name,
                });
                
                console.log(`[DEBUG] File natively hosted at URI: ${uploadResponse.file.uri}`);
                
                // 3. Inject TINY link into the generation array instead of massive Base64
                parts.push({
                    file_data: { 
                        file_uri: uploadResponse.file.uri,
                        mime_type: file.mimeType
                    }
                });
            } catch (err) {
                console.error(`[DEBUG] Enterprise File Upload Failed, falling back to base64 legacy pipeline...`, err);
                parts.push({
                    inline_data: { mime_type: file.mimeType, data: file.data.toString("base64") }
                });
            } finally {
                // 4. Scrub the local temporary file
                try {
                    await fs.unlink(tempFilePath);
                } catch (cleanupErr) {
                    console.warn(`[DEBUG] Temp file cleanup warning:`, cleanupErr);
                }
            }
        }
    }

    // Enterprise Air-Gapped Simulation Block
    if (aiEngine === "local") {
        console.log(`[DEBUG] Attempting to connect to Air-Gapped Local Server (localhost:11434)...`);
        throw new Error("Air-Gapped Connection Refused: Local LLaMA 3 inference engine (localhost:11434) is offline or unreachable from this environment. Please start the local Ollama service.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    console.log(`[DEBUG] Using v1beta API endpoint / Model: gemini-2.5-flash`);

    try {
        const response = await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: parts }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json",
                            responseSchema: {
                                type: "ARRAY",
                                description: "List of gap analysis scorecards",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        ruleId: { type: "STRING" },
                                        analytical_reasoning: { type: "STRING" },
                                        exact_missing_evidence: { type: "STRING" },
                                        found: { type: "BOOLEAN" },
                                        confidence: { type: "STRING" },
                                        citations: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    source: { type: "STRING" },
                                                    section: { type: "STRING" },
                                                    quote: { type: "STRING" }
                                                }
                                            }
                                        },
                                        estimatedCost: { type: "STRING" },
                                        estimatedTimeline: { type: "STRING" },
                                        remediationSteps: { type: "ARRAY", items: { type: "STRING" } }
                                    },
                                    required: ["ruleId", "analytical_reasoning", "exact_missing_evidence", "found", "confidence", "citations", "estimatedCost", "estimatedTimeline", "remediationSteps"]
                                }
                            }
                }
            }),
            timeout: 120000 
        });

        console.log(`[DEBUG] Response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[DEBUG] API Error: ${errorText}`);
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`[DEBUG] Received response from Gemini`);
        
        const candidate = data.candidates?.[0];
        if (candidate?.finishReason === "MAX_TOKENS") {
            console.warn("[DEBUG] WARNING: Output truncated due to MAX_TOKENS limit!");
        }

        let text = candidate?.content?.parts?.[0]?.text || "";
        
        // Strip out any trailing markdown artifacts
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error("Failed to cleanly parse JSON Array. Trying aggressive regex extraction...");
            const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            console.error("Fatal JSON parse failure. Raw text snippet:", text.substring(0, 500));
            throw parseError;
        }
    } catch (error) {
        console.error("[DEBUG] Gemini REST API error:", error);
        throw new Error(`Analysis failed or timed out: ${error instanceof Error ? error.message : 'Unknown API error'}`);
    }
}
