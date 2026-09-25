const { execSync } = require('child_process');
const fs = require('fs');

const jsCode = `(function() {
  const allElements = Array.from(document.querySelectorAll('div, span, p, button, td, th'));
  const results = [];
  
  allElements.forEach(el => {
    if (el.children.length === 0) {
      const text = el.textContent.trim();
      if (text.match(/\\d+/) || text.includes('of') || text.includes('Showing') || text.includes('Page')) {
        results.push({
          tag: el.tagName,
          text: text,
          parentClass: el.parentElement ? el.parentElement.className : ''
        });
      }
    }
  });
  
  return JSON.stringify(results.slice(0, 100), null, 2);
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

fs.writeFileSync('scratch/inspect_pagination.applescript', appleScript);
try {
  const result = execSync('osascript scratch/inspect_pagination.applescript', { encoding: 'utf8' });
  console.log('Pagination Inspection Result:');
  console.log(result);
} catch (e) {
  console.error('Execution failed:', e.message);
}
