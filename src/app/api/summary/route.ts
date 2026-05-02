import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 30; // 30 seconds should be plenty for a quick summary
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { deviceName, complianceScore, gaps, passed } = body;

        if (!deviceName) {
            return NextResponse.json({ success: false, error: "Missing device name" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ success: false, error: "Missing Gemini API Key" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
You are a highly experienced Regulatory Affairs AI Copilot. 
Your task is to write a brief, 2-3 sentence Executive Summary of a recent FDA compliance audit for a medical device.

Device: ${deviceName}
Compliance Score: ${complianceScore}%
Passed Rules: ${passed.join(", ") || "None"}
Failed Rules (Critical Gaps): ${gaps.join(", ") || "None"}

Instructions:
1. Write in a highly professional, authoritative tone suitable for a VP of Engineering or Regulatory Affairs Director.
2. If there are gaps, specifically name the most critical ones and state that they require immediate remediation before submission.
3. If compliance is high/perfect, state that the device's documentation is robust and audit-ready.
4. Keep it exactly 2-3 sentences. Do not use bullet points. Do not include greetings. Just the raw summary paragraph.
`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return NextResponse.json({
            success: true,
            summary: responseText.trim(),
        });

    } catch (error) {
        console.error("Summary Generation Error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to generate summary" },
            { status: 500 }
        );
    }
}
