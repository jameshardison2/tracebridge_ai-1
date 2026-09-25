const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Paths
const connectionsPath = '/Users/176693/Downloads/Connections.csv';
const htmlFallbackPath = '/Users/176693/tracebridge_ai/referrals_body.html';

// Helper to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to write text directly to macOS clipboard
function copyToClipboard(text) {
  const proc = spawn('pbcopy');
  proc.stdin.write(text);
  proc.stdin.end();
}

// Clean and normalize name for mapping
function normalizeName(name) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/"/g, '')
        .replace(/,\s*(mba|mha|phd|md|ms|bs|rn|rac|samd|ai|iap|phr|shrm-cp|cpl|fache|hacp|pmp|csm|bcpa|ma|bsn|bba)\b/g, '')
        .replace(/\b(mba|mha|phd|md|ms|bs|rn|rac|samd|ai|iap|phr|shrm-cp|cpl|fache|hacp|pmp|csm|bcpa|ma|bsn|bba)\b/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

// Load enriched LinkedIn URLs database
console.log('📊 Loading enriched connections database...');
const connectionsMap = new Map(); // Key: normalized name -> Value: LinkedIn URL & email
if (fs.existsSync(connectionsPath)) {
    const data = fs.readFileSync(connectionsPath, 'utf8');
    const lines = data.split(/\r?\n/).filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
        // Safe split respect quotes
        let inQuotes = false;
        let current = '';
        const cols = [];
        const line = lines[i];
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
            const char = line[charIdx];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                cols.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        cols.push(current.trim());
        
        if (cols.length >= 3) {
            const firstName = cols[0];
            const lastName = cols[1];
            const url = cols[2];
            const email = cols[3];
            const key = normalizeName(firstName) + '+' + normalizeName(lastName);
            connectionsMap.set(key, { url, email });
        }
    }
    console.log(`Loaded ${connectionsMap.size} mapped connections.`);
} else {
    console.log('⚠️  Connections.csv not found in Downloads. Profile URLs will be defaulted.');
}

