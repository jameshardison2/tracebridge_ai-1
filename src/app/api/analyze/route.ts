import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { runGapAnalysis, getGapSummary } from "@/lib/gap-engine";
import { Timestamp } from "firebase-admin/firestore";
import { AuditLog } from "@/lib/firestore-types";

// Increase timeout for this route (Gemini API can be slow)
export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";

/**
 * POST /api/analyze
 * Run gap analysis on an upload.
 * 
 * BUG-001 FIX: Instead of re-uploading files (which hits Vercel's 4.5MB body limit),
 * we now download files directly from Firebase Storage using the stored metadata.
 * The request body only needs the uploadId (tiny JSON payload).
 */
export async function POST(request: Request) {
    let uploadId: string | null = null;

    try {
        // Check if Firebase is initialized
        if (!adminDb || !adminStorage) {
            return NextResponse.json(
                { success: false, error: "Firebase not configured" },
                { status: 503 }
            );
        }

        // Accept either JSON body or FormData
        let body: { uploadId?: string };
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            body = await request.json();
        } else {
            // Backwards compatible: still accept FormData
            const formData = await request.formData();
            body = { uploadId: formData.get("uploadId") as string };
        }

        uploadId = body.uploadId || null;

        if (!uploadId) {
            return NextResponse.json(
                { success: false, error: "Missing uploadId" },
                { status: 400 }
            );
        }

        // Get upload from Firestore
        const uploadDoc = await adminDb.collection("uploads").doc(uploadId).get();

        if (!uploadDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Upload not found" },
                { status: 404 }
            );
        }

        const upload = { id: uploadDoc.id, ...uploadDoc.data() } as any;

        // Update status to analyzing
        await adminDb.collection("uploads").doc(uploadId).update({
            status: "analyzing",
            updatedAt: Timestamp.now(),
        });

        // BUG-001 FIX: Download files from Firebase Storage instead of re-uploading
        const documentsSnapshot = await adminDb
            .collection("documents")
            .where("uploadId", "==", uploadId)
            .get();

        if (documentsSnapshot.empty) {
            return NextResponse.json(
                { success: false, error: "No documents found for this upload" },
                { status: 400 }
            );
        }

        const bucket = adminStorage.bucket();
        const fileBuffers: { data: Buffer; mimeType: string; name: string }[] = [];

        for (const doc of documentsSnapshot.docs) {
            const docData = doc.data();
            const storagePath = docData.storagePath;
            const fileName = docData.fileName;
            const fileType = docData.fileType;

            if (!storagePath) {
                console.warn(`Document ${doc.id} has no storagePath, skipping`);
                continue;
            }

            try {
                console.log(`[ANALYZE] Downloading ${fileName} from Storage...`);
                const file = bucket.file(storagePath);
                const [buffer] = await file.download();

                // Determine MIME type
                let mimeType = "application/pdf";
                if (fileType === "docx") {
                    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } else if (fileType === "doc") {
                    mimeType = "application/msword";
                }

                fileBuffers.push({
                    data: buffer,
                    mimeType,
                    name: fileName,
                });
                console.log(`[ANALYZE] Downloaded ${fileName} (${(buffer.length / 1024).toFixed(0)}KB)`);
            } catch (downloadError) {
                console.error(`[ANALYZE] Failed to download ${fileName}:`, downloadError);
            }
        }

        if (fileBuffers.length === 0) {
            return NextResponse.json(
                { success: false, error: "Failed to download any documents from storage" },
                { status: 500 }
            );
        }

        // Clear previous results for this upload
        const previousResults = await adminDb
            .collection("gapResults")
            .where("uploadId", "==", uploadId)
            .get();

        if (!previousResults.empty) {
            const batch = adminDb.batch();
            previousResults.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

        // Run the gap analysis engine
        const results = await runGapAnalysis(
            uploadId,
            upload.standards as string[],
            fileBuffers
        );

        // Update upload status
        await adminDb.collection("uploads").doc(uploadId).update({
            status: "complete",
            updatedAt: Timestamp.now(),
        });

        // Generate summary
        const summary = getGapSummary(results);

        // Audit log
        const auditLog: AuditLog = {
            userId: upload.userId as string,
            action: "analyze",
            details: {
                uploadId,
                rulesChecked: summary.total,
                gapsFound: summary.gaps,
                complianceScore: summary.complianceScore,
            },
            createdAt: Timestamp.now(),
        };
        await adminDb.collection("auditLogs").add(auditLog);

        return NextResponse.json({
            success: true,
            data: {
                uploadId,
                deviceName: upload.deviceName,
                standards: upload.standards,
                summary,
                results,
            },
        });
    } catch (error) {
        console.error("Analysis error:", error);

        // Try to update status to failed if we have uploadId
        if (uploadId && adminDb) {
            await adminDb
                .collection("uploads")
                .doc(uploadId)
                .update({
                    status: "failed",
                    updatedAt: Timestamp.now(),
                })
                .catch(() => { });
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Gap analysis failed",
            },
            { status: 500 }
        );
    }
}
