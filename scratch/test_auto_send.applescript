
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
  // 1. Locate the contenteditable textbox in LinkedIn Chat
  let textbox = document.querySelector('div[contenteditable=\"true\"][role=\"textbox\"]');
  if (!textbox) {
      // Try to click message button if not open
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const msgBtn = buttons.find(el => {
          const txt = el.textContent.trim().toLowerCase();
          return txt === 'message' || (txt.includes('message') && el.classList.contains('artdeco-button'));
      });
      if (msgBtn) {
          msgBtn.click();
          return \"CLICKED_MESSAGE_BUTTON\";
      }
      return \"MESSAGE_BUTTON_NOT_FOUND\";
  }
  
  // 2. Set the message text content
  textbox.innerHTML = '';
  const messageText = `Hey Xiaowei,

I saw you got signed up on the Mercor platform—awesome first step!

The next move to actually get surfaced for roles is picking 2-4 listings and starting the work authorization/availability steps. It only takes about 4 minutes to get that part squared away.

I'm holding a quick virtual office hours session this Wednesday evening to help people select the highest-paying listings that fit their backgrounds and share my preparation guide. 

Would love to have you join if you want to speed-run the process. Let me know if you can make it and I'll send over the link!

Best,
James`;
  const lines = messageText.split('\\n');
  lines.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line;
      textbox.appendChild(p);
  });
  
  // Dispatch input event to trigger React state updates
  textbox.dispatchEvent(new Event('input', { bubbles: true }));
  
  // 3. Find and click the Send button
  // In LinkedIn, the submit button is inside the active form or has class msg-form__send-button
  const sendBtn = document.querySelector('button.msg-form__send-button') || document.querySelector('button[type=\"submit\"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Send');
  if (sendBtn) {
      const isDisabled = sendBtn.disabled || sendBtn.getAttribute('disabled') !== null;
      if (isDisabled) {
          return \"SEND_BUTTON_DISABLED\";
      }
      sendBtn.click();
      return \"SENT\";
  }
  
  return \"SEND_BUTTON_NOT_FOUND\";
})()"
        return resultHTML
    else
        return "ERROR: LinkedIn profile page not found in Chrome tabs"
    end if
end tell
