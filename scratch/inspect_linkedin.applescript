
tell application "Google Chrome"
    set foundTab to false
    set foundWin to missing value
    set foundTabIdx to -1
    
    repeat with win in windows
        set tabIdx to 1
        repeat with t in tabs of win
            if URL of t contains "linkedin.com/in/" then
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
  const textboxes = Array.from(document.querySelectorAll('[contenteditable], [role=\"textbox\"], textarea, input')).map((el, idx) => ({
    index: idx,
    tagName: el.tagName,
    className: el.className,
    role: el.getAttribute('role'),
    contentEditable: el.getAttribute('contenteditable'),
    id: el.id,
    placeholder: el.getAttribute('placeholder'),
    htmlSnippet: el.outerHTML.substring(0, 200)
  }));

  const messageButtons = Array.from(document.querySelectorAll('button, a'))
    .filter(el => el.textContent.trim().toLowerCase().includes('message'))
    .map(el => ({
      tagName: el.tagName,
      text: el.textContent.trim(),
      className: el.className,
      htmlSnippet: el.outerHTML.substring(0, 200)
    }));

  return JSON.stringify({
    url: window.location.href,
    title: document.title,
    textboxesCount: textboxes.length,
    textboxes,
    messageButtonsCount: messageButtons.length,
    messageButtons
  }, null, 2);
})()"
        return resultHTML
    else
        return "ERROR: LinkedIn profile tab not found"
    end if
end tell
