import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
const pdfParse = require('pdf-parse');

test.describe('TraceBridge PDF Export Validation', () => {

  test('End-to-End PDF Generation & Text Assertion', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes to allow for the full AI pipeline

    // 1. Authentication (Signup as dummy user)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const testEmail = process.env.TEST_EMAIL || 'test@tracebridge.ai';
    const testPassword = process.env.TEST_PASSWORD || 'SecurePassword123!';
    
    await page.locator('input[placeholder="name@company.com"]').fill(testEmail);
    await page.locator('input[placeholder="••••••••"]').fill(testPassword);
    await page.locator('button', { hasText: 'Authenticate' }).click();
    
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // 2. Data Ingestion Stream (Upload a device to generate a report)
    await page.locator('text=Initiate Alignment Audit').click();
    await page.waitForURL('**/dashboard/upload');
    await page.waitForLoadState('networkidle');

    // Upload a real demo file to satisfy the Gemini live API (which rejects dummy PDF payloads)
    await page.locator('input[type="file"]').nth(1).setInputFiles(
      path.join(__dirname, '..', '..', 'demo_data', 'MOCK_Software_Requirements_Specification_v2.1.txt')
    );
    await page.waitForTimeout(2000);

    // Select FDA Product Code
    await page.locator('input[placeholder*="Search for a medical device"]').fill('DEMO-OMNIPOD');
    await page.locator('text=DEMO-OMNIPOD').first().click();

    // Run Gap Analysis
    await page.locator('button', { hasText: 'Launch Gap Analysis Engine' }).click();
    
    // 3. Results Dashboard
    await page.waitForURL('**/dashboard/results*', { timeout: 120000 });
    await page.waitForLoadState('networkidle');

    // 4. Reports Hub Dashboard
    console.log('Testing PDF Export on /dashboard/reports...');
    await page.locator('text=Reports').click();
    await page.waitForURL('**/dashboard/reports*');
    await page.waitForLoadState('networkidle');

    // Switch to 510(k) Template
    await page.locator('button', { hasText: '510(k) Trace Matrix' }).click();
    await page.waitForTimeout(1000);

    // Bypass Lockout if gaps are present
    const bypassBtn = page.locator('text=Bypass Lockout (Beta Only)');
    if (await bypassBtn.isVisible()) {
      await bypassBtn.click();
    }

    const reportsExportBtn = page.locator('button', { hasText: '510(k) Submission Matrix (.pdf)' }).first();
    await reportsExportBtn.waitFor({ state: 'visible' });
    await expect(reportsExportBtn).toBeEnabled();

    let downloadPromise = page.waitForEvent('download');
    await reportsExportBtn.click();
    let download = await downloadPromise;

    let filename = download.suggestedFilename();
    expect(filename).toMatch(/^TraceBridge_510k_Matrix_/);
    expect(filename).toMatch(/\.pdf$/);

    let tmpPath = path.join(__dirname, '..', '..', 'tmp', filename);
    await download.saveAs(tmpPath);

    let dataBuffer = fs.readFileSync(tmpPath);
    let pdfData = await pdfParse(dataBuffer);
    let text = pdfData.text;

    // POSITIVE ASSERTIONS
    expect(text).toContain('REQUIREMENT TRACEABILITY MATRIX');
    expect(text.includes('MOCK_Software') || text.includes('DOCUMENTATION MISSING')).toBeTruthy();

    // NEGATIVE ASSERTIONS
    expect(text).not.toContain('No evidence found');
    expect(text).not.toContain('Regulatory Evaluation Traceability Matrix');

    // Cleanup
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

    console.log('All PDF validations passed successfully.');
  });
});
