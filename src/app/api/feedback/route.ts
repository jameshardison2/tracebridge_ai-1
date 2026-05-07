import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verifyIdToken, adminAuth } from "@/lib/firebase-admin";
import { Feedback } from "@/lib/firestore-types";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const authResult = await verifyIdToken(token);
        
        if (!authResult.success || !authResult.uid) {
            return NextResponse.json({ success: false, error: authResult.error || "Invalid token" }, { status: 401 });
        }
        
        const userId = authResult.uid;

        const body = await req.json();
        const { type, content, featureRequest, teamId } = body;

        if (!type || !content) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        if (!adminDb) {
            return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 500 });
        }
        
        const feedback: any = {
            userId,
            teamId: teamId || "unknown",
            type,
            content,
            createdAt: FieldValue.serverTimestamp()
        };
        
        if (featureRequest) {
            feedback.featureRequest = featureRequest;
        }

        const docRef = await adminDb.collection("feedback").add(feedback);

        // Send email notification to founders
        if (resend) {
            try {
                // Fetch the user's email to include in the notification
                let userEmail = "Unknown User";
                try {
                    if (adminAuth) {
                        const userRecord = await adminAuth.getUser(userId);
                        if (userRecord && userRecord.email) userEmail = userRecord.email;
                    }
                } catch (authErr) {
                    console.log("Could not fetch user record for email notification:", authErr);
                }

                await resend.emails.send({
                    from: 'TraceBridge AI <noreply@tracebridge.ai>',
                    to: ['tracebridgeai@gmail.com', 'james.hardison2@gmail.com'], // Send to the founders
                    subject: `New Feature Request: ${type === 'feature_vote' ? featureRequest : 'Open Feedback'}`,
                    html: `
                        <h2>New Feedback Submitted on TraceBridge AI</h2>
                        <p><strong>From:</strong> ${userEmail}</p>
                        <p><strong>Type:</strong> ${type}</p>
                        ${featureRequest ? `<p><strong>Feature:</strong> ${featureRequest}</p>` : ''}
                        <p><strong>Content:</strong></p>
                        <blockquote style="border-left: 4px solid #4f46e5; padding-left: 16px; color: #334155; margin-left: 0;">
                            ${content.replace(/\n/g, '<br>')}
                        </blockquote>
                        <br>
                        <p style="color: #64748b; font-size: 12px;">Stored in Firestore Document ID: ${docRef.id}</p>
                    `
                });
            } catch (emailError) {
                console.error("Failed to send Resend feedback notification:", emailError);
                // We don't fail the API request if the email fails, the feedback is still saved in Firestore
            }
        }

        return NextResponse.json({ 
            success: true, 
            data: { id: docRef.id } 
        });

    } catch (error: any) {
        console.error("Feedback API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
