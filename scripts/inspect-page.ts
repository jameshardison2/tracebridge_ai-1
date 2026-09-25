import puppeteer from 'puppeteer-core';

(async () => {
  console.log('Connecting to Chrome on http://127.0.0.1:9222...');
  
  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });
  } catch (err: any) {
    console.error('\n❌ Could not connect to Chrome on port 9222:', err.message);
    process.exit(1);
  }

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('mercor.com'));
  
  if (!page) {
    console.log('No page with mercor.com found.');
    await browser.disconnect();
    process.exit(1);
  }

  console.log(`\nConnected to: "${await page.title()}"`);
  console.log(`Current URL: ${page.url()}`);

  // Inspect page structure
  const pageData = await page.evaluate(() => {
    // Look for Vouch buttons
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnTexts = buttons.map(b => b.textContent?.trim());
    
    // Look for potential pagination elements
    const paginationText = Array.from(document.querySelectorAll('a, button, div, span'))
      .filter(el => {
        const text = el.textContent?.trim() || '';
        return /^[0-9]+$/.test(text) || text.toLowerCase().includes('page') || text.toLowerCase().includes('next');
      })
      .map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim(),
        className: el.className
      }))
      .slice(0, 50);

    // Look for candidates names/headings
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="name" i]'))
      .map(el => el.textContent?.trim())
      .filter(Boolean)
      .slice(0, 30);

    return {
      btnTexts,
      paginationText,
      headings,
      htmlLength: document.body.innerHTML.length
    };
  });

  console.log('\n--- HEADINGS / CANDIDATE NAMES ---');
  console.log(pageData.headings);

  console.log('\n--- BUTTON TEXTS ---');
  console.log(pageData.btnTexts);

  console.log('\n--- POTENTIAL PAGINATION / NAVIGATION ---');
  console.log(pageData.paginationText);

  console.log('\n--- HTML LENGTH ---');
  console.log(pageData.htmlLength);

  await browser.disconnect();
})();
