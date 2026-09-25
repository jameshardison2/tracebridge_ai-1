import https from 'https';
import http from 'http';
import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

const URLS_TO_CHECK = [
  'http://trainaitogain.com', // Your forwarding domain
];

async function checkUrl(url: string, redirectCount = 0): Promise<{ success: boolean, log: string[] }> {
  const log: string[] = [];
  
  if (redirectCount > 5) {
    const msg = `❌ [FAIL] ${url} - Too many redirects.`;
    console.error(msg);
    log.push(msg);
    return { success: false, log };
  }

  const client = url.startsWith('https') ? https : http;

  return new Promise((resolve) => {
    client.get(url, async (res) => {
      const { statusCode, headers } = res;

      if (statusCode && statusCode >= 200 && statusCode < 300) {
        const msg = `✅ [OK] ${url} - Status: ${statusCode}`;
        console.log(msg);
        log.push(msg);
        resolve({ success: true, log });
      } else if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
        const msg = `⚠️ [REDIRECT] ${url} -> ${headers.location} (Status: ${statusCode})`;
        console.log(msg);
        log.push(msg);
        
        let nextUrl = headers.location;
        if (!nextUrl.startsWith('http')) {
          const urlObj = new URL(url);
          nextUrl = `${urlObj.protocol}//${urlObj.host}${nextUrl}`;
        }
        
        const nextResult = await checkUrl(nextUrl, redirectCount + 1);
        resolve({ success: nextResult.success, log: [...log, ...nextResult.log] });
      } else {
        const msg = `❌ [FAIL] ${url} - Status: ${statusCode}`;
        console.error(msg);
        log.push(msg);
        resolve({ success: false, log });
      }
    }).on('error', (e) => {
      const msg = `❌ [ERROR] ${url} - ${e.message}`;
      console.error(msg);
      log.push(msg);
      resolve({ success: false, log });
    });
  });
}

async function sendEmailNotification(success: boolean, fullLog: string) {
  const subject = success 
    ? "✅ Mercor Referral Link Passed" 
    : "🚨 ALERT: Mercor Referral Link Broken!";
    
  const html = `
    <h2>Mercor Referral Link Health Check</h2>
    <p>Status: <strong>${success ? 'Passed' : 'Failed'}</strong></p>
    <hr />
    <pre>${fullLog}</pre>
    <br/>
    <p><em>To run this check manually at any time, just double-click the <strong>Check_Mercor_Link.command</strong> shortcut on your Mac Desktop!</em></p>
  `;

  try {
    const data = await resend.emails.send({
      from: 'james@tracebridge.ai',
      to: 'james.hardison2@gmail.com',
      subject: subject,
      html: html,
    });
    console.log('📧 Email notification sent:', data.id);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

async function main() {
  console.log('🔍 Starting Link Health Check...\n');
  let overallSuccess = true;
  let fullOutput = "";

  for (const url of URLS_TO_CHECK) {
    const result = await checkUrl(url);
    fullOutput += result.log.join('\n') + '\n-----------------------------------\n';
    if (!result.success) {
      overallSuccess = false;
    }
  }
  
  console.log('\n🏁 Health Check Complete.');
  
  // Send the email with the results
  await sendEmailNotification(overallSuccess, fullOutput);
}

main();
