import { chromium } from 'playwright';

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
  console.log('1. Please log into Mercor in the opened browser if needed.');
  console.log('2. Ensure the "Top Match" filter is applied and you are on the correct page.');
  console.log('3. Come back to this terminal and press ENTER to start the Vouch automation.');
  console.log('=============================================\n');

  // Wait for user to press Enter
  await new Promise(resolve => process.stdin.once('data', resolve));

  console.log('Starting automation...');

  // Get the active page in case the initial tab was closed
  const pages = browser.pages();
  const pageToUse = pages.find(p => p.url().includes('mercor.com')) || pages[pages.length - 1];

  if (!pageToUse || pageToUse.isClosed()) {
    console.log("Error: Could not find an open Mercor tab.");
    process.exit(1);
  }

  // Get all rows in the table
  const rows = pageToUse.locator('tbody tr');
  const rowCount = await rows.count();

  console.log(`Found ${rowCount} candidates on this page.`);

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);
    
    // Find the Vouch button
    const vouchBtn = row.getByRole('button', { name: /Vouch/i });
    if (await vouchBtn.count() === 0) {
      console.log(`Skipping candidate ${i + 1}: Vouch button not found.`);
      continue;
    }
    if (await vouchBtn.isDisabled()) {
      console.log(`Skipping candidate ${i + 1}: Vouch button is disabled (already vouched).`);
      continue;
    }

    console.log(`Vouching for candidate ${i + 1} of ${rowCount}...`);

    await vouchBtn.click();
    
    // Wait for the modal to open
    const modal = pageToUse.locator('[role="dialog"], .modal, .MuiDialog-root').first();
    await modal.waitFor({ state: 'visible', timeout: 10000 }).catch(() => console.log('Modal wait timeout, proceeding anyway...'));

    // Try to select "Found via social platform"
    try {
      const socialOption = pageToUse.getByText(/Found via social platform/i);
      if (await socialOption.count() > 0) {
        await socialOption.first().click();
        // Try to type 'LinkedIn' in any text input that appears
        const input = pageToUse.getByRole('textbox').first();
        if (await input.count() > 0) {
            await input.fill('LinkedIn');
        }
      }
    } catch (e) {
      console.log('Social platform option issue, continuing...');
    }

    // Try to select "Relevant skills"
    try {
      const skillsOption = pageToUse.getByText(/Relevant skills/i);
      if (await skillsOption.count() > 0) {
        await skillsOption.first().click();
      }
    } catch (e) {
      console.log('Relevant skills option issue, continuing...');
    }

    // Fill "Tell us more"
    const tellUsMoreText = "I am formally referring this candidate. Based on their LinkedIn profile, technical background, and experience, they appear to be a highly qualified match for the roles you are actively filling. They have strong technical skills that would be an asset to any fast-paced engineering or product team.";
    try {
      const textarea = pageToUse.locator('textarea').first();
      if (await textarea.count() > 0) {
        await textarea.fill(tellUsMoreText);
      }
    } catch (e) {
      console.log('Textarea issue, continuing...');
    }

    // Click Submit
    try {
      const submitBtn = pageToUse.getByRole('button', { name: /Submit/i });
      if (await submitBtn.count() > 0) {
        await submitBtn.first().click();
        
        // Wait for modal to close
        await pageToUse.waitForTimeout(1500); // Give it a moment to disappear
        console.log(`✅ Successfully vouched for candidate ${i + 1}.`);
      } else {
        console.log(`Could not find Submit button for candidate ${i + 1}. You may need to close the modal manually.`);
      }
    } catch (e) {
        console.log('Submit button issue.');
    }

    // Wait 2 seconds before moving to the next candidate to avoid rate limiting
    await pageToUse.waitForTimeout(2000);
  }

  console.log('Finished processing this page!');
  console.log('You can now navigate to the next page and re-run the script.');

  await browser.close();
})();
