set jsCode to "(async function() {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    let vouchedCount = 0;
    try {
        console.log('Script started');
        
        // Helper to wait for a VISIBLE element
        const waitForElement = async (selectorFn, timeout = 5000) => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                const el = selectorFn();
                if (el && el.offsetParent !== null) return el;
                await delay(100);
            }
            return null;
        };

        let count = 0;
        while (true) {
            const vouchBtn = Array.from(document.querySelectorAll('button')).find(b => {
                const text = b.textContent.toLowerCase();
                return text.includes('vouch') && !text.includes('vouched') && !text.includes('submit') && !b.disabled;
            });
            console.log('Found vouchBtn?', !!vouchBtn);
            if (!vouchBtn) break;
            
            vouchBtn.click();
            console.log('Clicked vouch');
            
            // Wait for modal Step 1 Option
            const step1Option = await waitForElement(() => Array.from(document.querySelectorAll('span')).find(el => el.textContent.trim() === 'Know socially'));
            console.log('Found step1 option?', !!step1Option);
            if (!step1Option) {
                alert('Failed to open modal for Step 1. The script will stop here so you can check what went wrong.');
                break;
            }
            const step1Input = step1Option.closest('div[role=\"button\"]').querySelector('input');
            if (step1Input) step1Input.click();
            else step1Option.closest('div[role=\"button\"]').click();
            await delay(500);
            
            const nextBtn1 = await waitForElement(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Next' && !b.disabled));
            if (nextBtn1) nextBtn1.click();
            
            // Wait for Step 2 Option
            const step2Option = await waitForElement(() => Array.from(document.querySelectorAll('span')).find(el => el.textContent.trim() === 'Relevant skills'));
            if (step2Option) {
                const step2Input = step2Option.closest('div[role=\"button\"]').querySelector('input');
                if (step2Input) step2Input.click();
                else step2Option.closest('div[role=\"button\"]').click();
            }
            await delay(500);
            
            const nextBtn2 = await waitForElement(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Next' && !b.disabled));
            if (nextBtn2) nextBtn2.click();
            
            // Wait for Step 3 Textarea
            const textarea = await waitForElement(() => document.querySelector('textarea'));
            const nameEl = document.querySelector('p.text-sm.text-gray-600 span.font-medium');
            const candidateName = nameEl ? nameEl.textContent.trim() : 'this candidate';
            
            if (textarea) {
                const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                const text = `I am formally vouching for ${candidateName}'s technical and professional caliber. Based on their background and execution skills, ${candidateName} demonstrates the exact traits highly-funded startups are looking for: extreme agency, a bias for action, and the ability to ship clean, scalable work quickly. ${candidateName} doesn't just complete tasks; they understand product vision and execution. I highly recommend ${candidateName} as a massive force multiplier for any lean, fast-paced team.`;
                nativeTextareaValueSetter.call(textarea, text);
                textarea.dispatchEvent(new Event('input', { bubbles: true}));
            }
            await delay(500);
            
            const submitBtn = await waitForElement(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Submit Vouch' && !b.disabled));
            if (submitBtn) submitBtn.click();
            
            vouchedCount++;
            console.log('Vouched count:', vouchedCount);
            
            // Wait for the modal to close and the button to change to Vouched
            await delay(2500);
        }
        
        alert(`Finished vouching for ${vouchedCount} candidates! Move to the next page and say ready!`);
    } catch (e) {
        alert('Script error: ' + e.message);
    }
})();"

tell application "Google Chrome"
    execute active tab of front window javascript jsCode
end tell
