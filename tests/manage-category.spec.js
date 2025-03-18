import { test, expect } from '@playwright/test';

test('TC01 เพิ่มหมวดหมู่', async ({ page }) => {

    // Go to category page
    await page.goto('http://localhost:3000/category');

    await page.fill('input[placeholder="ชื่อหมวดหมู่"]', 'ทดสอบ');
    await page.click('button:has-text("เพิ่มหมวดหมู่")');
});

test('TC02 แก้ไขหมวดหมู่', async ({ page }) => {

    // Go to category page
    await page.goto('http://localhost:3000/category');

    await page.click('button:has-text("แก้ไข")');
    await page.fill('input.form-control[value="ทดสอบ"]', 'ทดสอบหมวดหมู่');
    await page.click('button:has-text("บันทึก")');
});

test('TC03 ลบหมวดหมู่', async ({ page }) => {
        
    // Go to category page
    await page.goto('http://localhost:3000/category');

    await page.click('button:has-text("ลบ")');
    await page.click('button:has-text("ยืนยันการลบ")');
});