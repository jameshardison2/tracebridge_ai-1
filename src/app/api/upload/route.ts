import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage, verifyIdToken } from "@/lib/firebase-admin";
import { Upload, DocumentMetadata, AuditLog } from "@/lib/firestore-types";
import { Timestamp } from "firebase-admin/firestore";

// Route segment config for Vercel
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Vercel Hobby: 4.5MB body limit. Reject files > 4MB to leave room for form fields.
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB per file
const MAX_TOTAL_SIZE = 4.5 * 1024 * 1024; // 4.5MB total payload

/**
 * POST /api/upload
 * Upload documents to Firebase Storage and store metadata in Firestore.
 * Requires Firebase ID token for authentication.
 */
export async function POST(request: Request) {
    try {
        // Check if Firebase is initialized
        if (!adminDb || !adminStorage) {
            return NextResponse.json(
                { success: false, error: "Firebase not configured. Please set Firebase credentials in .env" },
                { status: 503 }
            );
        }

        const formData = await request.formData();

        const deviceName = formData.get("deviceName") as string;
        const standardsRaw = formData.get("standards") as string;
        const files = formData.getAll("files") as File[];
        const idToken = formData.get("idToken") as string | null;

        // Validate required fields
        if (!deviceName || !standardsRaw || files.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Missing required fields: deviceName, standards, files",
                },
                { status: 400 }
            );
        }

        // BUG-001: Validate file sizes before processing
        let totalSize = 0;
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `File "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 4MB limit. Please compress or split large documents.`,
                    },
                    { status: 413 }
                );
            }
            totalSize += file.size;
        }
        if (totalSize > MAX_TOTAL_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Total upload size (${(totalSize / 1024 / 1024).toFixed(1)}MB) exceeds the 4.5MB limit. Try uploading fewer files at a time.`,
                },
                { status: 413 }
            );
        }

        // Verify Firebase ID token
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
            // For demo/testing purposes, use a demo user
            // In production, you should require authentication
            userId = "demo-user";
            console.warn("No ID token provided, using demo user");
        }

        const standards = JSON.parse(standardsRaw) as string[];

        // Create upload document in Firestore
        const uploadData: Upload = {
            userId,
            deviceName,
            standards,
            status: "pending",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        const uploadRef = await adminDb!.collection("uploads").add(uploadData);
        const uploadId = uploadRef.id;

        // Upload files to Firebase Storage and store metadata
        const bucket = adminStorage!.bucket();
        const documentRecords: DocumentMetadata[] = [];

        for (const file of files) {
            const timestamp = Date.now();
            const fileType = file.name.split(".").pop()?.toLowerCase() || "unknown";
            const storagePath = `uploads/${userId}/${timestamp}-${file.name}`;

            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to Firebase Storage
            const fileRef = bucket.file(storagePath);
            await fileRef.save(buffer, {
                metadata: {
                    contentType: file.type || "application/octet-stream",
                    metadata: {
                        uploadId,
                        originalName: file.name,
                        uploadedBy: userId,
                    },
                },
            });

            // Make file publicly accessible (optional - adjust based on your security needs)
            await fileRef.makePublic();

            // Get public URL
            const storageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

            // Store document metadata in Firestore
            const docMetadata: DocumentMetadata = {
                uploadId,
                fileName: file.name,
                fileType,
                fileSize: file.size,
                storageUrl,
                storagePath,
                createdAt: Timestamp.now(),
            };

            const docRef = await adminDb!.collection("documents").add(docMetadata);
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
        await adminDb!.collection("auditLogs").add(auditLog);

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
                error: error instanceof Error ? error.message : "Failed to process upload"
            },
            { status: 500 }
        );
    }
}

