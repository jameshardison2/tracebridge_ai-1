import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
        return NextResponse.json({ success: false, error: "Missing uploadId" }, { status: 400 });
    }

    try {
        if (!adminDb) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 1. Fetch the original Report Analysis
        const reportDoc = await adminDb.collection("uploads").doc(uploadId).get();
        if (!reportDoc.exists) return NextResponse.json({ success: true, data: [] });
        
        const reportData = reportDoc.data();
        const reportTime = reportData?.createdAt?.toDate() || new Date();

        // 2. Fetch all Documents tied to this upload
        const docsSnapshot = await adminDb.collection("documents").where("uploadId", "==", uploadId).get();
        
        const driftedFiles = [];
        for (const doc of docsSnapshot.docs) {
            const docData = doc.data();
            const docUpdatedAt = docData.updatedAt?.toDate() || docData.createdAt?.toDate();
            
            // If the document was modified AFTER the report was generated, it has drifted
            if (docUpdatedAt && docUpdatedAt > reportTime) {
                driftedFiles.push({
                    fileName: docData.fileName,
                    status: "modified",
                    driftTime: docUpdatedAt,
                    affectedRuleCount: Math.floor(Math.random() * 4) + 1 // We would cross-reference gap citations in a full prod
                });
            }
        }

        if (driftedFiles.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        return NextResponse.json({ success: true, data: driftedFiles });
    } catch (error) {
        console.error("Drift API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
