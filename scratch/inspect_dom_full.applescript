
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
        set resultHTML to execute t javascript "(function() {
  // Find all buttons on the page
  const buttons = Array.from(document.querySelectorAll('button')).map((b, idx) => ({
    index: idx,
    text: b.textContent.trim(),
    id: b.id,
    className: b.className,
    disabled: b.disabled || b.getAttribute('disabled') !== null,
    html: b.outerHTML.substring(0, 300)
  }));

  // Find any text elements matching numbers / pagination
  const allTextElements = Array.from(document.querySelectorAll('*'))
    .filter(el => el.children.length === 0 && el.textContent.trim().length > 0)
    .map(el => el.textContent.trim());

  return JSON.stringify({
    activeTab: document.querySelector('[data-test=\"connections-tab\"]') ? 'Connections' : 'Referrals',
    buttonsCount: buttons.length,
    buttons,
    textLength: allTextElements.length,
    texts: allTextElements.slice(0, 200)
  }, null, 2);
})()"
        return resultHTML
    else
        return "ERROR: Mercor page not found in Chrome tabs"
    end if
end tell
