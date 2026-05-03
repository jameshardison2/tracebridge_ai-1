import { NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";

export async function GET(req: Request) {
    try {
        if (!adminDb) {
            return NextResponse.json({ success: true, data: [] });
        }

        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        
        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        if (!verification.success || !verification.uid) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const uploadId = searchParams.get("uploadId");
        const userId = searchParams.get("userId");

        let query: FirebaseFirestore.Query = adminDb.collection("auditLogs");
        
        if (uploadId) {
            query = query.where("details.uploadId", "==", uploadId);
        }
        if (userId) {
            query = query.where("userId", "in", [userId, "system"]);
        }
        
        const logsSnapshot = await query
            .limit(200)
            .get();

        const logs: any[] = [];
        for (const doc of logsSnapshot.docs) {
            logs.push({ id: doc.id, ...doc.data() });
        }

        // Sort in memory to avoid Firebase Composite Index requirements
        logs.sort((a, b) => {
            const timeA = a.createdAt?._seconds || 0;
            const timeB = b.createdAt?._seconds || 0;
            return timeB - timeA;
        });

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

        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        
        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        if (!verification.success || !verification.uid) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
        }

        const body = await req.json();
        
        await adminDb.collection("auditLogs").add({
            action: body.action || "webhook_event",
            userId: body.userId || verification.uid,
            createdAt: new Date(),
            details: body.details || {}
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Logs POST Error:", error);
        return NextResponse.json({ success: false, error: "Failed to create log" }, { status: 500 });
    }
}
