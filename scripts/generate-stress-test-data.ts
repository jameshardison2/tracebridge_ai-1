import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. DEVICE PROFILES ---
const devices = [
    { name: "CardioAI_ECG_Detector", class: "Class II", code: "DQA" },
    { name: "Glucostream_CGM", class: "Class III", code: "MDT" },
    { name: "NeuroStylo_DBS_Controller", class: "Class III", code: "GZO" },
    { name: "BreathSync_Portable_Ventilator", class: "Class II", code: "CBK" },
    { name: "VisionPro_Retinal_Scanner", class: "Class II", code: "HLI" },
    { name: "OrthoMend_Bone_Stimulator", class: "Class III", code: "LOE" },
    { name: "DermaSpot_Melanoma_Analyzer", class: "Class II", code: "PFF" },
    { name: "OncoTarget_Radiation_Planner", class: "Class II", code: "MUJ" },
    { name: "GastroCam_Swallowable_Endoscope", class: "Class II", code: "NEK" },
    { name: "RenalFlow_Dialysis_Monitor", class: "Class II", code: "KDI" }
];

// --- 2. DOCUMENT TYPES ---
const documentTypes = [
    { name: "Software_Development_Plan", prefix: "SDP" },
    { name: "Software_Requirements_Specification", prefix: "SRS" },
    { name: "Software_Architecture_Document", prefix: "SAD" },
    { name: "Software_Detailed_Design", prefix: "SDD" },
    { name: "Software_Verification_Plan", prefix: "SVP" },
    { name: "Software_Verification_Report", prefix: "SVR" },
    { name: "Risk_Management_Plan", prefix: "RMP" },
    { name: "Risk_Management_Report", prefix: "RMR" },
    { name: "Cybersecurity_Threat_Model", prefix: "CTM" },
    { name: "Cybersecurity_SBOM", prefix: "SBOM" },
    { name: "Clinical_Evaluation_Report", prefix: "CER" },
    { name: "Human_Factors_Engineering_Report", prefix: "HFE" },
    { name: "Biocompatibility_Test_Report", prefix: "BIO" },
    { name: "Electromagnetic_Compatibility_Report", prefix: "EMC" },
    { name: "Bench_Testing_Protocol", prefix: "BTP" },
    { name: "Bench_Testing_Report", prefix: "BTR" },
    { name: "Instructions_For_Use", prefix: "IFU" },
    { name: "Post_Market_Surveillance_Plan", prefix: "PMS" },
    { name: "Software_Maintenance_Plan", prefix: "SMP" },
    { name: "Traceability_Matrix", prefix: "TM" }
];

