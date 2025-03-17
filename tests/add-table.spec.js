import { test, expect } from '@playwright/test';

test('ทดสอบการเพิ่มและลบโต๊ะ', async ({ page }) => {
    await page.goto('http://localhost:3000/tablelayout');;

    // คลิกปุ่ม เพิ่มโต๊ะ
    const addTableButton = page.locator('img[alt="ปุ่มเพิ่มโต๊ะ"]');
    await expect(addTableButton).toBeVisible();
    await addTableButton.click();
    // กรอกเลข 45 ใน input
    await page.fill('input[placeholder="เบอร์โต๊ะ"]', '45');

    // คลิกปุ่มตกลง
    await page.click('button.btn-success:has-text("ตกลง")');

    // ตัวอย่างการตรวจสอบหลังจากเพิ่มโต๊ะสำเร็จ (ถ้ามีข้อความแสดงผล)
    await expect(page.locator('text=45')).toBeVisible();
});