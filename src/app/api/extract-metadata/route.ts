import { NextResponse } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import mammoth from "mammoth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(request: Request) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ success: false, error: "GEMINI_API_KEY missing" }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        let documentParts: any[] = [];
        const isDocx = file.name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        
        if (isDocx) {
            try {
                const result = await mammoth.extractRawText({ buffer });
                // Limit to first 50000 chars (approx 10000 words) for metadata extraction to save tokens and prevent huge payload errors
                documentParts.push({ text: `\n\n--- Document: ${file.name} ---\n${result.value.substring(0, 50000)}\n--- End of ${file.name} ---\n` });
            } catch (error) {
                console.error("Mammoth extract error:", error);
                documentParts.push({ text: `[Error extracting text from ${file.name}]` });
            }
        } else {
            const tempFilePath = path.join(os.tmpdir(), `tracebridge_extract_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
            let uploadResponse;
            try {
                await fs.writeFile(tempFilePath, buffer);
                const fileManager = new GoogleAIFileManager(GEMINI_API_KEY);
                uploadResponse = await fileManager.uploadFile(tempFilePath, {
                    mimeType: file.type || "application/pdf",
                    displayName: file.name,
                });
                documentParts.push({ file_data: { file_uri: uploadResponse.file.uri, mime_type: file.type || "application/pdf" } });
            } finally {
                try { await fs.unlink(tempFilePath); } catch (e) { }
            }
        }

        // We load the valid FDA product codes so Gemini can select the right one
        let validCodesContext = "";
        try {
            const fdaCodes = require("@/lib/fda-product-codes.json");
            validCodesContext = fdaCodes.map((c: any) => `${c.code} - ${c.deviceName} (${c.deviceClass})`).join("\n");
        } catch (e) {
            console.error("Could not load fda-product-codes.json", e);
        }

        const prompt = `You are a medical device regulatory expert. 
Review the attached document and identify:
1. The formal Device Name (or software product name).
2. The most appropriate 3-letter FDA Product Code from the provided list.

VALID FDA PRODUCT CODES TO CHOOSE FROM:
${validCodesContext}

If you are unsure of the Product Code, choose the closest match for software (e.g., "OMN", "PZO", "LLZ", "QNP").
If you cannot find the device name, provide a generic description.

Respond ONLY with a JSON object in this exact format:
{
  "deviceName": "The Name",
  "productCode": "ABC"
}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        ...documentParts
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            deviceName: { type: "STRING" },
                            productCode: { type: "STRING" }
                        },
                        required: ["deviceName", "productCode"]
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${await response.text()}`);
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        const parsed = JSON.parse(text);

        return NextResponse.json({
            success: true,
            data: {
                deviceName: parsed.deviceName || "",
                productCode: parsed.productCode || ""
            }
        });

    } catch (error) {
        console.error("Extract API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to extract metadata" }, { status: 500 });
    }
}
