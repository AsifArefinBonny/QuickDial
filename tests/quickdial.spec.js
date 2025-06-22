const { test, expect } = require('@playwright/test');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');
const pdfjsLib = require('pdfjs-dist/legacy/pdf.js');

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

  test('Rapid submit does not break UI', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    const btn = page.getByRole('button', { name: /Generate QR Code/i });
    await Promise.all([
      btn.click(),
      btn.click(),
      btn.click()
    ]);
    await expect(page.getByText('QR Code Generated Successfully!')).toBeVisible();
  });

  test('Multiple QR generations update result', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await expect(page.getByText('QR Code Generated Successfully!')).toBeVisible();
    await page.getByRole('button', { name: /Generate New/i }).click();
    await page.getByLabel(/Phone Number/i).fill('01887654321');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await expect(page.getByText('QR Code Generated Successfully!')).toBeVisible();
    await expect(page.getByText(/Phone:/)).toContainText('01887654321');
  });

  test('Download PDF after QR code generation', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Download PDF/i }).click()
    ]);
    expect(download.suggestedFilename()).toMatch(/QuickDial-01712345678.*\.pdf/);
  });

  test('Share PDF after QR code generation (fallback to download)', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    // Simulate share fallback by not supporting navigator.share
    await page.addInitScript(() => { window.navigator.share = undefined; });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Share PDF/i }).click()
    ]);
    expect(download.suggestedFilename()).toMatch(/QuickDial-01712345678.*\.pdf/);
  });

  test('Alert auto-dismisses after 5 seconds', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByRole('button', { name: /Download PDF/i }).click();
    await expect(page.locator('.alert-warning')).toBeVisible();
    await page.waitForTimeout(5500);
    await expect(page.locator('.alert-warning')).not.toBeVisible();
  });

  test('Focus is set to phone number on Generate New', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await page.getByRole('button', { name: /Generate New/i }).click();
    await expect(page.getByLabel(/Phone Number/i)).toBeFocused();
  });

  test('Tab order: can navigate form and buttons with keyboard', async ({ page }) => {
    await page.goto(APP_URL);
    await page.keyboard.press('Tab'); // Phone number
    await expect(page.getByLabel(/Phone Number/i)).toBeFocused();
    await page.keyboard.press('Tab'); // Name
    await expect(page.getByLabel(/Name/i)).toBeFocused();
    await page.keyboard.press('Tab'); // Generate QR
    await expect(page.getByRole('button', { name: /Generate QR Code/i })).toBeFocused();
  });

  test('ARIA roles: result section and alerts', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    // Alerts should have role=alert
    const alert = page.locator('.alert-success');
    await expect(alert).toBeVisible();
    expect(await alert.getAttribute('role')).toBe('alert');
  });

  test('QR code image changes for different phone numbers', async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await page.waitForSelector('#qrcode canvas');
    const qr1 = await page.locator('#qrcode canvas').screenshot();

    await page.getByRole('button', { name: /Generate New/i }).click();
    await page.getByLabel(/Phone Number/i).fill('01887654321');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await page.waitForSelector('#qrcode canvas');
    const qr2 = await page.locator('#qrcode canvas').screenshot();

    // Compare images using pixelmatch
    const img1 = PNG.sync.read(qr1);
    const img2 = PNG.sync.read(qr2);
    const { width, height } = img1;
    const diff = new PNG({ width, height });
    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
    expect(numDiffPixels).toBeGreaterThan(0); // Images should differ
  });

  test('Downloaded PDF contains correct phone and name', async ({ page, context, tmpPath }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByLabel(/Name/i).fill('Test User');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Download PDF/i }).click()
    ]);
    const pdfPath = tmpPath + '/test.pdf';
    await download.saveAs(pdfPath);
    const data = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(data);
    expect(pdfData.text).toContain('01712345678');
    expect(pdfData.text).toContain('Test User');
  });

  test('Analytics event is fired on PDF download', async ({ page }) => {
    await page.goto(APP_URL);
    await page.addInitScript(() => {
      window.gtag = (...args) => { window._gtagEvents = window._gtagEvents || []; window._gtagEvents.push(args); };
    });
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await page.getByRole('button', { name: /Download PDF/i }).click();
    await page.waitForTimeout(500); // Wait for event
    const events = await page.evaluate(() => window._gtagEvents || []);
    expect(events.some(e => e[0] === 'event' && e[1] === 'download')).toBeTruthy();
  });

  test('Analytics event is fired on PDF share', async ({ page }) => {
    await page.goto(APP_URL);
    await page.addInitScript(() => {
      window.gtag = (...args) => { window._gtagEvents = window._gtagEvents || []; window._gtagEvents.push(args); };
    });
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    // Simulate share fallback by not supporting navigator.share
    await page.addInitScript(() => { window.navigator.share = undefined; });
    await page.getByRole('button', { name: /Share PDF/i }).click();
    await page.waitForTimeout(500); // Wait for event
    const events = await page.evaluate(() => window._gtagEvents || []);
    expect(events.some(e => e[0] === 'event' && e[1].startsWith('share'))).toBeTruthy();
  });

  test('QR code encodes correct phone number', async ({ page }) => {
    await page.goto(APP_URL);
    const phone = '01712345678';
    await page.getByLabel(/Phone Number/i).fill(phone);
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await page.waitForSelector('#qrcode canvas');
    const qrPng = await page.locator('#qrcode canvas').screenshot();
    // Load image into canvas
    const img = await loadImage(qrPng);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const code = jsQR(imageData.data, img.width, img.height);
    expect(code).not.toBeNull();
    expect(code.data).toContain(phone.replace(/\D/g, ''));
  });

  test('Generated PDF visually matches baseline', async ({ page, tmpPath }) => {
    await page.goto(APP_URL);
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByLabel(/Name/i).fill('Test User');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Download PDF/i }).click()
    ]);
    const pdfPath = tmpPath + '/test.pdf';
    await download.saveAs(pdfPath);
    // Render first page of PDF to PNG
    const data = fs.readFileSync(pdfPath);
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const page1 = await pdf.getPage(1);
    const viewport = page1.getViewport({ scale: 2 });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    await page1.render({ canvasContext: ctx, viewport }).promise;
    const generatedPng = canvas.toBuffer();
    // Load baseline PNG (should be placed in tests/baseline.pdf.png)
    const baselinePng = fs.readFileSync(__dirname + '/baseline.pdf.png');
    const img1 = PNG.sync.read(generatedPng);
    const img2 = PNG.sync.read(baselinePng);
    const { width, height } = img1;
    const diff = new PNG({ width, height });
    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
    // Allow some tolerance for dynamic content
    expect(numDiffPixels).toBeLessThan(width * height * 0.01);
  });

  test('Analytics event is fired on Generate QR Code', async ({ page }) => {
    await page.goto(APP_URL);
    await page.addInitScript(() => {
      window.gtag = (...args) => { window._gtagEvents = window._gtagEvents || []; window._gtagEvents.push(args); };
    });
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await page.waitForTimeout(500);
    const events = await page.evaluate(() => window._gtagEvents || []);
    expect(events.some(e => e[0] === 'event' && e[1] === 'generate')).toBeTruthy();
  });

  test('Analytics event is fired on Generate New', async ({ page }) => {
    await page.goto(APP_URL);
    await page.addInitScript(() => {
      window.gtag = (...args) => { window._gtagEvents = window._gtagEvents || []; window._gtagEvents.push(args); };
    });
    await page.getByLabel(/Phone Number/i).fill('01712345678');
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await page.getByRole('button', { name: /Generate New/i }).click();
    await page.waitForTimeout(500);
    const events = await page.evaluate(() => window._gtagEvents || []);
    expect(events.some(e => e[0] === 'event' && e[1] === 'generate_new')).toBeTruthy();
  });

  test('Analytics event is fired on error', async ({ page }) => {
    await page.goto(APP_URL);
    await page.addInitScript(() => {
      window.gtag = (...args) => { window._gtagEvents = window._gtagEvents || []; window._gtagEvents.push(args); };
    });
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    await page.waitForTimeout(500);
    const events = await page.evaluate(() => window._gtagEvents || []);
    expect(events.some(e => e[0] === 'event' && e[1] === 'error')).toBeTruthy();
  });
}); 