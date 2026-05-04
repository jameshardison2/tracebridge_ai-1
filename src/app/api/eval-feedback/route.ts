import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { gapResult, reason } = body;

        if (!gapResult || !reason) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'false_positive_report',
            gapId: gapResult.id,
            standard: gapResult.standard,
            section: gapResult.section,
            requirement: gapResult.requirement,
            ai_confidence: gapResult.confidenceScore,
            ai_reasoning: gapResult.geminiResponse || gapResult.gapTitle,
            user_correction_reason: reason,
        };

        // Append to local JSONL Golden Dataset
        const filePath = path.join(process.cwd(), 'demo_data', 'golden_dataset_evals.jsonl');
        const fileContent = JSON.stringify(logEntry) + '\n';
        
        try {
            await fs.appendFile(filePath, fileContent);
        } catch (e) {
            console.error("Failed to append to golden dataset:", e);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Feedback submission error:', error);
        return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 });
    }
}
