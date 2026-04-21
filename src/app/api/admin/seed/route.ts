import { NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Device Names
const DEVICES = [
    "Surgical Robot Control Interface v2.4",
    "AI Radiological Triage System",
    "TraceGlow Continuous Glucose Monitor",
    "AeroFlow Infusion Pump Telemetry",
    "CardioLink Implantable Pacemaker Firmware",
    "ECG Analysis Software Level C",
    "Orthopedic Drill Calibration System",
    "Blood Gas Analyzer Cloud Sync",
    "Ophthalmic Laser Control Board",
    "Dialysis Machine Safety Interlock",
    "Neonatal Incubator App Interface",
    "Dental Milling CAD/CAM Integration"
];

const FDA_STANDARDS = [
    "ISO 13485:2016", 
    "ISO 14971:2019", 
    "IEC 62304:2006", 
    "FDA Cybersecurity (Pre-Market)", 
    "IEC 60601-1",
    "21 CFR Part 11"
];

function getRandomItems(arr: string[], min: number, max: number) {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomDate() {
    const now = new Date();
    const past = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // last 90 days
    return Timestamp.fromDate(past);
}

export async function POST(request: Request) {
    try {
        if (!adminDb) {
            return NextResponse.json({ success: false, error: "Firebase offline" }, { status: 503 });
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        
        if (!verification.success || !verification.uid) {
            return NextResponse.json({ success: false, error: "Token validation failed" }, { status: 401 });
        }
        
        const tenantUid = verification.uid;

        console.log(`Starting Enterprise Database Seed for User: ${tenantUid}`);
        
        const uploadsCol = adminDb.collection("uploads");
        const docsCol = adminDb.collection("documents");
        const gapsCol = adminDb.collection("gapResults");

        for (let i = 0; i < 30; i++) {
            // Randomly select constraints
            const deviceName = DEVICES[Math.floor(Math.random() * DEVICES.length)];
            const rStandards = getRandomItems(FDA_STANDARDS, 2, 4);
            const statusInt = Math.random();
            const status = statusInt > 0.85 ? "analyzing" : statusInt > 0.75 ? "pending" : "complete";
            
            const uploadRef = await uploadsCol.add({
                userId: tenantUid,
                deviceName: `${deviceName} [TEST-${i}X]`,
                productCode: "N/A",
                deviceClass: "Class II",
                regulationNumber: "870.xxxx",
                features: { requiresSoftware: true, requiresClinical: false, requiresBiocompatibility: false },
                standards: rStandards,
                status: status,
                createdAt: getRandomDate(),
                updatedAt: Timestamp.now(),
            });

            // If it's complete, generate 15-40 gaps to make the UI look massive
            if (status === "complete") {
                const numGaps = Math.floor(Math.random() * 25) + 15;
                const batchPromises = [];
                for (let g = 0; g < numGaps; g++) {
                    const gapStatusInt = Math.random();
                    const state = gapStatusInt > 0.8 ? "gap_detected" : gapStatusInt > 0.7 ? "needs_review" : "compliant";
                    const severity = state === "gap_detected" ? "critical" : state === "needs_review" ? "major" : "none";
                    
                    const gapData = {
                        uploadId: uploadRef.id,
                        userId: tenantUid, // Isolate to Tenant
                        standard: rStandards[Math.floor(Math.random() * rStandards.length)],
                        section: `Section ${Math.floor(Math.random() * 8) + 4}.${Math.floor(Math.random() * 5) + 1}`,
                        requirement: `The manufacturer shall establish documented procedures for validation of software usage. System shall verify condition ${g + 1}.`,
                        evidenceExcerpts: state === "compliant" ? [`Source mapping verified in SRS Document A paragraph ${g}`] : [],
                        missingRequirement: state === "gap_detected" ? `Failed to provide tracing for verification ${g}.` : undefined,
                        status: state,
                        severity: severity,
                        estimatedCost: state === "gap_detected" ? "$2,500 - $5,000" : "—",
                        estimatedTimeline: state === "gap_detected" ? "1-3 weeks" : "—",
                        citations: state === "compliant" ? [{ source: "Software Requirements Specification", section: "5.4", quote: "System shall verify condition." }] : [],
                        createdAt: Timestamp.now(),
                    };
                    batchPromises.push(gapsCol.add(gapData));
                }
                
                // Also add some Mock Documents
                const numDocs = Math.floor(Math.random() * 3) + 1;
                for(let d = 0; d < numDocs; d++) {
                   batchPromises.push(docsCol.add({
                        uploadId: uploadRef.id,
                        fileName: `Document_Evidence_${d+1}.pdf`,
                        fileType: "application/pdf",
                        fileSize: Math.floor(Math.random() * 5000000) + 100000,
                        storageUrl: "mock://url",
                        storagePath: `userId/${uploadRef.id}/mock.pdf`,
                        createdAt: Timestamp.now(),
                   }));
                }
                await Promise.all(batchPromises);
            }
        }

        return NextResponse.json({ success: true, message: "Successfully seeded 30 Enterprise Audits." });
        
    } catch (error) {
        console.error("Seeding error:", error);
        return NextResponse.json({ success: false, error: "Failed to seed" }, { status: 500 });
    }
}
