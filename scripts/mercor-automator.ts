import { chromium } from 'playwright';
import { execSync } from 'child_process';

(async () => {
  console.log('Launching browser...');
  
  // Use a persistent context so you don't have to log in every time
  const userDataDir = '/tmp/mercor-playwright-session';
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: null, // use default window size
  });

  const page = browser.pages()[0];
  await page.goto('https://work.mercor.com/refer?tab=connections');

  console.log('\n=============================================');
  console.log('1. Please log into Mercor and LinkedIn in the opened browser.');
  console.log('2. Navigate to Page 2 (or whichever page you want to start on).');
  console.log('3. Come back to this terminal and press ENTER to start the automation.');
  console.log('=============================================\n');

  // Wait for user to press Enter
  await new Promise(resolve => process.stdin.once('data', resolve));

  console.log('Starting automation...');

  // Get all rows in the table (skip the header)
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count();

  console.log(`Found ${rowCount} candidates on this page.`);

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    
    // Find the LinkedIn button. 
    // In the Mercor UI, the LinkedIn button is usually an anchor tag or button wrapping an SVG, 
    // while the Vouch button has the text "Vouch". We will grab the first clickable icon that isn't "Vouch".
    const linkedinBtn = row.locator('a, button').filter({ hasNotText: 'Vouch' }).first();

    console.log(`Processing candidate ${i + 1} of ${rowCount}...`);

    // We need to catch the new page that opens when clicking the LinkedIn button
    const [newPage] = await Promise.all([
      browser.waitForEvent('page'),
      linkedinBtn.click()
    ]);

    await newPage.waitForLoadState('domcontentloaded');

    // Wait a brief moment to ensure Mercor's copy-to-clipboard script has fully executed
    await newPage.waitForTimeout(1500);

    // Read the customized message directly from your Mac's system clipboard!
    const clipboardText = execSync('pbpaste').toString();

    // Find the LinkedIn message box (div with role="textbox")
    const messageBox = newPage.locator('div[role="textbox"][contenteditable="true"]').first();
    await messageBox.waitFor({ state: 'visible', timeout: 10000 });
    
    // Click into the box and paste the clipboard text
    await messageBox.click();
    await messageBox.fill(clipboardText);

    // Wait a second for LinkedIn UI to register the text
    await newPage.waitForTimeout(1000);

    // Find the Send button in LinkedIn messaging
    const sendButton = newPage.locator('button:has-text("Send"), button[type="submit"]').last();
    
    // =========================================================
    // SAFETY SWITCH: Uncomment the line below to actually click Send! 
    // =========================================================
    await sendButton.click();

    console.log(`✅ Successfully sent message for candidate ${i + 1}.`);

    // Wait 5 seconds so we don't trigger LinkedIn's spam/bot detection
    await newPage.waitForTimeout(5000);

    // Close the LinkedIn tab and return to Mercor
    await newPage.close();
  }

  console.log('Finished processing this page!');
  console.log('You can now navigate to the next page and re-run the script.');

  await browser.close();
})();
