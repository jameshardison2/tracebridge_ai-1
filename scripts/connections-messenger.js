const { execSync, spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');

// Helper to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to write text directly to macOS clipboard
function copyToClipboard(text) {
  const proc = spawn('pbcopy');
  proc.stdin.write(text);
  proc.stdin.end();
}

// Extract first name from full candidate name
function getFirstName(fullName) {
  if (!fullName) return 'there';
  // Strip common suffixes/prefixes/titles
  let cleaned = fullName.replace(/(Esq\.|PhD|MBA|CQF|ACHE|MD|MS|BS|B\.S\.|M\.S\.)/gi, '').trim();
  // Split by whitespace
  const parts = cleaned.split(/\s+/);
  const first = parts[0] || '';
  // Capitalize properly
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// Generate the personalized outreach message
function generateMessage(name) {
  const firstName = getFirstName(name);

  return `Greetings ${firstName} 👋🏼

I'll keep this short.

I'm collaborating with Mercor, a $10B AI company that connects top talent with global AI projects.

They're onboarding for several roles now, and since matching is largely automated, a specific, metrics-driven resume really helps you get surfaced for roles that fit.

If you're interested, you can apply here: https://www.trainaitogain.com/ 

The quick path:
1. Sign up and upload your resume. Lead with hard numbers, real metrics, and the specific tools or certifications you have. Specific bullets beat vague ones.
2. Pick two to four roles that fit your actual background. Genuine fit is what gets you matched, so don't just chase the top rate.
3. Finish the work-authorization and availability steps (about two minutes each). Don't skip availability, since it speeds up matching.
4. Prep for the ~20-minute interview. They want clear reasoning, and structured reflective thinking, so practice laying out your logic step by step will help. 


I've attached a preparation guide that covers both: a resume guide to tighten your bullets, and an interview practice mode that simulates the screen. Happy to look over your resume once it's ready too.

Apply here: https://www.trainaitogain.com/ 


Great to have you in my network either way. Ask me anything!

-James`;
}

// AppleScript snippet to extract current connections page data
function getConnectionsData() {
  const jsCode = `(function() {
    const rows = Array.from(document.querySelectorAll('.divide-y > div, [data-tour="referral-row"]'));
    const results = [];
    
    let currentCandidate = null;
    
    rows.forEach((row) => {
      const linkedinAnchor = row.querySelector('a[href*="linkedin.com/messaging/thread/new"]');
      const nameSpan = row.querySelector('span.hidden.sm\\\\:inline') || row.querySelector('span.sm\\\\:hidden') || row.querySelector('span') || row.querySelector('p');
      
      if (linkedinAnchor) {
        if (currentCandidate) {
          results.push(currentCandidate);
        }
        
        const name = nameSpan ? nameSpan.textContent.trim() : 'Unknown';
        const linkedinUrl = linkedinAnchor.href;
        
        const buttons = Array.from(row.querySelectorAll('button')).map(b => b.textContent.trim());
        const isVouched = buttons.includes('Vouched') || row.textContent.includes('Vouched');
        // Unvouched means there's an active "Vouch" button and it doesn't show "Vouched"
        const isUnvouched = buttons.includes('Vouch') && !isVouched;
        
        currentCandidate = {
          name,
          linkedinUrl,
          isVouched,
          isUnvouched,
          roles: [],
          rawText: row.textContent.trim().substring(0, 150)
        };
      } else if (currentCandidate) {
        const roleAnchor = row.querySelector('a[href*="t.mercor.com"]');
        if (roleAnchor) {
          currentCandidate.roles.push(roleAnchor.textContent.trim());
        }
      }
    });
    
    if (currentCandidate) {
      results.push(currentCandidate);
    }
    
    return JSON.stringify({
      count: results.length,
      candidates: results
    });
  })()`;

  const escapedJs = jsCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const appleScript = `
  tell application "Google Chrome"
      set foundTab to false
      set foundWin to missing value
      set foundTabIdx to -1
      
      repeat with win in windows
          set tabIdx to 1
          repeat with t in tabs of win
              if URL of t contains "work.mercor.com/refer" then
                  set foundTab to true
                  set foundWin to win
                  set foundTabIdx to tabIdx
                  exit repeat
              end if
              set tabIdx to tabIdx + 1
          end repeat
          if foundTab then exit repeat
      end repeat
      
      if foundTab then
          set active tab index of foundWin to foundTabIdx
          set resultHTML to execute t javascript "${escapedJs}"
          return resultHTML
      else
          return "ERROR: Mercor page not found"
      end if
  end tell
  `;

  const tempFile = 'scripts/connections-messenger-extract.applescript';
  fs.writeFileSync(tempFile, appleScript);
  
  try {
    const result = execSync(`osascript ${tempFile}`, { encoding: 'utf8' });
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {}
    
    if (result.startsWith('ERROR:')) {
      throw new Error(result.trim());
    }
    return JSON.parse(result);
  } catch (e) {
    try {
      fs.unlinkSync(tempFile);
    } catch (err) {}
    throw e;
  }
}

// AppleScript snippet to scroll to candidate on Mercor page and open LinkedIn URL in new tab
function focusAndOpenCandidate(name, linkedinUrl) {
  const jsScrollCode = `(function() {
    const targetName = "${name}";
    const rows = Array.from(document.querySelectorAll('.divide-y > div, [data-tour="referral-row"]'));
    for (const row of rows) {
      const nameSpan = row.querySelector('span.hidden.sm\\\\:inline') || row.querySelector('span.sm\\\\:hidden') || row.querySelector('span') || row.querySelector('p');
      if (nameSpan && nameSpan.textContent.trim() === targetName) {
        row.scrollIntoView({ block: 'center' });
        row.style.transition = 'background-color 0.5s ease';
        row.style.backgroundColor = '#ecfdf5'; // Light green highlight
        setTimeout(() => {
          row.style.backgroundColor = '';
        }, 3000);
        return "Scrolled successfully";
      }
    }
    return "Candidate row not found";
  })()`;

  const escapedJs = jsScrollCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const appleScript = `
  tell application "Google Chrome"
      set foundTab to false
      set foundWin to missing value
      set foundTabIdx to -1
      
      repeat with win in windows
          set tabIdx to 1
          repeat with t in tabs of win
              if URL of t contains "work.mercor.com/refer" then
                  set foundTab to true
                  set foundWin to win
                  set foundTabIdx to tabIdx
                  exit repeat
              end if
              set tabIdx to tabIdx + 1
          end repeat
          if foundTab then exit repeat
      end repeat
      
      if foundTab then
          set active tab index of foundWin to foundTabIdx
          index of foundWin
          execute t javascript "${escapedJs}"
          
          -- Open LinkedIn in a new tab
          tell foundWin to make new tab with properties {URL:"${linkedinUrl}"}
          return "OK"
      else
          return "ERROR: Mercor page not found"
      end if
  end tell
  `;

  const tempFile = 'scripts/connections-messenger-focus.applescript';
  fs.writeFileSync(tempFile, appleScript);
  
  try {
    execSync(`osascript ${tempFile}`, { encoding: 'utf8' });
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {}
  } catch (e) {
    try {
      fs.unlinkSync(tempFile);
    } catch (err) {}
    console.error('Error focusing Chrome window or opening tab:', e.message);
  }
}

// Main CLI logic
async function main() {
  console.log('\n\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m🚀  Mercor Connection Outreach Assistant (Premium UI) \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m\n');
  
  console.log('📌 Make sure Google Chrome is running and you have the Mercor connections page open:');
  console.log('   https://work.mercor.com/refer?tab=connections\n');
  console.log('📌 Also make sure the guide exists on your Desktop:');
  console.log('   /Users/176693/Desktop/Mercor_Preparation_Guide.docx\n');
  
  console.log('🔄 Connecting to Chrome via AppleScript and reading connections...');
  
  let data;
  try {
    data = getConnectionsData();
  } catch (e) {
    console.error('\n❌ Could not connect to Google Chrome or extract connections.', e.message);
    console.log('Please ensure Chrome has the Mercor connections page open as the active tab or in the background.');
    process.exit(1);
  }
  
  console.log(`\n✅ Successfully parsed ${data.count} candidates from Mercor.`);
  
  const unvouchedCandidates = data.candidates.filter(c => c.isUnvouched);
  console.log(`🔥 Found \x1b[32m${unvouchedCandidates.length}\x1b[0m candidates who are not yet referred (button: "Vouch").\n`);
  
  if (unvouchedCandidates.length === 0) {
    console.log('🎉 No unvouched connections found! All visible connections have already been vouch/referred.');
    process.exit(0);
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));
  
  let i = 0;
  while (i < unvouchedCandidates.length) {
    const candidate = unvouchedCandidates[i];
    console.log(`\n\x1b[34m--------------------------------------------------\x1b[0m`);
    console.log(`👤 \x1b[1mCandidate [${i + 1}/${unvouchedCandidates.length}]: ${candidate.name}\x1b[0m`);
    console.log(`💼 Roles: ${candidate.roles.length > 0 ? candidate.roles.join(', ') : 'None listed (collapsed)'}`);
    console.log(`🔗 LinkedIn: ${candidate.linkedinUrl}`);
    console.log(`\x1b[34m--------------------------------------------------\x1b[0m`);
    
    const choice = await askQuestion(
      `👉 Press \x1b[32mENTER\x1b[0m to open LinkedIn & copy message\n` +
      `👉 Type \x1b[33m's'\x1b[0m to skip this candidate\n` +
      `👉 Type \x1b[31m'q'\x1b[0m to quit: `
    );
    
    const trimmed = choice.trim().toLowerCase();
    
    if (trimmed === 'q') {
      console.log('\n👋 Exiting outreach helper. Good luck!');
      break;
    }
    
    if (trimmed === 's') {
      console.log(`⏭️ Skipped ${candidate.name}.`);
      i++;
      continue;
    }
    
    // User pressed ENTER (or any other key)
    console.log(`\n✍️  Drafting personalized message for ${candidate.name}...`);
    const msg = generateMessage(candidate.name);
    
    console.log('📋 Copying message to macOS clipboard...');
    copyToClipboard(msg);
    
    console.log('🌐 Opening LinkedIn Message thread and highlighting on Mercor...');
    focusAndOpenCandidate(candidate.name, candidate.linkedinUrl);
    
    console.log(`\n\x1b[32m✨ Message successfully copied to clipboard! \x1b[0m`);
    console.log(`📋 Custom message starts with: "Greetings ${getFirstName(candidate.name)}..."`);
    console.log(`\n👉 \x1b[1mWhat to do now:\x1b[0m`);
    console.log(`   1. A new tab has opened in Chrome with the candidate's LinkedIn thread.`);
    console.log(`   2. Click the message text input and paste the copied message (\x1b[33mCmd + V\x1b[0m).`);
    console.log(`   3. Attach your Mercor Preparation Guide file from your Desktop:`);
    console.log(`      \x1b[34m/Users/176693/Desktop/Mercor_Preparation_Guide.docx\x1b[0m`);
    console.log(`   4. Click Send on LinkedIn.`);
    
    await askQuestion(`\n✅ Once sent, press \x1b[32mENTER\x1b[0m here to continue to the next candidate...`);
    i++;
  }
  
  rl.close();
  console.log('\n\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m🎉 All unvouched candidates processed! Done!         \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m\n');
}

main().catch(err => {
  console.error('Unhandled error in script:', err);
});
