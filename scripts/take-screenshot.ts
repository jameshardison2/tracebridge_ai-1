import { chromium } from 'playwright';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://trainaitogain.com ...');
  try {
    // Wait until network is mostly idle to ensure redirect chain is completed
    await page.goto('http://trainaitogain.com', { waitUntil: 'networkidle' });
    
    // Wait an extra second just to be sure any final JS redirects have processed
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log('✅ Final URL landed on:', finalUrl);
    
    const screenshotPath = '/Users/176693/.gemini/antigravity/brain/03d08b52-753e-4d53-9f4e-a6d8eae6544e/mercor_referral_proof.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    console.log(`📸 Screenshot saved to ${screenshotPath}`);
  } catch (error) {
    console.error('Error during navigation:', error);
  } finally {
    await browser.close();
  }
}

main();
