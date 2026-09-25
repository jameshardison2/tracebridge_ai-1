import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { classifyComplaint } from "@/lib/complaints-classifier";
import { Timestamp } from "firebase-admin/firestore";

export const maxDuration = 60; // 60 seconds should be plenty for classifying a single complaint

export async function POST(request: Request) {
    if (!adminDb) {
        return NextResponse.json(
            { success: false, error: "Firebase not configured" },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();

        // Very basic validation for MVP
        if (!body.raw_text && !body.description) {
            return NextResponse.json(
                { success: false, error: "Missing 'raw_text' or 'description' in payload." },
                { status: 400 }
            );
        }

        const source = body.source || "api_webhook";
        const metadata = body.metadata || {};

        // 1. Create the complaint record in Firestore
        const complaintData = {
            raw_text: body.raw_text || body.description,
            source: source,
            metadata: metadata,
            status: "pending_classification",
            received_at: Timestamp.now(),
        };

        const docRef = await adminDb.collection("complaints").add(complaintData);
        
        console.log(`[Complaint Intake] Received new complaint: ${docRef.id}`);

        // 2. Trigger the classification synchronously (Vercel will wait up to maxDuration)
        // In a high-volume prod environment, you would push to a Pub/Sub queue here instead.
        // For the MVP, we just await it inline to keep the architecture simple.
        await classifyComplaint(docRef.id);

        return NextResponse.json({
            success: true,
            message: "Complaint received and sent for classification.",
            complaintId: docRef.id
        }, { status: 201 });

    } catch (error) {
        console.error("[Complaint Intake] Error processing webhook:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process complaint payload." },
            { status: 500 }
        );
    }
}
