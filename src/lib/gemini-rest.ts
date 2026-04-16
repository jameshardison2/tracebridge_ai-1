/**
 * Direct Gemini REST API implementation
 * Uses v1 API instead of v1beta to avoid model access issues
 */

import mammoth from "mammoth";

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
const MOCK_MODE = process.env.GEMINI_MOCK_MODE === "true";

/**
 * Mock response generator for testing
 */
function generateMockResponse(
    requirement: string,
    standard: string,
    section: string
): {
    found: boolean;
    confidence: "high" | "medium" | "low";
    citations: { source: string; section: string; quote: string }[];
    rawResponse: string;
    estimatedCost: string;
    estimatedTimeline: string;
    remediationSteps: string[];
} {
    const random = Math.random();

    if (random < 0.4) {
        return {
            found: true,
            confidence: "high",
            citations: [
                {
                    source: "Mock Document",
                    section: section,
                    quote: `Evidence found for: ${requirement.substring(0, 100)}...`
                }
            ],
            rawResponse: `Mock: Found evidence for ${standard} ${section}`,
            estimatedCost: "—",
            estimatedTimeline: "—",
            remediationSteps: [],
        };
    } else if (random < 0.7) {
        return {
            found: true,
            confidence: "medium",
            citations: [
                {
                    source: "Mock Document",
                    section: section,
                    quote: `Partial evidence for: ${requirement.substring(0, 100)}...`
                }
            ],
            rawResponse: `Mock: Partial evidence for ${standard} ${section}`,
            estimatedCost: "—",
            estimatedTimeline: "—",
            remediationSteps: [],
        };
    } else {
        return {
            found: false,
            confidence: "low",
            citations: [],
            rawResponse: `Mock: No evidence found for ${standard} ${section}`,
            estimatedCost: "$3,000 - $8,000",
            estimatedTimeline: "4-8 weeks",
            remediationSteps: ["Draft missing documentation", "Engage regulatory consultant", "Conduct testing if required"],
        };
    }
}

/**
 * Query Gemini using direct REST API (v1)
 * Optimized for Single-Prompt Batching
 */
export async function queryGeminiRESTArray(
    fileBuffers: { data: Buffer; mimeType: string; name: string }[],
    rules: { id: string; requirement: string; standard: string; section: string; expectedDocument: string }[]
): Promise<any[]> {
    console.log(`[DEBUG] Querying Gemini REST API for batch of ${rules.length} rules!`);
    console.log(`[DEBUG] API Key present: ${!!GEMINI_API_KEY}`);
    console.log(`[DEBUG] Mock mode: ${MOCK_MODE}`);

    // Build the rules payload string
    const rulesListString = rules.map(r => `ruleId: ${r.id}\nSTANDARD: ${r.standard}\nSECTION: ${r.section}\nREQUIREMENT: ${r.requirement}\nEXPECTED DOCUMENT: ${r.expectedDocument}`).join('\n\n');

    if (MOCK_MODE) {
        console.log(`[MOCK MODE] Analyzing ${rules.length} rules (Batch)`);
        await new Promise(resolve => setTimeout(resolve, 100));
        return rules.map(r => {
            const mock = generateMockResponse(r.requirement, r.standard, r.section);
            return { ruleId: r.id, ...mock };
        });
    }

    const prompt = `You are a regulatory compliance auditor reviewing medical device documentation.

TASK: Determine if the uploaded documents contain sufficient evidence for EACH of the following regulatory requirements. You will return exactly ONE JSON array containing an object for every rule.

--- RULES TO EVALUATE ---
${rulesListString}
-------------------------

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

INSTRUCTIONS:
1. Search through ALL uploaded documents thoroughly — look at headings, section titles, content, and conclusions.
2. Match on CONTENT, not filename: a document called "V&V_Report.docx" may contain the Software Development Plan inside it.
3. A requirement is met if the SUBSTANCE is addressed anywhere, even spread across multiple documents.
4. Provide specific citations with document name, section/heading, and relevant quotes.

CONFIDENCE SCALE:
- "high": The requirement is explicitly and clearly addressed with substantive evidence.
- "medium": The requirement is addressed, but the evidence is brief, spread across sections, or uses alternate terminology. This still counts as compliant!
- "low": Tangential or inadequate mention. 

CRITICAL RULE FOR MISSING EVIDENCE: If you are looking for a major component (e.g. Risk Management, Software Code, Biocompatibility) and you cannot find ANY meaningful evidence in the documents, YOU MUST STRICTLY RETURN "found": false! Do not be afraid to say it's missing. Missing evidence is a "gap_detected". Do not automatically return true with low confidence.

FORMATTING & LENGTH CONSTRAINTS (CRITICAL!):
1. "source" (filename): Never use more than the first 30 characters of a filename. 
2. "quote": Must be strictly under 100 characters. DO NOT get stuck repeating text.
3. "reasoning": Give a 1-sentence assessment. Maximum 150 characters. Keep it brief.
4. "remediationSteps": Provide exactly 1 or 2 extremely short bullet points (max 10 words each).

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
    "found": true/false,
    "confidence": "high"/"medium"/"low",
    "citations": [
      {
        "source": "document name",
        "section": "section or page reference",
        "quote": "relevant excerpt (max 200 chars)"
      }
    ],
    "reasoning": "brief explanation of your assessment",
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
        } else {
            parts.push({
                inline_data: { mime_type: file.mimeType, data: file.data.toString("base64") }
            });
        }
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
                                reasoning: { type: "STRING" },
                                estimatedCost: { type: "STRING" },
                                estimatedTimeline: { type: "STRING" },
                                remediationSteps: { type: "ARRAY", items: { type: "STRING" } }
                            },
                            required: ["ruleId", "found", "confidence", "citations", "reasoning", "estimatedCost", "estimatedTimeline", "remediationSteps"]
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
        throw error;
    }
}
