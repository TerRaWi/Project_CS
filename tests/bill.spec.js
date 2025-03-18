import { test, expect } from '@playwright/test';

test('TC01 ชำระเงิน', async ({ page }) => {
    await page.goto('http://localhost:3000/tables');

    // จัดการ dialog event ล่วงหน้า
    page.on('dialog', async (dialog) => {
        console.log('Dialog message:', dialog.message());
        await dialog.accept();
    });


    // Click on table 45
    const table45 = page.locator('div[style="font-weight: bold; font-size: 1.5rem;"]:has-text("45")');
    await table45.click();

    // คลิกปุ่ม "คิดเงิน"
    await page.locator('button.btn.btn-warning.text-white:has-text("คิดเงิน")').click();

    await page.locator('button.btn.btn-success:has-text("พิมพ์ใบเสร็จ")').click();


}); 