import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { adminDb } from "../src/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

async function main() {
    if (!adminDb) {
        console.error("Firebase admin not configured.");
        process.exit(1);
    }

    console.log("Seeding mock complaints for trend detection...");

    // We need at least 3 of the same component + failure type to trigger the trend
    const mockComplaints = [
        {
            device_component: "Battery",
            failure_type: "Premature Drain",
            status: "classified",
            classified_at: Timestamp.now()
        },
        {
            device_component: "Battery",
            failure_type: "Premature Drain",
            status: "classified",
            classified_at: Timestamp.now()
        },
        {
            device_component: "Battery",
            failure_type: "Premature Drain",
            status: "classified",
            classified_at: Timestamp.now()
        },
        {
            device_component: "UI Display", // Shouldn't trigger (only 1)
            failure_type: "Frozen Screen",
            status: "classified",
            classified_at: Timestamp.now()
        }
    ];

    for (const c of mockComplaints) {
        await adminDb.collection("complaints").add(c);
    }
    console.log("Mock data inserted.");

    console.log("\nTriggering CRON job via local fetch equivalent...");
    
    // Instead of HTTP, just call the logic inline to test
    const { GET } = await import("../src/app/api/cron/detect-trends/route");
    const response = await GET(new Request("http://localhost/api/cron/detect-trends"));
    const json = await response.json();
    
    console.log("CRON Response:", json);

    // Verify alert was created
    const alerts = await adminDb.collection("alerts")
        .where("type", "==", "trend_drift")
        .where("component", "==", "Battery")
        .get();

    if (!alerts.empty) {
        console.log(`\nSuccess! Found ${alerts.size} trend alert(s):`);
        alerts.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
    } else {
        console.error("\nFailed to generate trend alert.");
    }

    process.exit(0);
}

main().catch(console.error);