// --- 3. GENERATOR LOGIC ---
const generateBoilerplate = (device: any, docType: any) => {
    let content = `=================================================================\n`;
    content += `DOCUMENT: ${docType.name.replace(/_/g, ' ')}\n`;
    content += `DEVICE: ${device.name}\n`;
    content += `PRODUCT CODE: ${device.code}\n`;
    content += `CLASS: ${device.class}\n`;
    content += `VERSION: 1.0\n`;
    content += `DATE: ${new Date().toISOString().split('T')[0]}\n`;
    content += `=================================================================\n\n`;

    content += `1.0 INTRODUCTION\n`;
    content += `This document serves as the formal ${docType.name.replace(/_/g, ' ')} for the ${device.name} medical device. \n`;
    content += `It is intended to comply with all relevant FDA regulations, ISO 13485, IEC 62304, and ISO 14971 standards.\n\n`;

    content += `2.0 PURPOSE AND SCOPE\n`;
    content += `The scope of this document encompasses all relevant engineering, risk, and validation activities associated with the ${device.name}. \n\n`;

    content += `3.0 DETAILED SPECIFICATIONS\n`;

    // Generate massive bulk content (loop 500 times to create very long files)
    for (let i = 1; i <= 500; i++) {
        const id = `${docType.prefix}-${i.toString().padStart(4, '0')}`;
        
        // Randomly inject intentional "gaps" or realistic math
        const random = Math.random();
        
        if (docType.prefix === "SVR" && i === 10) {
            content += `[${id}] Test Execution: The unit was tested. Result: PASS. Statistical Justification: A sample size of N=30 was used, derived from a 95% confidence and 95% reliability (95/95) requirement for Class II devices.\n`;
        } else if (docType.prefix === "BIO" && i === 10) {
            content += `[${id}] Material Assessment: The housing material is ABS plastic. Cytotoxicity testing was performed per ISO 10993-5 using the MEM elution method. The cell viability was >70%, indicating passing results.\n`;
        } else if (docType.prefix === "CTM" && i === 10) {
            content += `[${id}] Network Transport: Telemetry data is transmitted to the cloud using TLS 1.3 with AES-256-GCM encryption. Port 80 is strictly disabled at the firewall level.\n`;
        } else if (docType.prefix === "SBOM" && i === 10) {
            content += `[${id}] Software Bill of Materials (SBOM): \n- Component: React, Version: 18.2.0, CVEs: None\n- Component: Express, Version: 4.18.2, CVEs: CVE-2022-24999 (Mitigated via WAF)\n`;
        } else if (docType.prefix === "RMR" && i === 10) {
            content += `[${id}] Risk Evaluation: A Probability x Severity (PxS) matrix was utilized. The hazard 'Battery Failure' was rated Probability=2, Severity=4. After mitigation, the residual risk was reduced to Probability=1, Severity=4, which is in the acceptable region.\n`;
        } else if (docType.prefix === "HFE" && i === 10) {
            content += `[${id}] Usability Testing: Formative usability testing included N=15 subjects representative of the actual intended user population, including 5 registered nurses, 5 physicians, and 5 elderly patients (age 65+).\n`;
        } else if (random < 0.3) {
            // Highly realistic, compliant math and specs
            const tolerances = ["+/- 0.01%", "+/- 1ms", "+/- 5mV", "+/- 0.5°C"];
            const tol = tolerances[Math.floor(Math.random() * tolerances.length)];
            content += `[${id}] System Constraint: The primary sensor array shall sample data at a frequency of 1000Hz ${tol}. If deviation occurs, a hard hardware interrupt must execute within 2.5ms.\n`;
        } else if (random < 0.6) {
            // Cryptography and Software specs
            content += `[${id}] Architecture Node: Data at rest shall be encrypted using AES-256-GCM. The cryptographic keys shall be rotated every 30 days and stored in the dedicated HSM.\n`;
        } else {
            // Generic ISO boilerplate
            content += `[${id}] Quality Control: This section complies with ISO 13485:2016 Section 7.3. Verification procedures were fully documented, reviewed, and signed off by QA.\n`;
        }
    }

    content += `\n4.0 SIGNATURES\n`;
    content += `Approver: John Doe, VP of Engineering\n`;
    content += `Date: ${new Date().toISOString().split('T')[0]}\n`;
    
    return content;
};

// --- 4. EXECUTION ---
async function main() {
    const baseDir = path.join(__dirname, '..', 'demo_data', 'stress_test');
    
    // Create base dir
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }

    console.log(`Starting generation of 200 massive 510(k) documents...`);
    let count = 0;

    for (const device of devices) {
        const deviceDir = path.join(baseDir, device.name);
        if (!fs.existsSync(deviceDir)) {
            fs.mkdirSync(deviceDir, { recursive: true });
        }

        for (const doc of documentTypes) {
            const fileName = `${device.name}_${doc.name}_v1.0.txt`;
            const filePath = path.join(deviceDir, fileName);
            
            const content = generateBoilerplate(device, doc);
            fs.writeFileSync(filePath, content);
            count++;
        }
        console.log(`[+] Generated 20 documents for ${device.name}`);
    }

    console.log(`\n✅ Success! Generated exactly ${count} realistic documents across 10 projects.`);
    console.log(`Files are located in: ${baseDir}`);
}

main().catch(console.error);