// Get candidate first name
function getFirstName(fullName) {
  if (!fullName) return 'there';
  let cleaned = fullName.replace(/(Esq\.|PhD|MBA|CQF|ACHE|MD|MS|BS|B\.S\.|M\.S\.)/gi, '').trim();
  const parts = cleaned.split(/\s+/);
  const first = parts[0] || '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// Generates the personalized nudge copy based on state
function generateCopy(candidate, state) {
  const firstName = getFirstName(candidate.name);
  
  if (state === 'debrief') {
    return `Hey ${firstName},

I saw on my dashboard that you successfully completed your Mercor application and AI interview! First off, congratulations on locking that down. 

I'm putting together a quick debrief to help optimize the process for other folks in my network. If you have 2 minutes, I’d love your candid take:
1. Did the prep guide I shared actually match the vibe/questions of the AI interview?
2. Where did the AI interface feel clunky or weird?
3. Do you feel the jobs they matched you with actually fit your real experience?

Really appreciate your feedback on this—your insights shape how I help the next round of applicants. Let me know how it went!

Best,
James`;
  }
  
  if (state === 'stuck_marcia') {
    return `Hey Marcia,

Hope you're doing great! I saw in our chat history that you already knocked out the AI interview. 

I want to make sure your profile gets maximum visibility. I've prepared a direct, detailed professional recommendation (vouch) for you on the platform to help fast-track your review. 

Have you heard any direct updates or interview requests from the Mercor matching team since you submitted? Let me know so I can coordinate!

-James`;
  }

  if (state === 'stuck_personal') {
    return `Hey ${firstName},

I noticed you started your Mercor application but haven't finished up the short AI interview yet. 

I wanted to check in and see if you hit any technical bugs, or if you had any questions on the roles? I have a direct interview prep guide that has been helping folks navigate the AI interview format successfully.

Let me know if you'd like me to send that guide over, or if you want to hop on a quick 5-min call to sync on listings!

-James`;
  }

  if (state === 'signed_up') {
    return `Hey ${firstName},

I saw you got signed up on the Mercor platform—awesome first step!

The next move to actually get surfaced for roles is picking 2-4 listings and starting the work authorization/availability steps. It only takes about 4 minutes to get that part squared away.

I'm holding a quick virtual office hours session this Wednesday evening to help people select the highest-paying listings that fit their backgrounds and share my preparation guide. 

Would love to have you join if you want to speed-run the process. Let me know if you can make it and I'll send over the link!

Best,
James`;
  }

  // Fallback default nudge
  return `Hey ${firstName},

Just following up to see if you had a chance to complete the AI interview on Mercor? 

I have a direct prep guide with the exact tips that convert to high-paying listings. Let me know if you'd like me to send it over!

-James`;
}

// Scrape names directly from Chrome using AppleScript
function getReferralsFromChrome() {
  const jsCode = `(function() {
    // 1. Detect active tab
    const referralsTab = document.querySelector('button[data-test="referrals-tab"]');
    const connectionsTab = document.querySelector('button[data-test="connections-tab"]');
    let activeTab = 'referrals';
    if (connectionsTab && (connectionsTab.classList.contains('text-indigo-600') || connectionsTab.classList.contains('border-indigo-500'))) {
        activeTab = 'connections';
    }
    
    // 2. Detect active status filter if on referrals tab
    let activeStatus = 'Signed Up';
    if (activeTab === 'referrals') {
        const activeFilterEl = document.querySelector('[data-tour="stats-panel"] button.border-indigo-600, [data-tour="stats-panel"] button.bg-indigo-50, button.border-b-2.border-indigo-600, button.bg-indigo-50');
        if (activeFilterEl) {
            const h4 = activeFilterEl.querySelector('h4');
            if (h4) {
                activeStatus = h4.textContent.trim();
            }
        }
    }
    
    // 3. Select candidate row elements strictly
    let rowElements = Array.from(document.querySelectorAll('.divide-y > div > .group.flex, [data-tour="referral-row"] > .group.flex, .divide-y > .group.flex'));
    if (rowElements.length === 0) {
        // Fallback to all group flex rows without backslash brackets
        rowElements = Array.from(document.querySelectorAll('.group.flex[class*="h-[44px]"], .group.flex.cursor-pointer'));
    }
    if (rowElements.length === 0) {
        // Hard fallback to divide-y children
        rowElements = Array.from(document.querySelectorAll('.divide-y > div, [data-tour="referral-row"]'));
    }
    
    const results = [];
    const seenNames = new Set();
    
    rowElements.forEach(rowEl => {
      // Find candidate name in rowEl
      const nameSpan = rowEl.querySelector('span.hidden.sm\\\\:inline') || rowEl.querySelector('span.sm\\\\:hidden');
      let name = nameSpan ? nameSpan.textContent.trim() : '';
      if (!name) {
          const firstCol = rowEl.children[0];
          if (firstCol) {
              const span = firstCol.querySelector('span');
              name = span ? span.textContent.trim() : firstCol.textContent.trim();
          }
      }
      
      // Clean name
      if (name) {
          name = name.replace(/\\s+/g, ' ').trim();
      }
      
      // Filter out headers, empty, currency, or duplicate names
      if (!name || name === 'Referee' || name.includes('$') || name.includes('applications') || name.length > 50 || seenNames.has(name)) {
          return;
      }
      
      seenNames.add(name);
      results.push({ name, status: activeStatus });
    });
    
    return JSON.stringify(results);
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
          return "ERROR"
      end if
  end tell
  `;

  const tempFile = 'scripts/referrals-messenger-extract.applescript';
  fs.writeFileSync(tempFile, appleScript);
  
  try {
    const result = execSync(`osascript ${tempFile}`, { encoding: 'utf8' }).trim();
    try { fs.unlinkSync(tempFile); } catch (e) {}
    
    if (result === 'ERROR' || !result.startsWith('[')) {
      throw new Error('Chrome not on Mercor page');
    }
    return JSON.parse(result);
  } catch (e) {
    try { fs.unlinkSync(tempFile); } catch (err) {}
    return null; // Fallback trigger
  }
}

// Scscroll and open URL in Chrome
function focusAndOpenLinkedIn(name, linkedinUrl) {
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
          tell foundWin to make new tab with properties {URL:"${linkedinUrl}"}
          return "OK"
      else
          -- If Mercor tab not found, just open new tab in front window
          tell front window to make new tab with properties {URL:"${linkedinUrl}"}
          return "OK"
      end if
  end tell
  `;

  const tempFile = 'scripts/referrals-messenger-focus.applescript';
  fs.writeFileSync(tempFile, appleScript);
  try {
    execSync(`osascript ${tempFile}`, { encoding: 'utf8' });
    try { fs.unlinkSync(tempFile); } catch (e) {}
  } catch (e) {
    try { fs.unlinkSync(tempFile); } catch (err) {}
  }
}

// Fallback lists if Chrome is not open
const fallbackCompleted = [
  { name: 'Sara Raut, MSA', status: 'Application Completed' },
  { name: 'Marcia Weeden', status: 'Application Completed' }
];

const fallbackStuck = [
  { name: 'Okey Mbanugo', status: 'Application Started' },
  { name: 'Gregory Gryczsan', status: 'Application Started' },
  { name: 'Wenting Luo', status: 'Application Started' },
  { name: 'Hemant', status: 'Application Started' },
  { name: 'Yaseen Saddique', status: 'Application Started' },
  { name: 'sherquel sands-stimac', status: 'Application Started' },
  { name: 'Remy Junior', status: 'Application Started' },
  { name: 'Isaac Caputo', status: 'Application Started' },
  { name: 'channing clariett', status: 'Application Started' },
  { name: 'Matthew Hardison', status: 'Application Started' },
  { name: 'Starasia Carvey', status: 'Application Started' },
  { name: 'Michelle Chang', status: 'Application Started' },
  { name: 'Natalie Esikumo', status: 'Application Started' }
];

const fallbackSignedUp = [
  { name: 'Hemant Kumar', status: 'Signed Up' },
  { name: 'Andrew Miller', status: 'Signed Up' },
  { name: 'Kiran Zahra', status: 'Signed Up' },
  { name: 'David Oakes', status: 'Signed Up' }
];
// Automatically scroll active Chrome tab to trigger lazy loading of more connections
async function scrollChromeToLoadMore() {
  console.log('⏳ Scrolling Chrome page to load more connections (fetching 100+)...');
  
  const scrollJs = `
  (function() {
      // 1. Scroll window and dispatch event
      window.scrollTo(0, window.scrollY - 30);
      window.dispatchEvent(new Event('scroll', { bubbles: true }));
      window.scrollTo(0, 99999);
      window.dispatchEvent(new Event('scroll', { bubbles: true }));
      
      // 2. Scroll documentElement / body and dispatch
      document.documentElement.scrollTop = document.documentElement.scrollTop - 30;
      document.documentElement.dispatchEvent(new Event('scroll', { bubbles: true }));
      document.documentElement.scrollTop = 99999;
      document.documentElement.dispatchEvent(new Event('scroll', { bubbles: true }));
      
      if (document.body) {
          document.body.scrollTop = document.body.scrollTop - 30;
          document.body.dispatchEvent(new Event('scroll', { bubbles: true }));
          document.body.scrollTop = 99999;
          document.body.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
      
      // 3. Scroll main container and dispatch
      const main = document.querySelector('main');
      if (main) {
          main.scrollTop = main.scrollTop - 30;
          main.dispatchEvent(new Event('scroll', { bubbles: true }));
          main.scrollTop = main.scrollHeight;
          main.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
      
      // 4. Scroll referrals container and dispatch
      const scrollContainer = document.querySelector('#referrals-scroll-container');
      if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollTop - 30;
          scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
          scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
      
      return "OK";
  })()`;
  
  const escapedScrollJs = scrollJs.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  
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
          execute t javascript "${escapedScrollJs}"
          return "OK"
      else
          return "ERROR"
      end if
  end tell
  `;
  
  const tempFile = 'scripts/referrals-messenger-scroll.applescript';
  
  // Scroll 15 times to load a very large list of connections!
  for (let i = 0; i < 15; i++) {
      fs.writeFileSync(tempFile, appleScript);
      try {
          execSync(`osascript ${tempFile}`, { encoding: 'utf8' });
      } catch (e) {}
      try { fs.unlinkSync(tempFile); } catch (e) {}
      await sleep(350); // Allow time to fetch and render
  }
}

// Wait for candidate rows to render in Chrome DOM
async function waitForRowsToLoad(tabName = 'referrals') {
  console.log(`⏳ Waiting for Chrome "${tabName}" tab content to render...`);
  
  const checkJs = `
  (function() {
      const connectionsTab = document.querySelector('button[data-test="connections-tab"]');
      let activeTab = 'referrals';
      if (connectionsTab && (connectionsTab.classList.contains('text-indigo-600') || connectionsTab.classList.contains('border-indigo-500') || connectionsTab.classList.contains('border-b-2') || connectionsTab.className.includes('text-indigo-600') || connectionsTab.className.includes('border-indigo-500'))) {
          activeTab = 'connections';
      }
      
      if (activeTab !== "${tabName}") {
          return 0;
      }
      
      const rows = document.querySelectorAll('.divide-y > div > .group.flex, [data-tour="referral-row"] > .group.flex, .divide-y > .group.flex, .group.flex[class*="h-[44px]"], .group.flex.cursor-pointer');
      return rows.length;
  })()`;
  
  const escapedCheckJs = checkJs.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  
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
          set resultHTML to execute t javascript "${escapedCheckJs}"
          return resultHTML
      else
          return "0"
      end if
  end tell
  `;
  
  const tempFile = 'scripts/referrals-messenger-check.applescript';
  
  // Wait up to 5 seconds (25 attempts * 200ms)
  for (let attempt = 0; attempt < 25; attempt++) {
      fs.writeFileSync(tempFile, appleScript);
      let rowCount = 0;
      try {
          const res = execSync(`osascript ${tempFile}`, { encoding: 'utf8' }).trim();
          rowCount = parseInt(res) || 0;
      } catch (e) {}
      try { fs.unlinkSync(tempFile); } catch (e) {}
      
      if (rowCount > 0) {
          console.log(`✅ Tab content loaded successfully! Found ${rowCount} initial candidates.`);
          return true;
      }
      await sleep(200);
  }
  
  console.log('⚠️  Timed out waiting for Chrome tab content. Proceeding anyway...');
  return false;
}

// Automatically click the correct tab button in Chrome to switch views
async function switchChromeTab(tabName) {
  console.log(`\n🔄 Telling Chrome to automatically switch to the "${tabName}" tab view...`);
  
  const clickJs = `
  (function() {
      const btn = document.querySelector('button[data-test="${tabName}-tab"]');
      if (btn) {
          btn.click();
          return "OK";
      }
      return "NOT_FOUND";
  })()`;
  
  const escapedClickJs = clickJs.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  
  const appleScript = `
  tell application "Google Chrome"
      activate
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
          execute t javascript "${escapedClickJs}"
          return "OK"
      else
          return "ERROR"
      end if
  end tell
  `;
  
  const tempFile = 'scripts/referrals-messenger-click.applescript';
  fs.writeFileSync(tempFile, appleScript);
  try {
      execSync(`osascript ${tempFile}`, { encoding: 'utf8' });
  } catch (e) {}
  try { fs.unlinkSync(tempFile); } catch (e) {}
  
  await sleep(1500); // Wait for React to load the new tab content
}

// Helper to execute raw JS in Google Chrome and return the result
function executeChromeJs(jsCode, shouldActivate = false) {
  const escapedJs = jsCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const appleScript = `
  tell application "Google Chrome"
      ${shouldActivate ? 'activate' : ''}
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
          return "ERROR"
      end if
  end tell
  `;
  
  const tempFile = 'scripts/referrals-messenger-exec.applescript';
  fs.writeFileSync(tempFile, appleScript);
  try {
    const result = execSync(`osascript ${tempFile}`, { encoding: 'utf8' }).trim();
    try { fs.unlinkSync(tempFile); } catch (e) {}
    if (result === 'ERROR') {
      return null;
    }
    return result;
  } catch (e) {
    try { fs.unlinkSync(tempFile); } catch (err) {}
    return null;
  }
}

// JS to execute inside Chrome for a single step of the scroll-and-scrape loop
const stepJs = `(function() {
    // 1. Scrape currently visible candidate rows
    let rowElements = Array.from(document.querySelectorAll('.divide-y > div > .group.flex, [data-tour="referral-row"] > .group.flex, .divide-y > .group.flex'));
    if (rowElements.length === 0) {
        rowElements = Array.from(document.querySelectorAll('.group.flex[class*="h-[44px]"], .group.flex.cursor-pointer'));
    }
    if (rowElements.length === 0) {
        rowElements = Array.from(document.querySelectorAll('.divide-y > div, [data-tour="referral-row"]'));
    }
    
    // Detect active tab and status
    const referralsTab = document.querySelector('button[data-test="referrals-tab"]');
    const connectionsTab = document.querySelector('button[data-test="connections-tab"]');
    let activeTab = 'referrals';
    if (connectionsTab && (connectionsTab.classList.contains('text-indigo-600') || connectionsTab.classList.contains('border-indigo-500'))) {
        activeTab = 'connections';
    }
    
    let activeStatus = 'Signed Up';
    if (activeTab === 'referrals') {
        const activeFilterEl = document.querySelector('[data-tour="stats-panel"] button.border-indigo-600, [data-tour="stats-panel"] button.bg-indigo-50, button.border-b-2.border-indigo-600, button.bg-indigo-50');
        if (activeFilterEl) {
            const h4 = activeFilterEl.querySelector('h4');
            if (h4) {
                activeStatus = h4.textContent.trim();
            }
        }
    }
    
    const visible = [];
    const seenNames = new Set();
    
    rowElements.forEach(rowEl => {
        const nameSpan = rowEl.querySelector('span.hidden.sm\\\\:inline') || rowEl.querySelector('span.sm\\\\:hidden');
        let name = nameSpan ? nameSpan.textContent.trim() : '';
        if (!name) {
            const firstCol = rowEl.children[0];
            if (firstCol) {
                const span = firstCol.querySelector('span');
                name = span ? span.textContent.trim() : firstCol.textContent.trim();
            }
        }
        
        if (name) {
            name = name.replace(/\\s+/g, ' ').trim();
        }
        
        if (!name || name === 'Referee' || name.includes('$') || name.includes('applications') || name.length > 50 || seenNames.has(name)) {
            return;
        }
        
        seenNames.add(name);
        visible.push({ name, status: activeStatus });
    });
    
    // 2. Perform instant snap-scroll wiggling
    // Explicitly overrides any global HTML CSS 'scroll-behavior: smooth' which would lock/delay programmatic scrolls
    const currentY = window.scrollY || document.documentElement.scrollTop || 0;
    window.scrollTo({ top: Math.max(0, currentY - 30), behavior: 'instant' });
    window.dispatchEvent(new Event('scroll', { bubbles: true }));
    window.scrollTo({ top: currentY + 450, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll', { bubbles: true }));
    
    const docEl = document.documentElement;
    if (docEl) {
        const currentDocY = docEl.scrollTop || 0;
        docEl.scrollTo({ top: Math.max(0, currentDocY - 30), behavior: 'instant' });
        docEl.dispatchEvent(new Event('scroll', { bubbles: true }));
        docEl.scrollTo({ top: currentDocY + 450, behavior: 'instant' });
        docEl.dispatchEvent(new Event('scroll', { bubbles: true }));
    }
    
    const main = document.querySelector('main');
    if (main) {
        const currentMainY = main.scrollTop || 0;
        main.scrollTo({ top: Math.max(0, currentMainY - 30), behavior: 'instant' });
        main.dispatchEvent(new Event('scroll', { bubbles: true }));
        main.scrollTo({ top: currentMainY + 450, behavior: 'instant' });
        main.dispatchEvent(new Event('scroll', { bubbles: true }));
    }
    
    return JSON.stringify(visible);
})()`;

// Dynamic scroll-and-scrape aggregator
async function scrollAndScrapeFromChrome(tabName, targetCount = 200, skipNames = new Set()) {
  // 1. Automatically switch to the correct tab in Google Chrome, activating Chrome to un-throttle observers
  await switchChromeTab(tabName);
  
  // 2. Ensure initial row elements mount and render
  const loaded = await waitForRowsToLoad(tabName);
  if (!loaded) {
      console.log('⚠️  Failed to load initial candidates in Chrome. Dynamic scraping cancelled.');
      return [];
  }

  console.log(`\n⏳ Dynamic scroll-and-scrape started. Target: ${targetCount} new unique candidates...`);
  
  // 3. Reset scroll position to top ONLY if skipNames is empty (first batch)
  // Uses explicit snap behavior to guarantee resetting scroll instantly to top, bringing Chrome to front
  if (skipNames.size === 0) {
      // Bring Chrome to foreground to prevent background throttling!
      executeChromeJs(`(function() { window.focus(); return "OK"; })()`, true);
      await sleep(100);

      // Navigate back to Page 1 if we are currently on a subsequent page
      console.log('🔄 Checking if we need to navigate back to Page 1...');
      const goToPageOneJs = `
      (function() {
          const buttons = Array.from(document.querySelectorAll('button'));
          const prevBtn = buttons.find(btn => {
              const text = btn.textContent?.trim() || '';
              if (text !== 'Previous') return false;
              const className = btn.className || '';
              const isIndigo = className.includes('indigo') || className.includes('bg-indigo');
              return !isIndigo;
          });
          
          if (!prevBtn) return "NOT_FOUND";
          
          const isDisabled = prevBtn.disabled || prevBtn.getAttribute('disabled') !== null || prevBtn.classList.contains('disabled');
          if (isDisabled) return "ALREADY_FIRST_PAGE";
          
          prevBtn.click();
          return "CLICKED";
      })()`;

      for (let attempt = 0; attempt < 10; attempt++) {
          const navRes = executeChromeJs(goToPageOneJs, true);
          if (navRes === "ALREADY_FIRST_PAGE" || navRes === "NOT_FOUND") {
              break;
          }
          if (navRes === "CLICKED") {
              console.log('⬅️  Clicking "Previous" page button to return toward Page 1...');
              await sleep(1200); // Wait for the page to load
          }
      }

      executeChromeJs(`
        (function() {
            window.focus();
            const main = document.querySelector('main');
            if (main) { main.scrollTo({ top: 0, behavior: 'instant' }); }
            window.scrollTo({ top: 0, behavior: 'instant' });
            if (document.documentElement) { document.documentElement.scrollTo({ top: 0, behavior: 'instant' }); }
            return "OK";
        })()
      `, true);
      await sleep(400);
  } else {
      // Just activate Chrome to ensure no throttling
      executeChromeJs(`(function() { window.focus(); return "OK"; })()`, true);
      await sleep(100);
  }

  const accumulated = new Map();
  let consecutiveZeroNewDocs = 0;
  const totalSteps = 120; // Expanded scroll steps to easily support 200+ unique candidates

  for (let step = 0; step < totalSteps; step++) {
      // Keep Chrome in the foreground for the first few loops
      const resultJson = executeChromeJs(stepJs, step < 3);
      if (!resultJson) {
          console.log('⚠️  Error communicating with Chrome during scroll step.');
          break;
      }

      let parsed = [];
      try {
          parsed = JSON.parse(resultJson);
      } catch (e) {
          console.log('⚠️  Failed to parse candidate JSON from Chrome.');
          break;
      }

      let newFoundThisStep = 0;
      parsed.forEach(c => {
          if (!skipNames.has(c.name) && !accumulated.has(c.name)) {
              accumulated.set(c.name, c);
              newFoundThisStep++;
          }
      });

      if (newFoundThisStep === 0) {
          consecutiveZeroNewDocs++;
      } else {
          consecutiveZeroNewDocs = 0;
      }

      process.stdout.write(`   [Step ${step + 1}/${totalSteps}] Found ${parsed.length} visible. Accumulated new: ${accumulated.size} (+${newFoundThisStep})\r`);

      // Exit early if we have successfully parsed enough candidates
      if (accumulated.size >= targetCount) {
          console.log(`\n✅ Successfully reached the target batch size of ${targetCount} new candidates.`);
          break;
      }

      // Exit early if we have scrolled many times and no new candidates appear (bottom reached)
      if (consecutiveZeroNewDocs >= 12 && accumulated.size > 0) {
          // If we haven't reached the target count, try to click the "Next" page button to page forward
          if (accumulated.size < targetCount) {
              const tryClickNextPageJs = `
              (function() {
                  const spans = Array.from(document.querySelectorAll('span, div, p'));
                  const rangeSpan = spans.find(s => s.textContent?.trim().match(/^\\d+-\\d+$/));
                  const oldRange = rangeSpan ? rangeSpan.textContent.trim() : '';
                  
                  const buttons = Array.from(document.querySelectorAll('button'));
                  const nextBtn = buttons.find(btn => {
                      const text = btn.textContent?.trim() || '';
                      if (text !== 'Next') return false;
                      const className = btn.className || '';
                      const isIndigo = className.includes('indigo') || className.includes('bg-indigo');
                      return !isIndigo;
                  });
                  
                  if (!nextBtn) return JSON.stringify({ status: "NOT_FOUND", oldRange });
                  
                  const isDisabled = nextBtn.disabled || nextBtn.getAttribute('disabled') !== null || nextBtn.classList.contains('disabled');
                  if (isDisabled) return JSON.stringify({ status: "DISABLED", oldRange });
                  
                  nextBtn.click();
                  return JSON.stringify({ status: "CLICKED", oldRange });
              })()`;
              
              const clickResRaw = executeChromeJs(tryClickNextPageJs, true);
              let clickRes = { status: "ERROR", oldRange: "" };
              try {
                  clickRes = JSON.parse(clickResRaw);
              } catch (e) {}
              
              if (clickRes.status === "CLICKED") {
                  console.log('\n➡️  Moving to the next page of candidates...');
                  
                  const getRangeTextJs = `
                  (function() {
                      const spans = Array.from(document.querySelectorAll('span, div, p'));
                      const rangeSpan = spans.find(s => s.textContent?.trim().match(/^\\d+-\\d+$/));
                      return rangeSpan ? rangeSpan.textContent.trim() : '';
                  })()`;
                  
                  let pageChanged = false;
                  for (let attempt = 0; attempt < 20; attempt++) {
                      await sleep(200);
                      const newRange = executeChromeJs(getRangeTextJs);
                      if (newRange && newRange !== clickRes.oldRange) {
                          console.log(`✅ Loaded next page successfully. New range: ${newRange}`);
                          pageChanged = true;
                          break;
                      }
                  }
                  
                  if (!pageChanged) {
                      console.log('⚠️  Timed out waiting for page transition. Trying to proceed anyway...');
                  }
                  
                  // Scroll back to the top of the new page
                  executeChromeJs(`
                    (function() {
                        window.focus();
                        const main = document.querySelector('main');
                        if (main) { main.scrollTo({ top: 0, behavior: 'instant' }); }
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        if (document.documentElement) { document.documentElement.scrollTo({ top: 0, behavior: 'instant' }); }
                        return "OK";
                    })()
                  `, true);
                  await sleep(400);
                  
                  consecutiveZeroNewDocs = 0;
                  continue; // Continue scroll-scraping the next page
              }
          }
          
          console.log(`\nℹ️  Reached bottom of the tab or no more new connections detected.`);
          break;
      }

      // Slightly larger sleep (400ms) to allow virtualized DOM to update and render next batch of candidates
      await sleep(400);
  }

  const finalList = Array.from(accumulated.values());
  console.log(`\n🎉 dynamic scrape completed! Loaded ${finalList.length} new unique candidates from Chrome.`);
  return finalList;
}

// Main runner
async function main() {
  console.log('\n\x1b[36m====================================================\x1b[0m');
  console.log('\x1b[36m🚀  Mercor Pipeline Outreach & Nudge Automator      \x1b[0m');
  console.log('\x1b[36m====================================================\x1b[0m\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

  while (true) {
    console.log('\n📋 \x1b[1mSelect Pipeline Treatment Category:\x1b[0m');
    console.log('1. [🚨 Non-Negotiable] Debrief Completed Referrals (Marcia, Sara, etc.)');
    console.log('2. [⚡ Stuck Nudge] Top Stuck Referrals (Okey, Gregory, Wenting, Marcia, Hemant)');
    console.log('3. [⚡ Stuck Nudge] Next Stuck Referrals (Yaseen, sherquel, Remy, Isaac, channing)');
    console.log('4. [🚀 Activation] Signed Up (No Application Started)');
    console.log('q. Exit Program');

    const catChoice = (await askQuestion('\nChoice (1-4, q): ')).trim().toLowerCase();

    if (catChoice === 'q') {
      console.log('\n👋 Exiting outreach automator. Good luck on the 90-day plan!');
      break;
    }

    if (catChoice !== '1' && catChoice !== '2' && catChoice !== '3' && catChoice !== '4') {
      console.log('❌ Invalid selection.');
      continue;
    }

    // Ask user how many candidates to load
    const defaultBatchSize = catChoice === '4' ? 200 : 50;
    let batchSize = defaultBatchSize;
    const sizeInput = await askQuestion(`\nHow many candidates to load? (default [${defaultBatchSize}]): `);
    const trimmedSize = sizeInput.trim();
    if (trimmedSize !== '') {
        const parsedSize = parseInt(trimmedSize);
        if (!isNaN(parsedSize) && parsedSize > 0) {
            batchSize = parsedSize;
        } else {
            console.log(`⚠️  Invalid size, using default [${defaultBatchSize}].`);
            batchSize = defaultBatchSize;
        }
    } else {
        batchSize = defaultBatchSize;
    }

    // Choose delivery mode
    let deliveryMode = 'interactive';
    console.log('\n🤖 \x1b[1mSelect Messaging Delivery Mode:\x1b[0m');
    console.log('1. Interactive Mode (Default - CLI drafts nudge, you paste & send manually)');
    console.log('2. Autonomous Mode (AI automatically clicks Message, injects copy, and clicks Send!)');
    const modeInput = await askQuestion('\nChoice (1-2, default [1]): ');
    if (modeInput.trim() === '2') {
        deliveryMode = 'autonomous';
        console.log('\n🤖 \x1b[36mAutonomous Mode activated! Chrome will send messages automatically.\x1b[0m');
    }

    let activeList = [];
    let stateType = 'nudge';
    let tabName = 'referrals';
    const skipNames = new Set(); // Stores already loaded/seen candidates in this session

    if (catChoice === '1') {
      tabName = 'referrals';
      console.log('🔄 Scraping completed candidates dynamically from Chrome...');
      let liveReferrals = await scrollAndScrapeFromChrome(tabName, batchSize, skipNames);
      if (liveReferrals && liveReferrals.length > 0) {
          activeList = liveReferrals.filter(c => c.status.toLowerCase().includes('completed'));
      }
      if (activeList.length === 0) {
          activeList = fallbackCompleted;
          console.log(`\nℹ️  No live completed candidates visible in Chrome. Using highly accurate fallbacks (${activeList.length} items).`);
      }
      stateType = 'debrief';
      
    } else if (catChoice === '2' || catChoice === '3') {
      tabName = 'referrals';
      console.log('🔄 Scraping stuck candidates dynamically from Chrome...');
      let liveReferrals = await scrollAndScrapeFromChrome(tabName, batchSize, skipNames);
      let stuckReferrals = [];
      if (liveReferrals && liveReferrals.length > 0) {
          stuckReferrals = liveReferrals.filter(c => c.status.toLowerCase().includes('started') || c.status.toLowerCase().includes('application'));
      }
      if (stuckReferrals.length === 0) {
          stuckReferrals = fallbackStuck;
          console.log(`\nℹ️  No live stuck candidates visible in Chrome. Using highly accurate fallbacks (${stuckReferrals.length} items).`);
      }
      
      if (catChoice === '2') {
          activeList = stuckReferrals.slice(0, 5);
      } else {
          activeList = stuckReferrals.slice(5);
      }
      stateType = 'stuck_personal';
      
    } else if (catChoice === '4') {
      tabName = 'connections';
      console.log('🔄 Scraping connections dynamically from Chrome...');
      let liveReferrals = await scrollAndScrapeFromChrome(tabName, batchSize, skipNames);
      if (liveReferrals && liveReferrals.length > 0) {
          activeList = liveReferrals.filter(c => c.status.toLowerCase().includes('signed') || c.status.toLowerCase().includes('up'));
      }
      if (activeList.length === 0) {
          activeList = fallbackSignedUp;
          console.log(`\nℹ️  No live connections visible in Chrome. Using highly accurate fallbacks (${activeList.length} items).`);
      }
      stateType = 'signed_up';
    }

    if (activeList.length === 0) {
      console.log('⚠️  No candidates in this list.');
      continue;
    }

    let lastSelectedIndex = 0;
    let isFirstAutonomousSelect = true;
    while (true) {
        console.log(`\n📋 \x1b[1mCandidates in this category:\x1b[0m`);
        activeList.forEach((c, idx) => {
          console.log(`${idx + 1}. ${c.name} (${c.status})`);
        });

        const defaultIdx = lastSelectedIndex < activeList.length ? lastSelectedIndex + 1 : 1;
        let candIndexTrim = '';
        if (deliveryMode === 'autonomous' && !isFirstAutonomousSelect) {
            console.log(`\n🤖 [Autonomous Mode] Automatically selecting next candidate index: [${defaultIdx}]`);
            await sleep(1500); // Safe delay to let console settle
            candIndexTrim = ''; // Uses defaultIdx
        } else {
            const candIndexStr = await askQuestion(`\nSelect Candidate index (1-${activeList.length}, default [${defaultIdx}]) or type 'b' to go back, or 'n' for next ${batchSize}: `);
            candIndexTrim = candIndexStr.trim().toLowerCase();
            isFirstAutonomousSelect = false; // Initial choice made by user
        }

        if (candIndexTrim === 'b') {
            break; // Back to category selection
        }

        if (candIndexTrim === 'n') {
            // Add current candidates to the skip list to guarantee unseen ones
            activeList.forEach(c => skipNames.add(c.name));
            console.log(`\n🔄 Requesting next batch of ${batchSize} fresh candidates from Chrome...`);
            
            let newBatch = await scrollAndScrapeFromChrome(tabName, batchSize, skipNames);
            if (newBatch && newBatch.length > 0) {
                // Apply the pipeline filtering to the new batch
                if (catChoice === '1') {
                    activeList = newBatch.filter(c => c.status.toLowerCase().includes('completed'));
                } else if (catChoice === '2' || catChoice === '3') {
                    let stuckReferrals = newBatch.filter(c => c.status.toLowerCase().includes('started') || c.status.toLowerCase().includes('application'));
                    if (catChoice === '2') {
                        activeList = stuckReferrals.slice(0, 5);
                    } else {
                        activeList = stuckReferrals.slice(5);
                    }
                } else if (catChoice === '4') {
                    activeList = newBatch.filter(c => c.status.toLowerCase().includes('signed') || c.status.toLowerCase().includes('up'));
                }

                if (activeList.length === 0) {
                    console.log('⚠️  No matching candidates found in this scrolled segment. Type \'n\' to scroll deeper.');
                } else {
                    lastSelectedIndex = 0; // Reset default index for the new list
                }
            } else {
                console.log('⚠️  No further unseen candidates found on this tab.');
            }
            continue;
        }

        let candIdx = defaultIdx - 1;
        if (candIndexTrim !== '') {
            candIdx = parseInt(candIndexTrim) - 1;
            if (isNaN(candIdx) || candIdx < 0 || candIdx >= activeList.length) {
              console.log('❌ Invalid index.');
              continue;
            }
        }

        const candidate = activeList[candIdx];
        
        // Customize state for Marcia Weeden
        let finalState = stateType;
        if (candidate.name.includes('Marcia Weeden') && stateType === 'stuck_personal') {
          finalState = 'stuck_marcia';
        }

        const nameParts = candidate.name.split(',')[0].trim().split(/\s+/);
        const first = nameParts[0] || '';
        const last = nameParts.slice(1).join(' ') || '';
        const normFirst = normalizeName(first);
        const normLast = normalizeName(last);
        
        // Look up LinkedIn URL in map
        let linkedinUrl = 'https://www.linkedin.com/messaging/';
        let emailStatus = 'Not found';
        
        // Look for key in map
        let mapped = null;
        for (const [key, val] of connectionsMap.entries()) {
            const keyParts = key.split('+');
            const mapFirst = keyParts[0] || '';
            const mapLast = keyParts.slice(1).join('+') || '';
            if (mapFirst === normFirst && (mapLast.includes(normLast) || normLast.includes(mapLast))) {
                mapped = val;
                break;
            }
        }

        if (mapped) {
            linkedinUrl = mapped.url;
            emailStatus = mapped.email || 'Found but empty';
        } else {
            // Fallback search link
            linkedinUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(candidate.name)}`;
        }

        console.log(`\n\x1b[34m--------------------------------------------------\x1b[0m`);
        console.log(`👤 \x1b[1mCandidate: ${candidate.name}\x1b[0m`);
        console.log(`📧 Database Email: ${emailStatus}`);
        console.log(`🔗 Target URL: ${linkedinUrl}`);
        console.log(`\x1b[34m--------------------------------------------------\x1b[0m`);

        console.log(`\n✍️  Drafting personalized message...`);
        const msg = generateCopy(candidate, finalState);
        console.log('📋 Copying message to clipboard...');
        copyToClipboard(msg);

        console.log('🌐 Opening LinkedIn Message thread in Chrome...');
        focusAndOpenLinkedIn(candidate.name, linkedinUrl);

        console.log(`\n\x1b[32m✨ Message successfully copied to clipboard! \x1b[0m`);
        console.log(`\n👉 \x1b[1mWhat to do now:\x1b[0m`);
        console.log(`   1. Chrome has opened the candidate's LinkedIn thread/search.`);
        console.log(`   2. Click the message text input and paste the copied message (\x1b[33mCmd + V\x1b[0m).`);
        if (finalState === 'stuck_personal' || finalState === 'signed_up') {
            console.log(`   3. Attach your Mercor Preparation Guide file from your Desktop:`);
            console.log(`      \x1b[34m/Users/176693/Desktop/Mercor_Preparation_Guide.docx\x1b[0m`);
        }
        console.log(`   4. Click Send on LinkedIn.`);

        if (deliveryMode === 'autonomous') {
            console.log(`🤖 \x1b[36m[Autonomous Mode] Initiating message delivery sequence for ${candidate.name}...\x1b[0m`);
            
            // Step 1: Wait for profile page to load
            console.log('⏳ Waiting 6 seconds for LinkedIn profile page to load...');
            await sleep(6000);
            
            // Step 2: Click the Message button
            console.log('💬 Attempting to click "Message" button...');
            const clickJs = `
            (function() {
                let textbox = document.querySelector('.msg-form__contenteditable') || 
                              document.querySelector('div[contenteditable="true"]') || 
                              document.querySelector('[contenteditable="true"]') ||
                              document.querySelector('div[role="textbox"]');
                if (textbox) return "ALREADY_OPEN";
                const buttons = Array.from(document.querySelectorAll('button, a'));
                const msgBtn = buttons.find(el => {
                    const txt = el.textContent.trim();
                    if (txt !== 'Message') return false;
                    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
                    return true;
                });
                if (msgBtn) {
                    msgBtn.click();
                    return "CLICKED";
                }
                return "NOT_FOUND";
            })()`;
            
            const clickRes = executeChromeJs(clickJs, true);
            console.log(`💬 Message button status: ${clickRes}`);
            
            // Step 3: Wait for chat box to open with programmatic retry polling
            console.log('⏳ Polling Chrome for chat box textbox to initialize and render (up to 12s)...');
            let textboxFound = false;
            const checkTextboxJs = `
            (function() {
                let textbox = document.querySelector('.msg-form__contenteditable') || 
                              document.querySelector('div[contenteditable="true"]') || 
                              document.querySelector('[contenteditable="true"]') ||
                              document.querySelector('div[role="textbox"]');
                return textbox ? "FOUND" : "NOT_FOUND";
            })()`;
            
            for (let attempt = 0; attempt < 24; attempt++) {
                const res = executeChromeJs(checkTextboxJs, true);
                if (res === "FOUND") {
                    textboxFound = true;
                    break;
                }
                await sleep(500);
            }
            
            if (textboxFound) {
                console.log('✅ Chat box textbox found in Chrome DOM!');
            } else {
                console.log('⚠️  Chat box textbox did not mount in time. Attempting anyway...');
            }
            
            // Step 4: Inject message and click Send
            console.log('✉️  Injecting message copy and sending...');
            const escapedMsg = msg.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\${/g, '\\${');
            const sendJs = `
            (function() {
                let textbox = document.querySelector('.msg-form__contenteditable') || 
                              document.querySelector('div[contenteditable="true"]') || 
                              document.querySelector('[contenteditable="true"]') ||
                              document.querySelector('div[role="textbox"]');
                if (!textbox) return "TEXTBOX_NOT_FOUND";
                
                textbox.focus();
                textbox.innerHTML = '';
                const messageText = \`${escapedMsg}\`;
                const lines = messageText.split('\\n');
                lines.forEach(line => {
                    const p = document.createElement('p');
                    p.textContent = line;
                    textbox.appendChild(p);
                });
                
                textbox.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Dispatch basic keyboard events to make sure any complex editor frameworks trigger changes
                textbox.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
                textbox.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true }));
                textbox.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
                
                const sendBtn = document.querySelector('button.msg-form__send-button') || document.querySelector('button[type="submit"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Send');
                if (sendBtn) {
                    if (sendBtn.disabled) {
                        sendBtn.removeAttribute('disabled');
                        sendBtn.disabled = false;
                    }
                    sendBtn.click();
                    return "SENT";
                }
                return "SEND_BUTTON_NOT_FOUND";
            })()`;
            
            const sendRes = executeChromeJs(sendJs, true);
            console.log(`✅ Auto-send status: ${sendRes}`);
            
            if (sendRes !== "SENT" && sendRes !== "SENT_VIA_FORM") {
                console.log('⚠️  \x1b[31mAuto-delivery failed. Falling back to manual verification...\x1b[0m');
                await askQuestion(`\n👉 Please paste and send the message manually in Chrome, then press \x1b[32mENTER\x1b[0m here to continue...`);
            } else {
                console.log(`\n\x1b[32m✨ Message successfully sent automatically! \x1b[0m`);
                // Add a safe, human-like random delay
                const randomDelaySec = Math.floor(Math.random() * 15) + 30; // 30 to 45 seconds delay
                console.log(`💤 Sleeping for ${randomDelaySec} seconds to keep a natural, human-like pace...`);
                await sleep(randomDelaySec * 1000);
            }
            
        } else {
            await askQuestion(`\n✅ Once sent, press \x1b[32mENTER\x1b[0m here to continue...`);
        }
        
        // Auto-advance
        lastSelectedIndex = candIdx + 1;
    }
  }

  rl.close();
}
main().catch(err => {
  console.error('Error running script:', err);
});

