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
