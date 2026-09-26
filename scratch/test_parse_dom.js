const { execSync } = require('child_process');
const fs = require('fs');

const jsCode = `(function() {
  const results = [];
  
  // 1. Exact row element queries from stepJs
  let rowElements = Array.from(document.querySelectorAll('.divide-y > div > .group.flex, [data-tour=\"referral-row\"] > .group.flex, .divide-y > .group.flex'));
  let selectorUsed = 'primary';
  if (rowElements.length === 0) {
      rowElements = Array.from(document.querySelectorAll('.group.flex[class*=\"h-[44px]\"], .group.flex.cursor-pointer'));
      selectorUsed = 'fallback-1';
  }
  if (rowElements.length === 0) {
      rowElements = Array.from(document.querySelectorAll('.divide-y > div, [data-tour=\"referral-row\"]'));
      selectorUsed = 'fallback-2';
  }
  
  const seenNames = new Set();
  rowElements.forEach((rowEl, idx) => {
      const nameSpan = rowEl.querySelector('span.hidden.sm\\\\:inline') || rowEl.querySelector('span.sm\\\\:hidden');
      let name = nameSpan ? nameSpan.textContent.trim() : '';
      let method = 'span.hidden';
      if (!name) {
          const firstCol = rowEl.children[0];
          if (firstCol) {
              const span = firstCol.querySelector('span');
              name = span ? span.textContent.trim() : firstCol.textContent.trim();
              method = span ? 'firstCol span' : 'firstCol text';
          }
      }
      
      if (name) {
          name = name.replace(/\\s+/g, ' ').trim();
      }
      
      const isFilteredOut = !name || name === 'Referee' || name.includes('$') || name.includes('applications') || name.length > 50;
      
      results.push({
        index: idx,
        name,
        method,
        isFilteredOut,
        seenBefore: seenNames.has(name),
        htmlSnippet: rowEl.outerHTML.substring(0, 200)
      });
      
      if (name && !isFilteredOut) {
        seenNames.add(name);
      }
  });
  
  return JSON.stringify({
    selectorUsed,
    totalRowsFound: rowElements.length,
    uniqueNamesCount: seenNames.size,
    uniqueNames: Array.from(seenNames),
    details: results
  }, null, 2);
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

fs.writeFileSync('scratch/test_parse_dom.applescript', appleScript);
try {
  const result = execSync('osascript scratch/test_parse_dom.applescript', { encoding: 'utf8' });
  fs.writeFileSync('scratch/parse_dom_results.json', result);
  console.log('DOM parsing results saved.');
} catch (e) {
  console.error('Execution failed:', e.message);
}
