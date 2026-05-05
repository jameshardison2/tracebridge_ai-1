import { NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";
import { formatForEstar, TraceBridgeResult } from "@/lib/estar-formatter";
import { submitToEsgNextGen } from "@/lib/esg-client";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        if (!adminDb) {
            return NextResponse.json({ success: false, error: "Firebase not configured" }, { status: 503 });
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        if (!verification.success || !verification.uid) {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
        }

        const userId = verification.uid;
        const userDoc = await adminDb.collection("users").doc(userId).get();
        const userEmail = userDoc.data()?.email || "unknown@tracebridge.ai";

        // Parse incoming TraceBridge analysis result to submit
        const body = await request.json();
        const tbResult: TraceBridgeResult = body.result;

        if (!tbResult || !tbResult.reportId) {
            return NextResponse.json({ success: false, error: "Invalid TraceBridge result payload" }, { status: 400 });
        }

        // 1. Format the data into an eSTAR compliant structure
        const estarPayload = formatForEstar(tbResult, userEmail);

        // 2. Transmit to FDA ESG NextGen (Test Environment)
        const esgResponse = await submitToEsgNextGen(estarPayload, "test");

        if (!esgResponse.success) {
            return NextResponse.json({ success: false, error: "Failed to transmit to ESG NextGen" }, { status: 502 });
        }

        // 3. Save the submission record to Firestore
        const submissionRef = await adminDb.collection("esg_submissions").add({
            userId,
            reportId: tbResult.reportId,
            fdaCoreId: esgResponse.fdaCoreId,
            status: esgResponse.status,
            srsScoreAtSubmission: tbResult.srsScore,
            submittedAt: Timestamp.now(),
        });

        return NextResponse.json({
            success: true,
            data: {
                submissionId: submissionRef.id,
                fdaCoreId: esgResponse.fdaCoreId,
                status: esgResponse.status
            }
        });

    } catch (error) {
        console.error("ESG Submit Error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
