import { test, expect } from '@playwright/test';

test('TC01 ออร์เดอร์แถวแรก สำเร็จ', async ({ page }) => {
    // Go to orders page
    await page.goto('http://localhost:3000/orders');

    // Click on table 42
    const table6 = page.locator('div.list-group-item:has(span:text("โต๊ะ 6"))');
    await expect(table6).toBeVisible();
    await table6.click();

    // Click on "สำเร็จ" ของรายการแรก
    const successButtons = page.locator('button.btn.btn-success', { hasText: 'สำเร็จ' });
    await expect(successButtons.first()).toBeVisible();
    await successButtons.first().click();
});

test('TC02 ออร์เดอร์แถวสอง ยกเลิก', async ({ page }) => {
    // Go to orders page
    await page.goto('http://localhost:3000/orders');

    const table6 = page.locator('div.list-group-item:has(span:text("โต๊ะ 6"))');
    await expect(table6).toBeVisible();
    await table6.click();

    // หาแถวรายการทั้งหมด
    const orderRows = page.locator('tr');

    // หาแถวที่สอง
    const secondRow = orderRows.nth(2);

    // ในแถวนั้น หาเฉพาะปุ่มยกเลิก
    const cancelButton = secondRow.locator('button.btn.btn-danger', { hasText: 'ยกเลิก' });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // Click on "ยืนยันการยกเลิกรายการ"
    const confirmCancelButton = page.locator('button.btn.btn-danger', { hasText: 'ยืนยันการยกเลิกรายการ' });
    await expect(confirmCancelButton).toBeVisible();
    await confirmCancelButton.click();
});

