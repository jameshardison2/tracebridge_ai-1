/**
 * eSTAR Formatter (Phase 1 Mock)
 * 
 * This module is responsible for taking a TraceBridge gap analysis result
 * and formatting it into a schema compliant with the FDA's eSTAR requirements
 * for the ESG NextGen gateway.
 * 
 * For Phase 1, we output a structured JSON representing the eSTAR PDF metadata
 * which will later be used to programmatically generate the actual PDF or XML.
 */

export interface TraceBridgeResult {
    reportId: string;
    productCode: string;
    deviceClass: "I" | "II" | "III";
    deviceType: "Hardware" | "SaMD" | "Combination";
    srsScore: number;
    gaps: any[];
}

export interface EstarPayload {
    submissionType: "510(k)";
    eStarVersion: string;
    applicantInfo: {
        companyName: string;
        contactEmail: string;
    };
    deviceMetadata: {
        productCode: string;
        deviceClass: string;
    };
    tracebridgePayload: {
        srsScore: number;
        flaggedStandards: string[];
    };
    timestamp: string;
}

export function formatForEstar(result: TraceBridgeResult, userEmail: string): EstarPayload {
    // Determine the unique standards flagged
    const flaggedStandardsSet = new Set<string>();
    if (result.gaps) {
        result.gaps.forEach(gap => {
            if (gap.standard) flaggedStandardsSet.add(gap.standard);
        });
    }

    return {
        submissionType: "510(k)",
        eStarVersion: "v5.0", // Assuming current FDA template version
        applicantInfo: {
            companyName: "TraceBridge AI Customer",
            contactEmail: userEmail,
        },
        deviceMetadata: {
            productCode: result.productCode || "UNKNOWN",
            deviceClass: `Class ${result.deviceClass || "II"}`,
        },
        tracebridgePayload: {
            srsScore: result.srsScore || 0,
            flaggedStandards: Array.from(flaggedStandardsSet),
        },
        timestamp: new Date().toISOString(),
    };
}
