import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    console.log("Testing Resend API with key:", process.env.RESEND_API_KEY ? "Loaded" : "Missing");
    try {
        const { data, error } = await resend.emails.send({
            from: 'TraceBridge AI <noreply@tracebridge.ai>',
            to: ['james@tracebridge.ai'],
            subject: 'Test Email Validation',
            html: '<p>This is a test from the local dev environment.</p>'
        });
        
        if (error) {
            console.error("Resend API Error:", error);
        } else {
            console.log("Email sent successfully!", data);
        }
    } catch (e) {
        console.error("Fatal exception:", e);
    }
}

testEmail();
