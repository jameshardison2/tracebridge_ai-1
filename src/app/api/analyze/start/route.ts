import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { getRulesForStandards } from "@/lib/gap-engine";
import { Timestamp } from "firebase-admin/firestore";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/analyze/start
 * Phase 1: Returns the list of rules to check and prepares file data.
 * Stores downloaded file data in a temp Firestore doc so /api/analyze/rule can use it.
 */
export async function POST(request: Request) {
    try {
        if (!adminDb || !adminStorage) {
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

        // Mark as analyzing
        await adminDb.collection("uploads").doc(uploadId).update({
            status: "analyzing",
            updatedAt: Timestamp.now(),
        });

        // Get rules to check
        const rules = await getRulesForStandards(upload.standards as string[]);
        const applicableRules = rules.filter(
            r => r.expectedDocument !== "(Not applicable)" &&
                r.expectedDocument !== "- not applicable -" &&
                r.expectedDocument.trim() !== ""
        );

        // Clear any previous gap results for this upload
        const previousResults = await adminDb
            .collection("gapResults")
            .where("uploadId", "==", uploadId)
            .get();

        if (!previousResults.empty) {
            const batch = adminDb.batch();
            previousResults.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        return NextResponse.json({
            success: true,
            data: {
                uploadId,
                rules: applicableRules.map(r => ({
                    id: r.id,
                    standard: r.standard,
                    section: r.section,
                    requirement: r.requirement,
                    expectedDocument: r.expectedDocument,
                    requiredForClass: r.requiredForClass,
                })),
                totalRules: applicableRules.length,
            },
        });
    } catch (error) {
        console.error("Analyze/start error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to start analysis" },
            { status: 500 }
        );
    }
}
