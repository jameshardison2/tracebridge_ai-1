import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { adminDb } from "./firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const complaintSchema = {
    type: SchemaType.OBJECT,
    properties: {
        device_component: {
            type: SchemaType.STRING,
            description: "The specific component or subsystem of the device that failed or is involved (e.g., 'Infusion Pump Motor', 'Catheter Hub', 'Software UI'). Use 'Unknown' if not stated."
        },
        failure_type: {
            type: SchemaType.STRING,
            description: "The nature of the failure (e.g., 'Mechanical Failure', 'Electrical Short', 'Software Crash', 'Usability Error', 'Packaging Defect')."
        },
        severity: {
            type: SchemaType.STRING,
            description: "Must be exactly one of: 'critical' (death, serious injury, or imminent risk thereof), 'major' (device malfunction requiring medical intervention or significant delay), 'minor' (user annoyance, cosmetic, or easily mitigated issue)."
        },
        classification_confidence: {
            type: SchemaType.INTEGER,
            description: "Confidence score from 0 to 100 based on the clarity of the complaint text."
        },
        needs_mdr: {
            type: SchemaType.BOOLEAN,
            description: "True if the event resulted in death or serious injury, or if a recurrence could result in death or serious injury (Medical Device Reporting criteria)."
        }
    },
    required: ["device_component", "failure_type", "severity", "classification_confidence", "needs_mdr"]
};

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: complaintSchema
    }
});

export async function classifyComplaint(complaintId: string): Promise<void> {
    if (!adminDb) {
        console.error("[Complaint Classifier] Firebase Admin not initialized.");
        return;
    }

    try {
        const docRef = adminDb.collection("complaints").doc(complaintId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.error(`[Complaint Classifier] Complaint ${complaintId} not found.`);
            return;
        }

        const complaintData = docSnap.data();
        if (complaintData?.status !== "pending_classification") {
            console.log(`[Complaint Classifier] Complaint ${complaintId} is already processed.`);
            return;
        }

        const rawText = complaintData.raw_text || complaintData.description || "";
        
        if (!rawText.trim()) {
            await docRef.update({
                status: "failed",
                error: "Empty complaint text"
            });
            return;
        }

        const prompt = `You are a medical device regulatory and quality expert. 
Analyze the following post-market complaint and classify it according to the required schema.

--- COMPLAINT TEXT ---
${rawText}
----------------------

Be objective and precise. Remember that FDA Medical Device Reporting (MDR) is required if the device may have caused or contributed to a death or serious injury.`;

        console.log(`[Complaint Classifier] Analyzing complaint ${complaintId}...`);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const classification = JSON.parse(responseText);

        console.log(`[Complaint Classifier] Result for ${complaintId}:`, classification);

        // Update the complaint record
        await docRef.update({
            device_component: classification.device_component,
            failure_type: classification.failure_type,
            severity: classification.severity,
            classification_confidence: classification.classification_confidence,
            needs_mdr: classification.needs_mdr,
            status: "classified",
            classified_at: Timestamp.now()
        });

        // Cross-Module Integration: Emit Signal Drift alert if Critical
        if (classification.severity === "critical") {
            console.log(`[Complaint Classifier] CRITICAL severity detected for ${complaintId}. Emitting Signal Drift alert.`);
            
            await adminDb.collection("alerts").add({
                type: "signal_drift",
                source: "complaint_module",
                complaint_id: complaintId,
                title: `Critical Safety Signal: ${classification.device_component} - ${classification.failure_type}`,
                severity: "high",
                status: "open",
                created_at: Timestamp.now(),
                message: "A critical severity complaint has been logged. Immediate regulatory review (MDR/CAPA) is required."
            });
        }

    } catch (error) {
        console.error(`[Complaint Classifier] Error processing ${complaintId}:`, error);
        
        if (adminDb) {
            await adminDb.collection("complaints").doc(complaintId).update({
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown AI error"
            }).catch(() => {});
        }
    }
}
