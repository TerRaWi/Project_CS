import { test, expect } from '@playwright/test';

test('TC01 เปิดออร์เดอร์', async ({ page }) => {

    await page.goto('http://localhost:3000/tables');

    // Click on table 46
    const table45 = page.locator('div[style="font-weight: bold; font-size: 1.5rem;"]:has-text("46")');
    await table45.click();

    // เด็กเล็ก
    const smallChildInput = page.locator('input[type="number"]').nth(0);
    await smallChildInput.click();
    await page.locator('button.btn.btn-light:has-text("1")').first().click();

    // เด็กโต
    const olderChildInput = page.locator('input[type="number"]').nth(1);
    await olderChildInput.click();
    await page.locator('button.btn.btn-light:has-text("1")').first().click();

    // ผู้ใหญ่
    const adultInput = page.locator('input[type="number"]').nth(2);
    await adultInput.click();
    await page.locator('button.btn.btn-light:has-text("1")').first().click();

    // Confirm - "ตกลง" is the green button
    await page.locator('button.btn-success').click();
});

test('TC02 สั่งอาหาร', async ({ page }) => {

    await page.goto('http://localhost:3000/tables');

    // Click on table 46
    const table45 = page.locator('div[style="font-weight: bold; font-size: 1.5rem;"]:has-text("46")');
    await table45.click();

    // คลิกปุ่ม "สั่งอาหาร"
    const orderFoodButton = page.locator('button.btn.btn-success:has-text("สั่งอาหาร")');
    await orderFoodButton.click();

    // คลิกที่รูปอาหาร "หมูหมักนุ่ม"
    const foodImage = page.locator('img[alt="หมูหมักนุ่ม"]');
    await foodImage.click();

    // คลิกปุ่ม "ยืนยันการสั่งอาหาร"
    const confirmOrderButton = page.locator('button.btn.btn-success.w-100:has-text("ยืนยันการสั่งอาหาร")');
    await confirmOrderButton.click();

    const foodItem = page.locator('td:has-text("หมูหมักนุ่ม")');
    await expect(foodItem).toBeVisible({ timeout: 5000 });
});