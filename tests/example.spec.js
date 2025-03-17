import { test, expect } from '@playwright/test';

test('เปิดเบราว์เซอร์และตรวจสอบ', async ({ page }) => {
    // เปิด localhost
    await page.goto('http://localhost:3000/');

    // ตรวจสอบว่า h1 มีข้อความ "หน้าหลัก"
    const h1 = page.locator('h1.display-5.mb-4');
    await expect(h1).toHaveText('หน้าหลัก');
});
