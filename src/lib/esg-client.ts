import { EstarPayload } from "./estar-formatter";

/**
 * ESG API Client (Phase 1 Mock)
 * 
 * Handles authentication and transmission to the FDA ESG NextGen Test Environment.
 * Once the FDA provides the final AS2 certificates or REST API endpoint, 
 * this module will be upgraded to use standard Node HTTPS/AS2 libraries.
 */

export interface EsgSubmissionResponse {
    success: boolean;
    fdaCoreId?: string;
    status?: string;
    error?: string;
    timestamp: string;
}

export async function submitToEsgNextGen(
    payload: EstarPayload,
    environment: "test" | "production" = "test"
): Promise<EsgSubmissionResponse> {
    
    // Simulate network delay to FDA ESG NextGen
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Phase 1: Mock successful acknowledgement from FDA
    // We generate a fake Core ID that matches the screenshot format.
    const mockCoreId = `CORE-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

    console.log(`[ESG Client] Simulating transmission of ${payload.submissionType} to FDA ESG (${environment})...`);
    console.log(`[ESG Client] Payload size: ${JSON.stringify(payload).length} bytes`);

    if (environment === "production") {
        throw new Error("Production submission is disabled in TraceBridge Beta.");
    }

    return {
        success: true,
        fdaCoreId: mockCoreId,
        status: "Acknowledged (Test Environment)",
        timestamp: new Date().toISOString()
    };
}
