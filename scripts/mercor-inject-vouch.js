const args = process.argv.slice(2);
const candidateName = args[0];
const vouchText = args[1];

const jsCode = `(async function() {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const btn = Array.from(document.querySelectorAll('button')).find(b => {
        const text = b.textContent.toLowerCase();
        return text.includes('vouch') && !text.includes('vouched') && !text.includes('submit') && !b.disabled;
    });
    if(!btn) return "No buttons";
    
    // Check if this button belongs to the candidate
    // Actually we don't need to check, we just assume the first button is for the candidate we researched
    btn.click();
    await delay(1500);
    
    const step1Option = Array.from(document.querySelectorAll('span')).find(el => el.textContent.trim() === 'Know socially');
    if (step1Option) step1Option.closest('div[role="button"]').click();
    await delay(1000);
    
    const nextBtn1 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Next' && !b.disabled);
    if (nextBtn1) nextBtn1.click();
    await delay(1500);
    
    const step2Option = Array.from(document.querySelectorAll('span')).find(el => el.textContent.trim() === 'Relevant skills');
    if (step2Option) step2Option.closest('div[role="button"]').click();
    await delay(1000);
    
    const nextBtn2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Next' && !b.disabled);
    if (nextBtn2) nextBtn2.click();
    await delay(1500);
    
    const textarea = document.querySelector('textarea');
    if (textarea) {
        const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeTextareaValueSetter.call(textarea, ${JSON.stringify(vouchText)});
        textarea.dispatchEvent(new Event('input', { bubbles: true}));
    }
    await delay(1000);
    
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Submit Vouch' && !b.disabled);
    if (submitBtn) submitBtn.click();
    
    await delay(2500);
    return "Success";
})();`;

const escapedJs = jsCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const osa = `osascript -e 'tell application "Google Chrome" to execute active tab of front window javascript "${escapedJs}"'`;

require('child_process').execSync(osa, {stdio: 'inherit'});
