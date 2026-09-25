const fs = require('fs');
const { Resend } = require('resend');

// Initialize Resend with your API key
// Make sure RESEND_API_KEY is in your .env.local or exported in your terminal
const resend = new Resend(process.env.RESEND_API_KEY);

// You will need to export your LinkedIn connections to a CSV and parse it here.
// For demonstration, here is a mock array of candidates you would extract from the CSV:
const candidates = [
  // { name: 'John', email: 'john@example.com' },
];

const referralLink = "https://t.mercor.com/wbPMF";

async function sendReferralEmails() {
  if (candidates.length === 0) {
    console.log("Please add candidates to the array or parse your LinkedIn Connections CSV.");
    return;
  }

  for (const candidate of candidates) {
    const message = `
      <p>Hey ${candidate.name}!</p>
      
      <p>We’re connected here on LinkedIn but haven't formally met. I was reviewing my network and your background really stood out.</p>
      
      <p>I have access to a private AI job-matching engine called Mercor that connects top tech/product talent directly with funded startups (bypassing the usual ATS resume black hole). I decided to formally refer your profile because I think you'd be a great fit for the roles they are actively filling.</p>
      
      <p>Feel free to use the link below to fast-track your profile!</p>
      
      <p><a href="${referralLink}">${referralLink}</a></p>
      
      <p>Best,<br/>James</p>
    `;

    try {
      const data = await resend.emails.send({
        from: 'James Hardison <onboarding@resend.dev>', // Replace with your verified Resend domain if you have one
        to: [candidate.email],
        subject: 'Fast-tracked your profile for tech matching',
        html: message,
      });

      console.log(`✅ Successfully sent email to ${candidate.name} (${candidate.email})`);
    } catch (error) {
      console.error(`❌ Failed to send to ${candidate.name}:`, error);
    }
    
    // Add a small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

sendReferralEmails();
