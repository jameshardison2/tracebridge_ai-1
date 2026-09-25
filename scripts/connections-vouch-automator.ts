import puppeteer from 'puppeteer-core';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function safeEvaluate(page: any, fn: any, ...args: any[]) {
  try {
    return await page.evaluate(fn, ...args);
  } catch (err: any) {
    const msg = err.message || '';
    if (msg.includes('detached Frame') || msg.includes('Execution context') || msg.includes('context was destroyed') || msg.includes('navigated')) {
      console.log('Detached frame or destroyed execution context detected. Retrying page.evaluate after delay...');
      await sleep(2000);
      try {
        return await page.evaluate(fn, ...args);
      } catch (retryErr: any) {
        console.log(`Second evaluate attempt failed: ${retryErr.message}. Retrying one more time...`);
        await sleep(3000);
        return await page.evaluate(fn, ...args);
      }
    }
    throw err;
  }
}

async function getModalStep(page: any): Promise<number> {
  return await safeEvaluate(page, () => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
    if (dialogs.length === 0) return 0;
    const dialog = dialogs[dialogs.length - 1];
    const textContent = dialog.textContent || '';
    if (textContent.includes('Step 1 of 3')) return 1;
    if (textContent.includes('Step 2 of 3')) return 2;
    if (textContent.includes('Step 3 of 3')) return 3;
    return 0;
  });
}

async function ensureOptionSelected(page: any, text: string): Promise<boolean> {
  return await safeEvaluate(page, (txt: string) => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
    if (dialogs.length === 0) return false;
    const dialog = dialogs[dialogs.length - 1];
    
    const elements = Array.from(dialog.querySelectorAll('span, div, p, label, button'));
    const target = elements.find(el => el.textContent?.trim().toLowerCase().includes(txt.toLowerCase()));
    if (target) {
      const clickable = target.closest('[role="button"]') || target.closest('label') || target;
      const checkbox = clickable.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const isSelected = checkbox ? checkbox.checked : false;
      
      if (isSelected) {
        console.log(`Option "${txt}" is already selected.`);
        return true;
      }
      
      if (checkbox) {
        checkbox.click();
      } else if (typeof (clickable as any).click === 'function') {
        (clickable as any).click();
      } else {
        const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        clickable.dispatchEvent(event);
      }
      return true;
    }
    return false;
  }, text);
}

async function clickModalButton(page: any, text: string): Promise<boolean> {
  return await safeEvaluate(page, (btnText: string) => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
    if (dialogs.length === 0) return false;
    const dialog = dialogs[dialogs.length - 1];
    
    const buttons = Array.from(dialog.querySelectorAll('button'));
    const found = buttons.find(b => {
      const bText = b.textContent?.trim().toLowerCase() || '';
      return bText === btnText.toLowerCase() || bText.includes(btnText.toLowerCase());
    }) as HTMLButtonElement;
    
    if (found) {
      if (found.disabled || found.getAttribute('disabled') !== null) {
        console.log(`Button "${btnText}" is disabled. Not clicking.`);
        return false;
      }
      if (typeof found.click === 'function') {
        found.click();
      } else {
        const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        found.dispatchEvent(event);
      }
      return true;
    }
    return false;
  }, text);
}

async function getCurrentRange(page: any): Promise<string> {
  return await safeEvaluate(page, () => {
    const elements = Array.from(document.querySelectorAll('div, span, p'));
    const matches = elements
      .map(el => el.textContent?.trim() || '')
      .filter(t => t.match(/^\d+-\d+\s+of\s+[\d,]+/));
    return matches[0] || '';
  });
}

async function clickPreviousPageButton(page: any): Promise<boolean> {
  return await safeEvaluate(page, () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const prevBtn = buttons.find(btn => {
      const text = btn.textContent?.trim() || '';
      if (text !== 'Previous') return false;
      const className = btn.className || '';
      const isIndigo = className.includes('indigo') || className.includes('bg-indigo');
      return !isIndigo;
    }) as HTMLButtonElement;
    
    if (prevBtn) {
      const isDisabled = prevBtn.disabled || prevBtn.getAttribute('disabled') !== null || prevBtn.classList.contains('disabled');
      if (isDisabled) return false;
      
      if (typeof prevBtn.click === 'function') {
        prevBtn.click();
      } else {
        const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        prevBtn.dispatchEvent(event);
      }
      return true;
    }
    return false;
  });
}

