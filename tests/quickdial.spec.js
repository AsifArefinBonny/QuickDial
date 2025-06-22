const { test, expect } = require('@playwright/test');

const APP_URL = 'https://asifarefinbonny.github.io/QuickDial/';

test.describe('QuickDial UI Automation', () => {
  test('Page loads and main elements are visible', async ({ page }) => {
    await page.goto(APP_URL);
    await expect(page).toHaveTitle(/QuickDial/);
    await expect(page.getByPlaceholder('Enter your phone number in any format')).toBeVisible();
    await expect(page.getByPlaceholder('Adding your name makes it more personal and professional')).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate QR Code/i })).toBeVisible();
  });

  test('Generate QR code with valid input', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByPlaceholder('Enter your phone number in any format').fill('01712345678');
    await page.getByPlaceholder('Adding your name makes it more personal and professional').fill('Test User');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await expect(page.getByText('QR Code Generated Successfully!')).toBeVisible();
    await expect(page.getByRole('button', { name: /Download PDF/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Share PDF/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Generate New/i })).toBeVisible();
  });

  test('Show error for empty phone number', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await expect(page.locator('text=Phone Number is required')).toBeVisible();
  });

  test('Instructions toggle works', async ({ page }) => {
    await page.goto(APP_URL);
    const instructionsBtn = page.getByRole('button', { name: /How to Use This App/i });
    await expect(page.locator('#instructions')).not.toHaveClass(/show/);
    await instructionsBtn.click();
    await expect(page.locator('#instructions')).toHaveClass(/show/);
    await instructionsBtn.click();
    await expect(page.locator('#instructions')).not.toHaveClass(/show/);
  });

  test('Generate QR code with only phone number', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await expect(page.getByText('QR Code Generated Successfully!')).toBeVisible();
    await expect(page.getByText(/Phone:/)).toContainText('01712345678');
  });

  test('Name field enforces max length', async ({ page }) => {
    await page.goto(APP_URL);
    const longName = 'A'.repeat(40);
    await page.getByLabel(/Name/i).fill(longName);
    await expect(page.locator('.alert-warning')).toContainText('Name cannot exceed 30 characters');
    const nameValue = await page.getByLabel(/Name/i).inputValue();
    expect(nameValue.length).toBeLessThanOrEqual(30);
  });

  test('Invalid phone number shows warning', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('12345');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await expect(page.locator('.alert-warning')).toContainText('Please enter a valid phone number');
  });

  test('Download PDF button requires QR code', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByRole('button', { name: /Download PDF/i }).click();
    await expect(page.locator('.alert-warning')).toContainText('Please generate a QR code first');
  });

  test('Share PDF button requires QR code', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByRole('button', { name: /Share PDF/i }).click();
    await expect(page.locator('.alert-warning')).toContainText('Please generate a QR code first');
  });

  test('Generate New resets form and UI', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await page.getByRole('button', { name: /Generate New/i }).click();
    await expect(page.getByLabel(/Phone Number/i)).toBeEmpty();
    await expect(page.locator('#resultSection')).not.toHaveClass(/show/);
    await expect(page.locator('.form-section')).toBeVisible();
  });

  test('Responsive layout on mobile', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Mobile emulation not fully supported on Firefox');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto(APP_URL);
    await expect(page.locator('.main-container')).toBeVisible();
    await expect(page.locator('.action-buttons')).toBeVisible();
  });

  test('Accessibility: All buttons and inputs have accessible names', async ({ page }) => {
    await page.goto(APP_URL);
    const buttons = await page.locator('button').all();
    for (const btn of buttons) {
      const name = await btn.getAttribute('aria-label') || await btn.textContent();
      expect(name.trim().length).toBeGreaterThan(0);
    }
    const phoneInput = page.getByLabel(/Phone Number/i);
    await expect(phoneInput).toBeVisible();
    const nameInput = page.getByLabel(/Name/i);
    await expect(nameInput).toBeVisible();
  });
}); 