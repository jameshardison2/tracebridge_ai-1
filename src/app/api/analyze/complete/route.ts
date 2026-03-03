import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getGapSummary } from "@/lib/gap-engine";
import { Timestamp } from "firebase-admin/firestore";
import { AuditLog } from "@/lib/firestore-types";

export const dynamic = "force-dynamic";

/**
 * POST /api/analyze/complete
 * Called after all individual rules have been analyzed.
 * Marks the upload as complete and creates an audit log.
 */
export async function POST(request: Request) {
    try {
        if (!adminDb) {
            return NextResponse.json(
                { success: false, error: "Firebase not configured" },
                { status: 503 }
            );
        }

        const { uploadId } = await request.json();
        if (!uploadId) {
            return NextResponse.json(
                { success: false, error: "Missing uploadId" },
                { status: 400 }
            );
        }

        const uploadDoc = await adminDb.collection("uploads").doc(uploadId).get();
        if (!uploadDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Upload not found" },
                { status: 404 }
            );
        }

        const upload = uploadDoc.data()!;

        // Get all gap results for summary
        const gapResultsSnapshot = await adminDb
            .collection("gapResults")
            .where("uploadId", "==", uploadId)
            .get();

        const results = gapResultsSnapshot.docs.map(doc => ({
            status: doc.data().status,
        }));

        const total = results.length;
        const compliant = results.filter(r => r.status === "compliant").length;
        const gaps = results.filter(r => r.status === "gap_detected").length;
        const needsReview = results.filter(r => r.status === "needs_review").length;
        const complianceScore = total > 0 ? Math.round((compliant / total) * 100) : 0;

        // Mark upload as complete
        await adminDb.collection("uploads").doc(uploadId).update({
            status: "complete",
            updatedAt: Timestamp.now(),
        });

        // Audit log
        const auditLog: AuditLog = {
            userId: upload.userId as string,
            action: "analyze",
            details: { uploadId, rulesChecked: total, gapsFound: gaps, complianceScore },
            createdAt: Timestamp.now(),
        };
        await adminDb.collection("auditLogs").add(auditLog);

        return NextResponse.json({
            success: true,
            data: {
                uploadId,
                summary: { total, compliant, gaps, needsReview, complianceScore },
            },
        });
    } catch (error) {
        console.error("Analyze/complete error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to complete analysis" },
            { status: 500 }
        );
    }
}
