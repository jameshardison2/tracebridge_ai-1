import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const resend = new Resend(process.env.RESEND_API_KEY);

async function test() {
  console.log('Testing Resend...');
  try {
    const response = await resend.emails.send({
      from: 'james@tracebridge.ai',
      to: 'james.hardison2@gmail.com',
      subject: 'Test Email',
      html: '<p>Testing Resend API</p>'
    });
    
    console.log('Full Response:', JSON.stringify(response, null, 2));
  } catch (err) {
    console.error('Exception caught:', err);
  }
}

test();
