import { NextResponse } from "next/server";

export async function GET() {
    // Highly curated mock data designed for an investor/customer pitch
    // Demonstrates "Semantic Traceability" and "Drift Risk"
    const mockTraceabilityData = [
        {
            id: "tm-1",
            regulatoryAnchor: {
                id: "FDA-Q1.1",
                topic: "Biocompatibility",
                description: "Must conduct testing on final finished, sterilized device per ISO 10993-1.",
            },
            engineeringLink: {
                id: "ENG-104",
                title: "Update bio protocol to include EO sterilization step",
                status: "In Progress",
                owner: "Sarah K.",
                url: "https://tracebridge.atlassian.net/browse/ENG-104",
            },
            aiAnalysis: {
                confidenceScore: 95,
                driftRisk: "Low",
                rationale: "The Jira ticket explicitly mentions the EO sterilization step on the final finished device.",
            },
            estarStatus: "Ready",
        },
        {
            id: "tm-2",
            regulatoryAnchor: {
                id: "FDA-Q1.2",
                topic: "Animal Studies",
                description: "GLP study required; sample size of N=6 is insufficient. Recommend N=12.",
            },
            engineeringLink: {
                id: "CLIN-22",
                title: "Revise animal study protocol to include more samples",
                status: "Blocked",
                owner: "Dr. Aris",
                url: "https://tracebridge.atlassian.net/browse/CLIN-22",
            },
            aiAnalysis: {
                confidenceScore: 35,
                driftRisk: "High",
                rationale: "The linked protocol currently states N=8, which does not meet the FDA's explicit recommendation of N=12. High risk of Refuse to Accept (RTA).",
            },
            estarStatus: "Blocked",
        },
        {
            id: "tm-3",
            regulatoryAnchor: {
                id: "FDA-Q2.1",
                topic: "Cybersecurity",
                description: "Provide threat model aligned with 2023 final guidance, including full SBOM.",
            },
            engineeringLink: {
                id: "SWE-405",
                title: "Draft new threat model & SBOM",
                status: "Not Started",
                owner: "James H.",
                url: "https://tracebridge.atlassian.net/browse/SWE-405",
            },
            aiAnalysis: {
                confidenceScore: 78,
                driftRisk: "Medium",
                rationale: "Task is created and appropriately assigned, but work has not begun. Keep monitoring to ensure SBOM generation tool is FDA-compliant.",
            },
            estarStatus: "Pending",
        },
        {
            id: "tm-4",
            regulatoryAnchor: {
                id: "FDA-Q3.1",
                topic: "Human Factors",
                description: "Formative testing must include pediatric user group (ages 6-12).",
            },
            engineeringLink: {
                id: "UX-09",
                title: "Recruit 15 pediatric users for next usability round",
                status: "Completed",
                owner: "Alex M.",
                url: "https://tracebridge.atlassian.net/browse/UX-09",
            },
            aiAnalysis: {
                confidenceScore: 98,
                driftRisk: "Low",
                rationale: "Usability recruitment is complete and explicitly includes the required demographic (ages 6-12).",
            },
            estarStatus: "Ready",
        }
    ];

    return NextResponse.json({ success: true, data: mockTraceabilityData });
}
