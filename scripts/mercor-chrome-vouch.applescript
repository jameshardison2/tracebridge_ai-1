set jsCode to "(async function() {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const rows = document.querySelectorAll('tbody tr');
    let vouchedCount = 0;

    for (let row of rows) {
        const vouchBtn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'vouch');
        
        if (!vouchBtn || vouchBtn.disabled) {
            continue;
        }

        vouchBtn.click();
        await delay(1500);
        
        const socialOption = Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Found via social platform');
        if (socialOption) {
            socialOption.click();
            await delay(500);
            const input = document.querySelector('input[type=\"text\"]');
            if (input) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(input, 'LinkedIn');
                input.dispatchEvent(new Event('input', { bubbles: true}));
            }
        }
        
        await delay(500);
        
        const skillsOption = Array.from(document.querySelectorAll('*')).find(el => el.textContent === 'Relevant skills');
        if (skillsOption) skillsOption.click();
        
        await delay(500);
        
        const textarea = document.querySelector('textarea');
        if (textarea) {
            const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            const text = 'I am formally referring this candidate. Based on their LinkedIn profile, technical background, and experience, they appear to be a highly qualified match for the roles you are actively filling. They have strong technical skills that would be an asset to any fast-paced engineering or product team.';
            nativeTextareaValueSetter.call(textarea, text);
            textarea.dispatchEvent(new Event('input', { bubbles: true}));
        }
        
        await delay(500);
        
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Submit');
        if (submitBtn) {
            submitBtn.click();
        }
        
        vouchedCount++;
        await delay(2000); 
    }
    
    alert(`Finished vouching for ${vouchedCount} candidates! Move to the next page and run again.`);
})();"

tell application "Google Chrome"
    execute active tab of front window javascript jsCode
end tell
