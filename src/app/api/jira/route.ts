import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const verification = await verifyIdToken(idToken);
        if (!verification.success || !verification.uid) {
            return NextResponse.json({ success: false, error: "Token validation failed" }, { status: 401 });
        }

        const body = await request.json();
        const { gapId, title, standard, subNote } = body;

        const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
        const JIRA_EMAIL = process.env.JIRA_EMAIL;
        const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
        const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

        if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
            console.error("Missing Jira Environment Variables");
            return NextResponse.json({ success: false, error: "Jira integration not configured." }, { status: 500 });
        }

        const authString = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

        // Note: Jira Cloud requires 'Task' or 'Story' for standard project issue creation via /rest/api/3/issue, 
        // unless 'Epic' is specifically configured. We'll use 'Task' as it's universally available and fits CAPAs well.
        const payload = {
            fields: {
                project: {
                    key: JIRA_PROJECT_KEY
                },
                summary: `CAPA: ${title} (${standard})`,
                description: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    text: `TraceBridge AI identified a regulatory gap requiring remediation for standard: ${standard}.\n\nAI Notes:\n${subNote || 'No additional notes provided.'}`,
                                    type: "text"
                                }
                            ]
                        }
                    ]
                },
                issuetype: {
                    name: "Task" 
                }
            }
        };

        const response = await fetch(`${JIRA_DOMAIN}/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Jira API Error:", data);
            return NextResponse.json({ success: false, error: "Failed to create Jira ticket.", details: data }, { status: response.status });
        }

        return NextResponse.json({ 
            success: true, 
            message: "Jira ticket created successfully.", 
            ticketKey: data.key, 
            ticketUrl: `${JIRA_DOMAIN}/browse/${data.key}` 
        });

    } catch (error) {
        console.error("Jira Route Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
