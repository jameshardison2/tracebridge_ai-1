import puppeteer from 'puppeteer-core';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function safeEvaluate(page: any, fn: any, ...args: any[]) {
  try {
    return await page.evaluate(fn, ...args);
  } catch (err: any) {
    console.log('Evaluate error, retrying...');
    await sleep(2000);
    return await page.evaluate(fn, ...args);
  }
}

(async () => {
  console.log('Connecting to Chrome on http://127.0.0.1:9222...');
  
  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });
  } catch (err: any) {
    console.error('\n❌ Could not connect to Chrome on port 9222.', err.message);
    process.exit(1);
  }

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('mercor.com')) || pages[0];

  console.log(`\nConnected successfully to: "${await page.title()}"`);
  
  // Try to click Bulk Reminder
  console.log('Looking for "Bulk Reminder" button...');
  const clickedBulk = await safeEvaluate(page, () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const bulkBtn = buttons.find(b => b.textContent?.trim().includes('Bulk Reminder'));
    
    if (bulkBtn) {
      if (typeof bulkBtn.click === 'function') {
        bulkBtn.click();
      } else {
        bulkBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      }
      return true;
    }
    return false;
  });

  if (clickedBulk) {
    console.log('✅ Clicked "Bulk Reminder"!');
    await sleep(2000);
    
    // Check if a modal opened to confirm
    const confirmed = await safeEvaluate(page, () => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
      if (dialogs.length === 0) return false;
      const dialog = dialogs[dialogs.length - 1];
      const buttons = Array.from(dialog.querySelectorAll('button'));
      const confirmBtn = buttons.find(b => b.textContent?.trim().toLowerCase().includes('confirm') || b.textContent?.trim().toLowerCase().includes('send'));
      if (confirmBtn) {
        (confirmBtn as HTMLButtonElement).click();
        return true;
      }
      return false;
    });
    
    if (confirmed) console.log('✅ Confirmed bulk reminder dialog.');
  } else {
    console.log('No "Bulk Reminder" button found. Checking for individual bell icons...');
  }

  // Now let's try clicking individual bells that are NOT greyed out
  console.log('Scanning for individual reminder bells...');
  const bellsClicked = await safeEvaluate(page, () => {
    let count = 0;
    const buttons = Array.from(document.querySelectorAll('button'));
    
    for (const btn of buttons) {
      // Look for a bell svg path
      const svg = btn.querySelector('svg');
      if (svg) {
        const path = svg.querySelector('path');
        const d = path?.getAttribute('d') || '';
        // Only click if it doesn't look like a slashed bell (slashed bells have a diagonal line path)
        if (d.includes('a1.5 1.5') && !d.includes('M3 3l18 18')) { 
          // Attempting to filter out slashed bells based on SVG path heuristics
          if (!btn.disabled && btn.getAttribute('disabled') === null) {
            btn.click();
            count++;
          }
        }
      }
    }
    return count;
  });

  console.log(`✅ Clicked ${bellsClicked} individual reminder bells.`);
  console.log('\n🎉 Reminder automation complete!');
  
  await browser.disconnect();
})();
