import { NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";

export async function DELETE(request: Request) {
    try {
        if (!adminDb) return NextResponse.json({ success: false, error: "Firebase offline" }, { status: 503 });

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        if (!verification.success || !verification.uid) return NextResponse.json({ success: false, error: "Token validation failed" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const gapId = searchParams.get("id");

        if (!gapId) return NextResponse.json({ success: false, error: "Missing gap ID" }, { status: 400 });

        await adminDb.collection("gapResults").doc(gapId).delete();

        return NextResponse.json({ success: true, message: "Gap removed successfully." });
    } catch (error) {
        console.error("Gap deletion error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete gap" }, { status: 500 });
    }
}


export async function PATCH(request: Request) {
    try {
        if (!adminDb) return NextResponse.json({ success: false, error: "Firebase offline" }, { status: 503 });

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        if (!verification.success || !verification.uid) return NextResponse.json({ success: false, error: "Token validation failed" }, { status: 401 });

        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) return NextResponse.json({ success: false, error: "Missing id or status" }, { status: 400 });

        // Map frontend pipeline status to backend gap status
        let backendStatus = "needs_review";
        if (status === "CLOSED") backendStatus = "compliant";
        else if (status === "DETECTED" || status === "ASSIGNED" || status === "IN_REMEDIATION") backendStatus = "gap_detected";
        else backendStatus = "needs_review";

        await adminDb.collection("gapResults").doc(id).update({
            status: backendStatus,
            pipelineStatus: status, // Also save the specific Kanban column
            updatedAt: new Date()
        });

        return NextResponse.json({ success: true, message: "Gap updated successfully." });
    } catch (error) {
        console.error("Gap update error:", error);
        return NextResponse.json({ success: false, error: "Failed to update gap" }, { status: 500 });
    }
}
