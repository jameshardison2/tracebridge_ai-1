const https = require('https');
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(parsed.models.map(m => m.name).join('\n'));
    } catch (e) { console.log(data); }
  });
}).on('error', (err) => {
  console.log("Error: " + err.message);
});
