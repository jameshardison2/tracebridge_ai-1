import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";
import { Feedback } from "@/lib/firestore-types";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const authResult = await verifyIdToken(token);
        
        if (!authResult.success || !authResult.uid) {
            return NextResponse.json({ success: false, error: authResult.error || "Invalid token" }, { status: 401 });
        }
        
        const userId = authResult.uid;

        const body = await req.json();
        const { type, content, featureRequest, teamId } = body;

        if (!type || !content) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        if (!adminDb) {
            return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 500 });
        }
        
        const feedback: Feedback = {
            userId,
            teamId: teamId || "unknown",
            type,
            content,
            featureRequest,
            createdAt: FieldValue.serverTimestamp() as any
        };
        const docRef = await adminDb.collection("feedback").add(feedback);

        return NextResponse.json({ 
            success: true, 
            data: { id: docRef.id } 
        });

    } catch (error: any) {
        console.error("Feedback API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