async function clickNextPageButton(page: any): Promise<boolean> {
  return await safeEvaluate(page, () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const nextBtn = buttons.find(btn => {
      const text = btn.textContent?.trim() || '';
      if (text !== 'Next') return false;
      const className = btn.className || '';
      const isIndigo = className.includes('indigo') || className.includes('bg-indigo');
      return !isIndigo;
    }) as HTMLButtonElement;
    
    if (nextBtn) {
      const isDisabled = nextBtn.disabled || nextBtn.getAttribute('disabled') !== null || nextBtn.classList.contains('disabled');
      if (isDisabled) return false;
      
      if (typeof nextBtn.click === 'function') {
        nextBtn.click();
      } else {
        const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        nextBtn.dispatchEvent(event);
      }
      return true;
    }
    return false;
  });
}

async function closeModalIfOpen(page: any) {
  let modalExists = await safeEvaluate(page, () => {
    return !!(document.querySelector('[role="dialog"]') || document.querySelector('.fixed'));
  });
  
  if (!modalExists) return;
  
  console.log('An open modal was detected. Closing it...');
  
  for (let i = 0; i < 3; i++) {
    await safeEvaluate(page, () => {
      const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
      if (dialogs.length === 0) return;
      const dialog = dialogs[dialogs.length - 1];
      
      const buttons = Array.from(dialog.querySelectorAll('button'));
      const xButton = buttons.find(b => {
        const svg = b.querySelector('svg');
        if (svg) {
          const paths = Array.from(svg.querySelectorAll('path'));
          return paths.some(p => {
            const d = p.getAttribute('d') || '';
            return d.includes('M6 18') || d.includes('M6 6');
          });
        }
        return false;
      });
      
      if (xButton) {
        (xButton as any).click();
      } else {
        const closeBtn = buttons.find(b => {
          const text = b.textContent?.trim().toLowerCase();
          return text === 'close' || text === 'done' || text === 'cancel';
        });
        if (closeBtn) {
          (closeBtn as any).click();
        }
      }
    });
    
    await page.keyboard.press('Escape');
    await sleep(1500);
    
    modalExists = await safeEvaluate(page, () => {
      return !!(document.querySelector('[role="dialog"]') || document.querySelector('.fixed'));
    });
    
    if (!modalExists) {
      console.log('Modal closed successfully.');
      break;
    }
  }
  
  await sleep(1000);
}

async function goToFirstPage(page: any) {
  console.log('Navigating back to Page 1 (All Listings)...');
  let clicks = 0;
  let lastRange = '';
  
  while (true) {
    await closeModalIfOpen(page);
    
    const currentRange = await getCurrentRange(page);
    console.log(`Current pagination range: ${currentRange || 'Unknown'}`);
    
    if (currentRange.startsWith('1-')) {
      console.log('Reached Page 1 successfully (range starts with 1-)!');
      break;
    }
    
    if (lastRange && currentRange === lastRange) {
      console.log('Range did not change after clicking Previous. Assuming we are on Page 1.');
      break;
    }
    lastRange = currentRange;

    const clicked = await clickPreviousPageButton(page);
    if (!clicked) {
      console.log('No active "Previous" page button found or it is disabled. Reached Page 1.');
      break;
    }
    
    clicks++;
    await sleep(3500); // Wait for pagination transition

    if (clicks > 60) {
      console.log('Safety limit hit: Clicked "Previous" 60 times. Stopping.');
      break;
    }
  }
}

async function findUnvouchedCandidate(page: any, alreadyVouched: Set<string>): Promise<{ name: string; found: boolean }> {
  const vouchedArray = Array.from(alreadyVouched);
  return await safeEvaluate(page, (vouched: string[]) => {
    // Look at connection rows (.divide-y > div is the correct format)
    const rows = Array.from(document.querySelectorAll('.divide-y > div, [data-tour="referral-row"]'));
    
    for (const row of rows) {
      const nameSpan = row.querySelector('span.hidden.sm\\:inline') || row.querySelector('span.sm\\:hidden');
      const name = nameSpan?.textContent?.trim() || '';
      
      if (name && !vouched.includes(name)) {
        // Check if there is an active Vouch button inside this row
        const buttons = Array.from(row.querySelectorAll('button'));
        const hasVouchBtn = buttons.some(b => b.textContent?.trim() === 'Vouch');
        
        if (hasVouchBtn) {
          return { name, found: true };
        }
      }
    }
    return { name: '', found: false };
  }, vouchedArray);
}

