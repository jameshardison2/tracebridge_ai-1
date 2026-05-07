import { NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";

export async function GET(request: Request) {
    try {
        if (!adminDb) {
            return NextResponse.json({ success: false, error: "Firebase not configured" }, { status: 503 });
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        
        if (!verification.success || !verification.uid) {
            return NextResponse.json({ success: false, error: "Token validation failed" }, { status: 401 });
        }
        
        const tenantUid = verification.uid;

        // 1. Fetch latest upload for user
        const uploadsSnapshot = await adminDb
            .collection("uploads")
            .where("userId", "==", tenantUid)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (uploadsSnapshot.empty) {
            return NextResponse.json({ success: true, data: [] });
        }

        const latestUploadId = uploadsSnapshot.docs[0].id;

        // 2. Fetch gapResults for this upload
        const gapResultsSnapshot = await adminDb
            .collection("gapResults")
            .where("uploadId", "==", latestUploadId)
            .get();

        if (gapResultsSnapshot.empty) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 3. Map to TraceabilityItem schema
        const mappedData = gapResultsSnapshot.docs.map((doc, index) => {
            const data = doc.data();
            
            // Map AI Confidence
            let confidenceScore = 95;
            let driftRisk: "Low" | "Medium" | "High" = "Low";
            let estarStatus = "Ready";

            if (data.status === "gap_detected") {
                confidenceScore = 30;
                driftRisk = data.severity === "critical" ? "High" : "Medium";
                estarStatus = "Blocked";
            } else if (data.status === "needs_review") {
                confidenceScore = 70;
                driftRisk = "Medium";
                estarStatus = "Pending";
            }

            return {
                id: doc.id,
                regulatoryAnchor: {
                    id: `FDA-${data.standard?.split(" ")[0] || "REG"}-${index + 1}`,
                    topic: data.standard || "Regulatory Requirement",
                    description: data.requirement || "Unknown requirement",
                },
                engineeringLink: {
                    id: `CAPA-${doc.id.substring(0, 5).toUpperCase()}`,
                    title: data.gapTitle || data.missingRequirement || "Pending Engineering Action",
                    status: data.pipelineStatus || (data.status === "compliant" ? "Completed" : "Not Started"),
                    owner: "Unassigned",
                    url: "#",
                },
                aiAnalysis: {
                    confidenceScore,
                    driftRisk,
                    rationale: data.reasoning || "AI assessment based on document context.",
                },
                estarStatus,
            };
        });

        // Sort by drift risk: High -> Medium -> Low
        mappedData.sort((a, b) => {
            const order = { "High": 0, "Medium": 1, "Low": 2 };
            return order[a.aiAnalysis.driftRisk] - order[b.aiAnalysis.driftRisk];
        });

        return NextResponse.json({ success: true, data: mappedData });

    } catch (error) {
        console.error("Traceability API Error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to fetch traceability data" },
            { status: 500 }
        );
    }
}
