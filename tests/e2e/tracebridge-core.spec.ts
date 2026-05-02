import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('TraceBridge AI - E2E Core Workflow', () => {

  // A helper function to save screenshots with readable names
  const takeScreenshot = async (page: any, name: string) => {
    await page.screenshot({ path: `test-screenshots/${name}.png`, fullPage: true });
  };

  test('Complete End-to-End Walkthrough', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for full AI analysis pipeline

    // 0. Authentication (Signup as dummy user to access dashboard)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '00_Login_Page');

    // Click to Signup
    await page.locator('button', { hasText: 'Request Provisioning' }).click();
    
    // Fill out form
    const randomEmail = `test${Date.now()}@tracebridge.ai`;
    await page.locator('input[placeholder="John Doe"]').fill('Automation Tester');
    await page.locator('input[placeholder="name@company.com"]').fill(randomEmail);
    await page.locator('input[placeholder="••••••••"]').fill('SecurePassword123!');
    
    // Submit Provision Request
    await page.locator('button', { hasText: 'Submit Provision Request' }).click();
    
    // 1. Landing / Dashboard Hub
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '01_Dashboard_Home');
    
    // Verify Dashboard Loaded
    await expect(page.locator('text=Quality Regulatory Dashboard')).toBeVisible();

    // 2. Data Ingestion Stream (Upload)
    // Use the UI button to navigate instead of goto to prevent interrupt loops
    await page.locator('text=Initiate Device Audit').click();
    await page.waitForURL('**/dashboard/upload');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '02_Upload_Page_Initial');

    // Click Greenlight Guru Button (it triggers a window.alert and handles Quick Load Demo)
    page.on('dialog', dialog => dialog.accept());
    await page.locator('text=Greenlight Guru API').click();
    
    // Give the demo files a second to load into the UI
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '03_Upload_Page_Files_Loaded');

    // Check ZDR toggle
    const zdrToggle = page.locator('input[type="checkbox"]');
    await zdrToggle.check({ force: true });
    await takeScreenshot(page, '04_Upload_Page_ZDR_Enabled');

    // Run Gap Analysis
    await page.locator('button', { hasText: 'Run Gap Analysis' }).click();
    
    // 3. Results / Triage Pipeline
    // Waiting for the progress bar to finish and redirect to results
    await page.waitForURL('**/dashboard/results', { timeout: 120000 });
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '05_Results_Dashboard');

    // Click on a critical gap to open Triage Modal
    await page.locator('button', { hasText: 'View Gap Analysis' }).first().click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '06_Results_Triage_Modal');
    
    // Verify FDA Precedent badge is visible in modal
    await expect(page.locator('text=FDA Historical Precedent')).toBeVisible();

    // Close Modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // 4. Regulatory Artifact Hub (Reports)
    await page.locator('text=Reports').click();
    await page.waitForURL('**/dashboard/reports');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '07_Reports_Hub_Initial');

    // Switch to CAPA Template
    await page.locator('button', { hasText: 'CAPA' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '08_Reports_Hub_CAPA');

    // Switch to 510(k) Template
    await page.locator('button', { hasText: '510(k)' }).click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, '09_Reports_Hub_510k');
    
    // Verify the Export buttons exist
    await expect(page.locator('button', { hasText: '510k-Matrix' }).first()).toBeVisible();

    // 5. Customer Discovery Hub
    await page.locator('text=Roster Config').click();
    await page.waitForURL('**/dashboard/team');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '10_Customer_Discovery_Hub');
    
    await expect(page.locator('text=Platform ROI Metrics')).toBeVisible();
  });
});
