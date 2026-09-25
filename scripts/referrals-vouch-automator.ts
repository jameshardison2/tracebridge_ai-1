import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function decodeEntities(str: string): string {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/');
}

// Autonomous search scraping using DuckDuckGo
async function searchCandidateProfile(name: string): Promise<string> {
  const query = `${name} professional OR ${name} LinkedIn`;
  console.log(`[Search] Looking up background for "${name}"...`);
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`[Search] Warn: duckduckgo query returned status ${response.status}`);
      return '';
    }

    const html = await response.text();
    const snippets: string[] = [];
    const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = snippetRegex.exec(html)) !== null) {
      const cleanSnippet = decodeEntities(match[1].replace(/<[^>]*>/g, '').trim());
      snippets.push(cleanSnippet);
    }
    
    const context = snippets.slice(0, 5).join('\n');
    console.log(`[Search] Found context: ${context.substring(0, 200).replace(/\n/g, ' ')}...`);
    return context;
  } catch (error: any) {
    console.log(`[Search] Error looking up candidate: ${error.message}`);
    return '';
  }
}

// Generate highly detailed vouch paragraphs using Gemini
async function generateVouchParagraphs(name: string, searchSnippet: string): Promise<{ skills: string; education: string }> {
  const fallback = {
    skills: `I highly recommend ${name} for their exceptional professional capabilities. They have a proven track record of technical competence, meticulous attention to detail, and a structured approach to solving complex problems. Their collaborative mindset and technical drive make them an outstanding asset for high-impact teams.`,
    education: `${name} possesses a robust educational background that underscores their strong intellectual foundations. Their academic achievements, combined with a quick learning ability, demonstrate their capacity to master new domains rapidly and consistently apply best practices in their work.`
  };

  if (!GEMINI_API_KEY) {
    console.log('[Gemini] Warn: GEMINI_API_KEY is not defined. Using fallback template.');
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const prompt = `
You are a professional hiring manager and career sponsor vouching for a candidate named "${name}" on Mercor, a premium talent network.
You need to write two highly detailed, professional paragraphs recommending them.

Here is the professional background information found about "${name}":
"""
${searchSnippet}
"""

Please synthesize this background into two professional paragraphs:
1. "skills": A paragraph (at least 30-50 words) highlighting their professional/technical skills, projects, and work experience. Focus on their capabilities, attention to detail, and professional competence. Make it sound authentic and high-caliber.
2. "education": A paragraph (at least 30-50 words) highlighting their academic background, university, degrees, certifications, or bootcamp training. Highlight their learning agility and intellectual drive.

CRITICAL INSTRUCTIONS:
- Do NOT use any placeholders like "[Name]", "the candidate", or similar. Use their actual name "${name}" (or just first name if natural) and appropriate pronouns.
- Make the writing sound extremely natural, authentic, and written by a human colleague who knows them well. Avoid overly flowery, robotic, or typical AI-sounding sentences.
- If the background information does not contain clear professional details, write a highly realistic and professional fallback description for their skills and educational background based on a typical high-caliber candidate in software engineering or professional roles, adapting it to their name so it feels highly personalized.

Return your response in strict JSON format:
{
  "skills": "...",
  "education": "..."
}
`;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = response.response.text();
    const parsed = JSON.parse(text);
    if (parsed.skills && parsed.education) {
      return parsed;
    }
    throw new Error('JSON missing fields');
  } catch (error: any) {
    console.log(`[Gemini] Synthesis failed (${error.message}). Using custom personalized fallbacks...`);
    return fallback;
  }
}

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
    // Look at referral rows (first row has data-tour, subsequent ones are sibling divs)
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

  // Navigate to referrals tab
  console.log('Navigating to referrals tab...');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-test="referrals-tab"]') as HTMLElement;
    if (btn) btn.click();
  });
  await sleep(3000);

  console.log('\n=============================================');
  console.log('Starting automated referrals vouching script...');
  console.log('=============================================\n');

  // Go to Page 1 first
  await goToFirstPage(page);

  console.log('\nStarting Vouch automation across all pages...');

  let processed = 0;
  let pageNum = 1;
  const vouchedNames = new Set<string>();

  while (true) {
    console.log(`\n--- Processing Page ${pageNum} ---`);
    let pageDone = false;

    while (!pageDone) {
      await sleep(1500);

      // Scroll a bit to lazy load rows
      await safeEvaluate(page, () => window.scrollBy(0, 100));
      await sleep(500);

      // Find the first unvouched candidate
      const candidateInfo = await findUnvouchedCandidate(page, vouchedNames);
      if (!candidateInfo.found || !candidateInfo.name) {
        console.log(`Finished processing all visible Vouch buttons on Page ${pageNum}.`);
        pageDone = true;
        break;
      }

      const targetName = candidateInfo.name;
      console.log(`\n👉 Processing candidate: "${targetName}"...`);

      // 1. Autonomous search & Gemini text generation in parallel
      const searchContext = await searchCandidateProfile(targetName);
      const generatedTexts = await generateVouchParagraphs(targetName, searchContext);
      
      console.log(`[Gemini] Generated recommendation texts:`);
      console.log(`  Skills (Length: ${generatedTexts.skills.length}): ${generatedTexts.skills.substring(0, 100)}...`);
      console.log(`  Education (Length: ${generatedTexts.education.length}): ${generatedTexts.education.substring(0, 100)}...`);

      // Ensure modal is closed before clicking
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
        console.log(`"Found via social platform" option not found for "${targetName}". Skipping...`);
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
      // Select both "Relevant skills" and "Educational background" to demonstrate maximum detail
      const skillsSelected = await ensureOptionSelected(page, 'Relevant skills');
      const eduSelected = await ensureOptionSelected(page, 'Educational background') || await ensureOptionSelected(page, 'education');
      
      if (!skillsSelected && !eduSelected) {
        // Fallback: check first option
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
      await safeEvaluate(page, (skillsText: string, eduText: string) => {
        const dialogs = Array.from(document.querySelectorAll('[role="dialog"], .fixed'));
        if (dialogs.length === 0) return;
        const dialog = dialogs[dialogs.length - 1];
        
        const textareas = Array.from(dialog.querySelectorAll('textarea')) as HTMLTextAreaElement[];
        
        if (textareas.length === 1) {
          // Generic single textarea
          const combined = skillsText + "\n\n" + eduText;
          const ta = textareas[0];
          const prototype = Object.getPrototypeOf(ta);
          const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (valueSetter) {
            valueSetter.call(ta, combined);
          } else {
            ta.value = combined;
          }
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          ta.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          // Multiple textareas (Skills, Education, etc.)
          textareas.forEach((ta) => {
            // Traverse up to find contextual labels/titles
            let contextText = '';
            let parent = ta.parentElement;
            let depth = 0;
            while (parent && depth < 5) {
              const label = parent.querySelector('label') || parent.querySelector('span') || parent.querySelector('h3') || parent.previousElementSibling;
              if (label && label !== ta) {
                contextText = label.textContent?.trim().toLowerCase() || '';
                break;
              }
              parent = parent.parentElement;
              depth++;
            }
            
            const placeholderText = ta.placeholder.toLowerCase();
            const isEdu = contextText.includes('education') || contextText.includes('academic') || placeholderText.includes('education') || placeholderText.includes('academic');
            
            const fillText = isEdu ? eduText : skillsText;
            
            const prototype = Object.getPrototypeOf(ta);
            const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
            if (valueSetter) {
              valueSetter.call(ta, fillText);
            } else {
              ta.value = fillText;
            }
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            ta.dispatchEvent(new Event('change', { bubbles: true }));
          });
        }
      }, generatedTexts.skills, generatedTexts.education);
      await sleep(1200);

      // Click Submit Vouch
      const submitClicked = await clickModalButton(page, 'Submit Vouch') || await clickModalButton(page, 'Submit');
      if (submitClicked) {
        await sleep(4000); // Allow time to process the API request
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
      await sleep(2500);
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
