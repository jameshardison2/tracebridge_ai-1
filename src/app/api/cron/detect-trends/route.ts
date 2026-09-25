import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const maxDuration = 60; // Max execution time

// Number of complaints in a 30-day window to trigger a trend alert
const TREND_THRESHOLD = 3; 

export async function GET(request: Request) {
    // Vercel Cron uses GET requests
    if (!adminDb) {
        return NextResponse.json(
            { success: false, error: "Firebase not configured" },
            { status: 503 }
        );
    }

    try {
        console.log("[CRON] Starting Trend Detection Job...");
        
        // 1. Calculate the cutoff date (30 days ago)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffTimestamp = Timestamp.fromDate(thirtyDaysAgo);

        // 2. Query recent classified complaints (Filter status in memory to avoid needing a composite index)
        const complaintsSnapshot = await adminDb.collection("complaints")
            .where("classified_at", ">=", cutoffTimestamp)
            .get();

        if (complaintsSnapshot.empty) {
            return NextResponse.json({ success: true, message: "No recent complaints to analyze." });
        }

        // 3. Group complaints by Device Component + Failure Type
        const clusters: Record<string, { count: number, complaintIds: string[] }> = {};

        complaintsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status !== "classified") return;
            
            if (data.device_component && data.failure_type && data.device_component !== "Unknown") {
                const clusterKey = `${data.device_component}::${data.failure_type}`;
                
                if (!clusters[clusterKey]) {
                    clusters[clusterKey] = { count: 0, complaintIds: [] };
                }
                clusters[clusterKey].count++;
                clusters[clusterKey].complaintIds.push(doc.id);
            }
        });

        // 4. Analyze clusters and generate alerts
        let alertsGenerated = 0;

        for (const [clusterKey, clusterData] of Object.entries(clusters)) {
            if (clusterData.count >= TREND_THRESHOLD) {
                const [component, failureType] = clusterKey.split("::");
                
                // Check if we already alerted on this trend recently to prevent spam
                const recentAlertsSnapshot = await adminDb.collection("alerts")
                    .where("created_at", ">=", cutoffTimestamp)
                    .get();
                
                let alreadyAlerted = false;
                recentAlertsSnapshot.forEach(doc => {
                    const alert = doc.data();
                    if (
                        alert.type === "trend_drift" &&
                        alert.component === component &&
                        alert.failure_type === failureType
                    ) {
                        alreadyAlerted = true;
                    }
                });

                if (!alreadyAlerted) {
                    console.log(`[CRON] Detected new trend: ${clusterKey} with ${clusterData.count} complaints.`);
                    
                    await adminDb.collection("alerts").add({
                        type: "trend_drift",
                        source: "trend_cron",
                        component: component,
                        failure_type: failureType,
                        complaint_ids: clusterData.complaintIds,
                        complaint_count: clusterData.count,
                        title: `Emerging Trend: ${component} - ${failureType}`,
                        severity: "medium", // Trends are medium until verified, singular criticals are high
                        status: "open",
                        created_at: Timestamp.now(),
                        message: `Detected a spike of ${clusterData.count} complaints related to '${component}' experiencing '${failureType}' in the last 30 days. Recommend initiating a CAPA investigation.`
                    });
                    
                    alertsGenerated++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Trend detection completed. Analyzed ${complaintsSnapshot.size} complaints. Generated ${alertsGenerated} new alerts.`
        });

    } catch (error) {
        console.error("[CRON] Trend detection failed:", error);
        return NextResponse.json(
            { success: false, error: "Trend detection failed." },
            { status: 500 }
        );
    }
}
