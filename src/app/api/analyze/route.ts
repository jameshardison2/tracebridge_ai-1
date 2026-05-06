import { NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { runGapAnalysis, getGapSummary } from "@/lib/gap-engine";
import { Timestamp } from "firebase-admin/firestore";
import { AuditLog } from "@/lib/firestore-types";
import * as fs from "fs";
import * as path from "path";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Core analysis logic - runs in background (not blocking the HTTP response).
 */
async function runAnalysisInBackground(uploadId: string): Promise<void> {
    if (!adminDb || !adminStorage) return;

    try {
        // Mark as analyzing
        await adminDb.collection("uploads").doc(uploadId).update({
            status: "analyzing",
            updatedAt: Timestamp.now(),
        });

        const uploadDoc = await adminDb.collection("uploads").doc(uploadId).get();
        if (!uploadDoc.exists) throw new Error("Upload not found");
        const upload = { id: uploadDoc.id, ...uploadDoc.data() } as any;

        // Download files from Firebase Storage
        const documentsSnapshot = await adminDb
            .collection("documents")
            .where("uploadId", "==", uploadId)
            .get();

        if (documentsSnapshot.empty) throw new Error("No documents found");

        const bucket = adminStorage.bucket();
        const fileBuffers: { data: Buffer; mimeType: string; name: string }[] = [];
        const qsubBuffers: { data: Buffer; mimeType: string; name: string }[] = [];

        for (const doc of documentsSnapshot.docs) {
            const { storagePath, fileName, fileType, isQSub } = doc.data();
            if (!storagePath) continue;

            try {
                console.log(`[ANALYZE] Downloading ${fileName}...`);
                const file = bucket.file(storagePath);
                const [buffer] = await file.download();

                let mimeType = "application/pdf";
                if (fileType === "docx") {
                    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                } else if (fileType === "txt") {
                    mimeType = "text/plain";
                }

                if (isQSub) {
                    qsubBuffers.push({ data: buffer, mimeType, name: fileName });
                } else {
                    fileBuffers.push({ data: buffer, mimeType, name: fileName });
                }
                console.log(`[ANALYZE] Downloaded ${fileName} (${(buffer.length / 1024).toFixed(0)}KB)`);
            } catch (err) {
                console.error(`[ANALYZE] Failed to download ${fileName}:`, err);
            }
        }

        if (fileBuffers.length === 0) throw new Error("Failed to download any documents");

        // Clear previous results
        const previousResults = await adminDb
            .collection("gapResults")
            .where("uploadId", "==", uploadId)
            .get();

        if (!previousResults.empty) {
            const batch = adminDb.batch();
            previousResults.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
        }

        // ─────────────────────────────────────────────────────────────────
        // RAG PIPELINE: Inject Live FDA Precedent Data
        // ─────────────────────────────────────────────────────────────────
        let fdaPrecedents: any[] = [];
        try {
            const chunksPath = path.join(process.cwd(), 'src/pipeline/rag-chunks.jsonl');
            if (fs.existsSync(chunksPath)) {
                const fileContent = fs.readFileSync(chunksPath, 'utf8');
                const chunks = fileContent.split('\n').filter(Boolean).map(line => JSON.parse(line));
                // For the MVP demo, grab the NSE records as anti-patterns
                fdaPrecedents = chunks.filter((c: any) => c.category === 'nse');
                console.log(`[RAG Engine] Loaded ${fdaPrecedents.length} FDA historical precedents into memory.`);
            }
        } catch (err) {
            console.error("[RAG Engine] Failed to load RAG chunks:", err);
        }

        // Run gap analysis (this is the slow part - Gemini calls)
        const results = await runGapAnalysis(
            uploadId,
            upload.standards as string[],
            fileBuffers,
            qsubBuffers,
            upload.aiEngine,
            fdaPrecedents
        );

        const summary = getGapSummary(results);

        // Mark complete
        await adminDb.collection("uploads").doc(uploadId).update({
            status: "complete",
            updatedAt: Timestamp.now(),
        });

        // Zero Data Retention (ZDR) Execution
        if (upload.zdrEnabled) {
            console.log(`[ZDR] Zero Data Retention active for ${uploadId}. Purging file artifacts...`);
            const bucket = adminStorage.bucket();
            for (const doc of documentsSnapshot.docs) {
                const { storagePath } = doc.data();
                if (storagePath) {
                    try {
                        await bucket.file(storagePath).delete();
                        console.log(`[ZDR] Deleted ${storagePath} from bucket.`);
                    } catch (e) {
                        console.error(`[ZDR] Failed to delete ${storagePath}`, e);
                    }
                }
                // Also delete the metadata document to prevent broken links
                await doc.ref.delete();
            }
            console.log(`[ZDR] Purge complete.`);
        }

        // Audit log
        const auditLog: AuditLog = {
            userId: upload.userId as string,
            action: "analyze",
            details: { uploadId, rulesChecked: summary.total, gapsFound: summary.gaps, complianceScore: summary.complianceScore },
            createdAt: Timestamp.now(),
        };
        await adminDb.collection("auditLogs").add(auditLog);

        console.log(`[ANALYZE] Complete for ${uploadId} - ${summary.complianceScore}% compliant`);
    } catch (error) {
        console.error("[ANALYZE] Background analysis failed:", error);
        if (adminDb) {
            await adminDb.collection("uploads").doc(uploadId).update({
                status: "failed",
                errorMessage: error instanceof Error ? error.message : "Analysis failed",
                updatedAt: Timestamp.now(),
            }).catch(() => { });
        }
    }
}

/**
 * POST /api/analyze
 * Kicks off background analysis and returns immediately (202 Accepted).
 * Frontend polls /api/reports?uploadId=... for status updates.
 */
export async function POST(request: Request) {
    try {
        if (!adminDb || !adminStorage) {
            return NextResponse.json(
                { success: false, error: "Firebase not configured" },
                { status: 503 }
            );
        }

        const contentType = request.headers.get("content-type") || "";
        let uploadId: string | null = null;

        if (contentType.includes("application/json")) {
            const body = await request.json();
            uploadId = body.uploadId || null;
        } else {
            const formData = await request.formData();
            uploadId = formData.get("uploadId") as string;
        }

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

        // Await the analysis. Vercel maxDuration is 300s, which is enough time.
        // We cannot use 'void' fire-and-forget in Vercel because the container freezes when the response is sent.
        await runAnalysisInBackground(uploadId);

        return NextResponse.json({
            success: true,
            status: "complete",
            uploadId,
            message: "Analysis complete.",
        });
    } catch (error) {
        console.error("Analyze route error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to start analysis" },
            { status: 500 }
        );
    }
}
