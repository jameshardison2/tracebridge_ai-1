import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { queryGeminiRESTArray } from "../src/lib/gemini-rest";
import * as fs from "fs";
import * as path from "path";

// Define strict test matrix
const CORE_RULES = [
    {
        id: "rule_qms_13485",
        standard: "ISO 13485:2016",
        section: "4.2.1",
        requirement: "The quality management system documentation shall include the quality manual, documented procedures required by this standard, and documented statistical frameworks.",
        expectedDocument: "Quality Manual"
    },
    {
        id: "rule_cyber",
        standard: "FDA Cybersecurity Guidance",
        section: "V.A",
        requirement: "Premarket submissions must contain a comprehensive Software Bill of Materials (SBOM) and explicit mitigation matrix for all known Common Vulnerabilities and Exposures (CVE).",
        expectedDocument: "Cybersecurity_SBOM"
    },
    {
        id: "rule_iec_arc",
        standard: "IEC 62304",
        section: "5.3",
        requirement: "The manufacturer shall establish a software architecture that defines software items, limits software unit boundary intersections, and explicitly states segregation measures between safety classes.",
        expectedDocument: "Software_Architecture_Document"
    },
    {
        id: "rule_risk_14971",
        standard: "ISO 14971:2019",
        section: "7",
        requirement: "Risk evaluation must implement a deterministic threshold comparing the calculated risk index (Probability x Severity matrix) against pre-defined acceptability criteria.",
        expectedDocument: "Risk_Management_Plan"
    },
    {
        id: "rule_biocomp",
        standard: "ISO 10993",
        section: "1",
        requirement: "Biological evaluation of medical devices must include cytotoxicity testing with robust statistical justification for the selected sample sizes.",
        expectedDocument: "Biocompatibility_Test_Report"
    }
];

// Wait function for rate limiting
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function runMassiveSuite() {
    console.clear();
    console.log(`\n=============================================================`);
    console.log(` TRACEBRIDGE AI : MASSIVE END-TO-END STRESS TEST SUITE`);
    console.log(`=============================================================\n`);

    const baseDir = path.join(process.cwd(), "demo_data", "stress_test");
    if (!fs.existsSync(baseDir)) {
        console.error("Stress test data not found. Please run generate-stress-test-data.ts first.");
        process.exit(1);
    }

    const projects = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
    console.log(`Found ${projects.length} medical device projects for analysis.\n`);

    const masterResults: Record<string, any> = {};
    let totalPass = 0;
    let totalFail = 0;

    for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        console.log(`[>>] Testing Project ${i+1}/${projects.length}: ${project}`);
        
        const projectDir = path.join(baseDir, project);
        const fileNames = fs.readdirSync(projectDir).filter(f => f.endsWith('.txt'));
        
        // Load all massive files into memory for this project
        const fileBuffers = fileNames.map(f => {
            return {
                name: f,
                mimeType: "text/plain",
                data: fs.readFileSync(path.join(projectDir, f))
            };
        });

        console.log(`    Loaded ${fileBuffers.length} massive documents. Hitting Live Gemini API...`);
        
        try {
            const startTime = Date.now();
            // Call live AI Engine
            const results = await queryGeminiRESTArray(fileBuffers, CORE_RULES);
            const execTime = Date.now() - startTime;
            
            masterResults[project] = {
                executionTimeMs: execTime,
                results: results
            };

            const passed = results.filter(r => r.found).length;
            const failed = results.filter(r => !r.found).length;
            totalPass += passed;
            totalFail += failed;

            console.log(`    [OK] Engine successfully parsed and analyzed. Caught ${failed} gaps, verified ${passed} compliances. (${execTime}ms)`);
        } catch (e: any) {
            console.error(`    [ERROR] AI Engine crashed on project ${project}:`, e.message);
            masterResults[project] = { error: e.message };
        }

        if (i < projects.length - 1) {
            console.log(`    [RATE LIMIT SAFETY] Waiting 30 seconds to respect Gemini 1M TPM quota...`);
            await delay(30000);
        }
    }

    console.log(`\n=============================================================`);
    console.log(`TEST SUITE COMPLETE`);
    console.log(`Total Compliance Confirmed: ${totalPass}`);
    console.log(`Total Critical Gaps Caught: ${totalFail}`);
    
    const outPath = path.join(process.cwd(), "demo_data", "stress_test_results.json");
    fs.writeFileSync(outPath, JSON.stringify(masterResults, null, 2));
    
    console.log(`Full AI analytical reasoning saved to: ${outPath}`);
    console.log(`=============================================================\n`);
}

runMassiveSuite().catch(console.error);
