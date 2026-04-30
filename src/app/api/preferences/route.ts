import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        if (!adminAuth) throw new Error("Firebase Auth not initialized");
        const decoded = await adminAuth.verifyIdToken(token);
        const uid = decoded.uid;

        if (!adminDb) throw new Error("Firebase Database not initialized");

        const docSnap = await adminDb.collection("user_preferences").doc(uid).get();
        if (docSnap.exists) {
            return NextResponse.json({ success: true, data: docSnap.data() });
        } else {
            return NextResponse.json({ success: true, data: {} });
        }
    } catch (error) {
        console.error("Fetch Preferences Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        if (!adminAuth) throw new Error("Firebase Auth not initialized");
        const decoded = await adminAuth.verifyIdToken(token);
        const uid = decoded.uid;

        if (!adminDb) throw new Error("Firebase Database not initialized");

        const body = await req.json();
        
        await adminDb.collection("user_preferences").doc(uid).set(body, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save Preferences Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
