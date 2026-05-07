const { Resend } = require('resend');

const resend = new Resend('re_LXuT89Pz_49bUcFzF4W3r6nfoPK1zEp2V');

async function testEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'TraceBridge AI <noreply@tracebridge.ai>',
      to: ['james@tracebridge.ai'],
      subject: 'Test Email from API',
      html: '<p>If you see this, Resend is working!</p>'
    });

    if (error) {
      console.error('Resend Error:', error);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.error('Caught Exception:', err);
  }
}

testEmail();