async function clickVouchForCandidate(page: any, targetName: string): Promise<boolean> {
  return await safeEvaluate(page, (name: string) => {
    const rows = Array.from(document.querySelectorAll('.divide-y > div, [data-tour="referral-row"]'));
    
    for (const row of rows) {
      const nameSpan = row.querySelector('span.hidden.sm\\:inline') || row.querySelector('span.sm\\:hidden');
      const candidateName = nameSpan?.textContent?.trim() || '';
      
      if (candidateName === name) {
        const buttons = Array.from(row.querySelectorAll('button'));
        const vouchBtn = buttons.find(b => b.textContent?.trim() === 'Vouch') as HTMLButtonElement;
        
        if (vouchBtn) {
          row.scrollIntoView({ block: 'center' });
          if (typeof vouchBtn.click === 'function') {
            vouchBtn.click();
          } else {
            const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            vouchBtn.dispatchEvent(event);
          }
          return true;
        }
      }
    }
    return false;
  }, targetName);
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
  let page = pages.find(p => p.url().includes('mercor.com'));
  
  if (!page) {
    console.log('No page with mercor.com found. Using first open page...');
    page = pages[0];
    if (!page) {
      page = await browser.newPage();
    }
  }

  console.log(`\nConnected successfully to: "${await page.title()}"`);
  console.log(`Current URL: ${page.url()}`);
  
  page.on('console', msg => {
    console.log(`[Browser] ${msg.text()}`);
  });
  
  // Click Connections tab
  console.log('Switching to Connections tab...');
  const tabClicked = await page.evaluate(() => {
    const btn = document.querySelector('[data-test="connections-tab"]') as HTMLElement;
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log(`Clicked Connections tab: ${tabClicked}`);
  await sleep(3000);

  console.log('\n=============================================');
  console.log('Starting automated connections vouching script...');
  console.log('=============================================\n');

  // Config: whether to resume from current page or go back to page 1
  const resumeFromCurrentPage = true;

  if (!resumeFromCurrentPage) {
    await goToFirstPage(page);
  } else {
    console.log('Resuming from the current page setup in browser.');
  }

  const range = await getCurrentRange(page);
  console.log(`Starting pagination range: ${range}`);
  
  let pageNum = 1;
  const match = range.match(/^(\d+)-\d+\s+of\s+[\d,]+/);
  if (match) {
    const startIdx = parseInt(match[1]);
    pageNum = Math.ceil(startIdx / 50);
  }
  console.log(`Inferred current Page: ${pageNum}`);

  console.log('\nStarting Vouch automation across pages...');

  const vouchScript = "I am formally vouching for this candidate. I connected with them through my professional network and reviewed their background. They possess a strong technical foundation and the drive needed for fast-paced projects. I highly recommend their profile be fast-tracked for an initial interview.";

  let processed = 0;
  const vouchedNames = new Set<string>();

  while (true) {
    const currentRangeText = await getCurrentRange(page);
    console.log(`\n--- Processing Page ${pageNum} (Range: ${currentRangeText}) ---`);
    let pageDone = false;

    while (!pageDone) {
      await sleep(1500);

      // Scroll a bit to lazy load
      await safeEvaluate(page, () => window.scrollBy(0, 150));
      await sleep(500);

      // Find the first unvouched candidate
      const candidateInfo = await findUnvouchedCandidate(page, vouchedNames);
      if (!candidateInfo.found || !candidateInfo.name) {
        console.log(`Finished processing all visible Vouch buttons on Page ${pageNum}.`);
        pageDone = true;
        break;
      }

      const targetName = candidateInfo.name;
      console.log(`Processing candidate: "${targetName}"...`);

      // Ensure modal is closed
      await closeModalIfOpen(page);

      // Click vouch button
      const clicked = await clickVouchForCandidate(page, targetName);
      if (!clicked) {
        console.log(`Could not click Vouch button for "${targetName}". Skipping...`);
        vouchedNames.add(targetName);
        continue;
      }

      // ---- Step 1: How do you know them? ----
      await sleep(2000);
      let currentStep = await getModalStep(page);
      if (currentStep !== 1) {
        console.log(`Expected Step 1, but got Step ${currentStep} or modal didn't open. Skipping...`);
        await page.keyboard.press('Escape');
        vouchedNames.add(targetName);
        await sleep(1500);
        continue;
      }

      const socialClicked = await ensureOptionSelected(page, 'Found via social platform');
      if (!socialClicked) {
        console.log(`"Found via social platform" not found for "${targetName}". Skipping...`);
        await page.keyboard.press('Escape');
        vouchedNames.add(targetName);
        await sleep(1500);
        continue;
      }
      await sleep(1500); // Wait for input to render

      // Fill platform name using native React setter in active modal
      await safeEvaluate(page, () => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
        if (dialogs.length === 0) return;
        const dialog = dialogs[dialogs.length - 1];
        const el = dialog.querySelector('input[placeholder*="Platform" i], input[placeholder*="platform" i]') as HTMLInputElement;
        if (el) {
          const prototype = Object.getPrototypeOf(el);
          const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (valueSetter) {
            valueSetter.call(el, 'LinkedIn');
          } else {
            el.value = 'LinkedIn';
          }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await sleep(800);

      // Click Next
      const nextClicked = await clickModalButton(page, 'Next');
      if (nextClicked) {
        await sleep(1500);
      } else {
        console.log(`Could not click Next button in Step 1 for "${targetName}". Skipping...`);
        await page.keyboard.press('Escape');
        vouchedNames.add(targetName);
        await sleep(1500);
        continue;
      }

      // Verify Step 2
      currentStep = await getModalStep(page);
      if (currentStep !== 2) {
        console.log(`Modal did not advance to Step 2 (currently at Step ${currentStep}). Skipping...`);
        await page.keyboard.press('Escape');
        vouchedNames.add(targetName);
        await sleep(1500);
        continue;
      }

      // ---- Step 2: Why recommend? ----
      const skillsClicked = await ensureOptionSelected(page, 'Relevant skills');
      if (!skillsClicked) {
        // Fallback: click first checkbox/label
        await safeEvaluate(page, () => {
          const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
          if (dialogs.length === 0) return;
          const dialog = dialogs[dialogs.length - 1];
          const firstOption = dialog.querySelector('[role="checkbox"], label') as HTMLElement;
          if (firstOption) {
            firstOption.click();
          }
        });
      }
      await sleep(800);

      // Click Next
      const nextClicked2 = await clickModalButton(page, 'Next');
      if (nextClicked2) {
        await sleep(1500);
      } else {
        console.log(`Could not click Next button in Step 2 for "${targetName}". Skipping...`);
        await page.keyboard.press('Escape');
        vouchedNames.add(targetName);
        await sleep(1500);
        continue;
      }

      // Verify Step 3
      currentStep = await getModalStep(page);
      if (currentStep !== 3) {
        console.log(`Modal did not advance to Step 3 (currently at Step ${currentStep}). Skipping...`);
        await page.keyboard.press('Escape');
        vouchedNames.add(targetName);
        await sleep(1500);
        continue;
      }

      // ---- Step 3: Tell us more ----
      await safeEvaluate(page, (text) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
        if (dialogs.length === 0) return;
        const dialog = dialogs[dialogs.length - 1];
        
        const textareas = Array.from(dialog.querySelectorAll('textarea')) as HTMLTextAreaElement[];
        textareas.forEach((ta) => {
          const prototype = Object.getPrototypeOf(ta);
          const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (valueSetter) {
            valueSetter.call(ta, text);
          } else {
            ta.value = text;
          }
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          ta.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }, vouchScript);
      await sleep(1200);

      // Click Submit Vouch
      const submitClicked = await clickModalButton(page, 'Submit Vouch') || await clickModalButton(page, 'Submit');
      if (submitClicked) {
        await sleep(3500);
      } else {
        console.log(`Could not click Submit button for "${targetName}". Skipping...`);
        await page.keyboard.press('Escape');
        vouchedNames.add(targetName);
        await sleep(1500);
        continue;
      }

      processed++;
      vouchedNames.add(targetName);
      console.log(`✅ Vouched for candidate #${processed}: "${targetName}" (Page ${pageNum})!`);

      // Close confirmation modal
      const doneClicked = await clickModalButton(page, 'Done');
      if (!doneClicked) {
        const closeClicked = await clickModalButton(page, 'Close');
        if (!closeClicked) {
          await page.keyboard.press('Escape');
        }
      }
      await sleep(2000);
    }

    // Move to next page
    console.log(`Finished Page ${pageNum}. Finding "Next" page button...`);
    const pageNextClicked = await clickNextPageButton(page);
    if (!pageNextClicked) {
      console.log('No active "Next" page button found or it is disabled. Reached the last page! All done!');
      break;
    }

    pageNum++;
    console.log(`Navigating to Page ${pageNum}...`);
    await sleep(6000); // Give plenty of time to load the next page completely
  }

  console.log(`\n🎉 Done! Vouched for ${processed} candidates total across all pages.`);
  await browser.disconnect();
})();
