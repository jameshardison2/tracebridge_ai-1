import { NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";
import { Upload, DocumentMetadata, AuditLog } from "@/lib/firestore-types";
import { Timestamp } from "firebase-admin/firestore";

// Route segment config
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST /api/upload
 * Create an upload record and store document metadata in Firestore.
 * 
 * Files are uploaded directly from the browser to Firebase Storage (client-side),
 * so this route only receives lightweight JSON metadata — no file size limits.
 * 
 * Expected body (JSON):
 * {
 *   deviceName: string,
 *   standards: string[],
 *   files: [{ fileName, fileType, fileSize, storagePath, storageUrl }],
 *   idToken?: string
 * }
 */
export async function POST(request: Request) {
    try {
        // Check if Firebase is initialized
        if (!adminDb) {
            return NextResponse.json(
                { success: false, error: "Firebase not configured. Please set Firebase credentials in .env" },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { deviceName, standards, files, idToken } = body;

        // Validate required fields
        if (!deviceName || !standards || !Array.isArray(standards) || !files || !Array.isArray(files) || files.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields: deviceName, standards, files",
                },
                { status: 400 }
            );
        }

        // Verify Firebase ID token if provided
        let userId: string;
        if (idToken) {
            const verification = await verifyIdToken(idToken);
            if (!verification.success) {
                return NextResponse.json(
                    { success: false, error: "Invalid authentication token" },
                    { status: 401 }
                );
            }
            userId = verification.uid!;
        } else {
            userId = "demo-user";
            console.warn("No ID token provided, using demo user");
        }

        // Create upload document in Firestore
        const uploadData: Upload = {
            userId,
            deviceName,
            standards,
            status: "pending",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const uploadRef = await adminDb.collection("uploads").add(uploadData);
        const uploadId = uploadRef.id;

        // Store document metadata in Firestore (files already in Firebase Storage)
        const documentRecords: DocumentMetadata[] = [];

        for (const file of files) {
            const docMetadata: DocumentMetadata = {
                uploadId,
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                storageUrl: file.storageUrl,
                storagePath: file.storagePath,
                createdAt: Timestamp.now(),
            };

            const docRef = await adminDb.collection("documents").add(docMetadata);
            documentRecords.push({
                id: docRef.id,
                ...docMetadata,
            });
        }

        // Log audit entry
        const auditLog: AuditLog = {
            userId,
            action: "upload",
            details: {
                uploadId,
                deviceName,
                fileCount: files.length,
                standards,
            },
            createdAt: Timestamp.now(),
        };
        await adminDb.collection("auditLogs").add(auditLog);

        return NextResponse.json({
            success: true,
            data: {
                uploadId,
                deviceName,
                standards,
                documents: documentRecords,
                status: "pending",
            },
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Failed to process upload",
            },
            { status: 500 }
        );
    }
}
