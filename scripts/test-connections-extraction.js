const { execSync } = require('child_process');
const fs = require('fs');

const jsCode = `(function() {
  const rows = Array.from(document.querySelectorAll('.divide-y > div, [data-tour="referral-row"]'));
  const results = [];
  
  let currentCandidate = null;
  
  rows.forEach((row) => {
    // If it has a LinkedIn messaging link, it's a main connection row
    const linkedinAnchor = row.querySelector('a[href*="linkedin.com/messaging/thread/new"]');
    const nameSpan = row.querySelector('span.hidden.sm\\\\:inline') || row.querySelector('span.sm\\\\:hidden') || row.querySelector('span') || row.querySelector('p');
    
    if (linkedinAnchor) {
      // It's a new candidate row
      if (currentCandidate) {
        results.push(currentCandidate);
      }
      
      const name = nameSpan ? nameSpan.textContent.trim() : 'Unknown';
      const linkedinUrl = linkedinAnchor.href;
      
      // Find the Vouch/Vouched buttons
      const buttons = Array.from(row.querySelectorAll('button')).map(b => b.textContent.trim());
      const isVouched = buttons.includes('Vouched') || row.textContent.includes('Vouched');
      const isUnvouched = buttons.includes('Vouch') || row.textContent.includes('Vouch');
      
      currentCandidate = {
        name,
        linkedinUrl,
        isVouched,
        isUnvouched,
        roles: [],
        rawText: row.textContent.trim().substring(0, 150)
      };
    } else if (currentCandidate) {
      // It's a sub-row (role listing) for the current candidate
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

// Escaping double quotes for AppleScript
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
        return "ERROR: Mercor page not found in any tab"
    end if
end tell
`;

fs.writeFileSync('scripts/test-connections-extraction.applescript', appleScript);

try {
  const result = execSync('osascript scripts/test-connections-extraction.applescript', { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  console.log(`Successfully extracted ${parsed.count} candidates:`);
  console.log(JSON.stringify(parsed.candidates.slice(0, 10), null, 2));
} catch (e) {
  console.error('Error running extraction script:', e.message);
}
