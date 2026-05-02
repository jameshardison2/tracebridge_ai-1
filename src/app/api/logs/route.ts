import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get("uploadId");


    try {
        if (!adminDb) {
            return NextResponse.json({ success: true, data: [] });
        }

        let query: FirebaseFirestore.Query = adminDb.collection("auditLogs");
        
        if (uploadId) {
            query = query.where("details.uploadId", "==", uploadId);
        }
        
        const logsSnapshot = await query
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();

        const logs = [];
        for (const doc of logsSnapshot.docs) {
            logs.push({ id: doc.id, ...doc.data() });
        }

        return NextResponse.json({ success: true, data: logs });
    } catch (error) {
        console.error("Logs API Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch logs" }, { status: 500 });
    }
}


export async function POST(req: Request) {
    try {
        if (!adminDb) {
            return NextResponse.json({ success: true, dummy: true });
        }
        const body = await req.json();
        
        await adminDb.collection("auditLogs").add({
            action: body.action || "webhook_event",
            userId: body.userId || "system",
            createdAt: new Date(),
            details: body.details || {}
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logs POST Error:", error);
        return NextResponse.json({ success: false, error: "Failed to create log" }, { status: 500 });
    }
}
