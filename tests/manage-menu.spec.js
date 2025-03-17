const { test, expect } = require('@playwright/test');
const path = require('path');

test('TC01 เพิ่มเมนู', async ({ page }) => {
        await page.goto('http://localhost:3000/product');

        // คลิกปุ่ม เพิ่มเมนู
        const addProductButton = page.locator('img[alt="เพิ่มสินค้าใหม่"]');
        await expect(addProductButton).toBeVisible();
        await addProductButton.click();

        // ชื่อสินค้า
        const inputname = page.locator('#productName');
        await inputname.fill('ทดสอบ');
        await expect(inputname).toHaveValue('ทดสอบ');

        // ราคา
        const inputprice = page.locator('#productPrice');
        await inputprice.fill('0.00');
        await expect(inputprice).toHaveValue('0.00');

        // หมวดหมู่
        const dropdown = page.locator('#productCategory');
        await dropdown.selectOption('7');
        await expect(dropdown).toHaveValue('7');

        // ใส่รูปภาพ
        const fileInput = page.locator('#productImage');
        const filePath = path.resolve(__dirname, '../public/images/test.png'); // ใช้ __dirname ได้ใน CommonJS
        await fileInput.setInputFiles(filePath);
        const files = await fileInput.evaluate(input => input.files[0].name);
        expect(files).toBe('test.png');

        // คลิกปุ่ม บันทึก
        await page.locator('button.btn.btn-primary', { hasText: 'บันทึก' }).click();

        //ตรวจสอบว่ามีชื่อสสินค้านี้แล้ว
        const productElement = page.locator('h6.card-title.fw-bold.mb-2', { hasText: 'ทดสอบ' });
    });



// test('TC02 ลบโต๊ะ', async ({ page }) => {
//     await page.goto('http://localhost:3000/product');

//     // จัดการ dialog event ล่วงหน้า
//     page.on('dialog', async (dialog) => {
//         console.log('Dialog message:', dialog.message());
//         await dialog.accept();
//     });

//     // คลิกปุ่มลบโต๊ะ
//     const deleteButton = page.locator('img[alt="ปุ่มลบโต๊ะ"]');
//     await expect(deleteButton).toBeVisible();
//     await deleteButton.click();

//     // เลือกโต๊ะที่ 45
//     const tableSpan = page.locator('span:has-text("45")');
//     await expect(tableSpan).toBeVisible();
//     await tableSpan.click();

//     // ตรวจสอบว่าโต๊ะถูกลบ
//     await expect(tableSpan).not.toBeVisible();
// });