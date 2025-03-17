import { test, expect } from '@playwright/test';

test.describe('ทดสอบจัดการผังโต๊ะ', () => {

    test('TC01 เพิ่มโต๊ะ', async ({ page }) => {
        await page.goto('http://localhost:3000/tablelayout');

        // คลิกปุ่ม เพิ่มโต๊ะ
        const addTableButton = page.locator('img[alt="ปุ่มเพิ่มโต๊ะ"]');
        await expect(addTableButton).toBeVisible();
        await addTableButton.click();

        // กรอกเลข 45
        await page.fill('input[placeholder="เบอร์โต๊ะ"]', '45');

        // คลิกปุ่มตกลง
        await page.click('button.btn-success:has-text("ตกลง")');

        // ตรวจสอบว่าเลขโต๊ะ 45 แสดง
        await expect(page.locator('text=45')).toBeVisible();
    });

    test('TC02 ลบโต๊ะ', async ({ page }) => {
        await page.goto('http://localhost:3000/tablelayout');

        // จัดการ dialog event ล่วงหน้า
        page.on('dialog', async (dialog) => {
            console.log('Dialog message:', dialog.message());
            await dialog.accept();
        });

        // คลิกปุ่มลบโต๊ะ
        const deleteButton = page.locator('img[alt="ปุ่มลบโต๊ะ"]');
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        // เลือกโต๊ะที่ 45
        const tableSpan = page.locator('span:has-text("45")');
        await expect(tableSpan).toBeVisible();
        await tableSpan.click();

        // ตรวจสอบว่าโต๊ะถูกลบ
        await expect(tableSpan).not.toBeVisible();
    });
});