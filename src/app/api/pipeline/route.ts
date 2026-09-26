import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// GET pipeline tasks for a specific uploadId
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get("uploadId");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!uploadId) {
        return NextResponse.json({ success: false, error: "Missing uploadId" }, { status: 400 });
    }

    try {
        if (!adminDb) throw new Error("Database not initialized");
        const token = authHeader.split("Bearer ")[1];
        await adminAuth?.verifyIdToken(token); // Verify auth but we don't strictly isolate reads by UID here for the demo yet

        const docRef = adminDb.collection("pipeline_tasks").doc(uploadId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return NextResponse.json({ success: true, data: docSnap.data()?.tasks || [] });
        } else {
            return NextResponse.json({ success: true, data: [] });
        }
    } catch (error) {
        console.error("Pipeline GET Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

// POST to update the entire pipeline state for a specific uploadId
export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        if (!adminDb) throw new Error("Database not initialized");
        const token = authHeader.split("Bearer ")[1];
        await adminAuth?.verifyIdToken(token);

        const body = await req.json();
        const { uploadId, tasks } = body;

        if (!uploadId || !Array.isArray(tasks)) {
            return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
        }

        const docRef = adminDb.collection("pipeline_tasks").doc(uploadId);
        await docRef.set({ tasks, updatedAt: new Date() }, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Pipeline POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
