import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { adminDb } from "../src/lib/firebase-admin";
import { classifyComplaint } from "../src/lib/complaints-classifier";

async function main() {
    if (!adminDb) {
        console.error("Firebase admin not configured.");
        process.exit(1);
    }

    console.log("Adding mock complaint to Firestore...");
    
    // Create a mock critical complaint
    const mockComplaint = {
        raw_text: "The catheter hub fractured during insertion into the patient. This resulted in significant bleeding and required immediate surgical intervention to retrieve the broken pieces from the patient's vein.",
        source: "email",
        status: "pending_classification",
        received_at: new Date()
    };

    const docRef = await adminDb.collection("complaints").add(mockComplaint);
    console.log(`Created complaint ID: ${docRef.id}`);

    console.log("Running classifier...");
    await classifyComplaint(docRef.id);

    console.log("Checking results in Firestore...");
    const updated = await docRef.get();
    console.log(JSON.stringify(updated.data(), null, 2));

    console.log("Checking if Signal Drift alert was created...");
    const alerts = await adminDb.collection("alerts")
        .where("complaint_id", "==", docRef.id)
        .get();

    if (!alerts.empty) {
        console.log(`Found ${alerts.size} alert(s):`);
        alerts.forEach(doc => console.log(JSON.stringify(doc.data(), null, 2)));
    } else {
        console.log("No alerts found.");
    }

    process.exit(0);
}

main().catch(console.error);
