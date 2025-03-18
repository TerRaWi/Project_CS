const { test, expect } = require('@playwright/test'), path = require('path');

test('TC01 เพิ่มสินค้า', async ({ page }) => {
    await page.goto('http://localhost:3000/product');

    // คลิกปุ่ม เพิ่มสินค้า
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

    // ตรวจสอบว่ามีสินค้าชื่อ "ทดสอบ"
    const productNameLocator = page.locator(`text=ทดสอบ`);
    await expect(productNameLocator).toBeVisible();
});

test('TC02 แก้ไขเมนู', async ({ page }) => {
    await page.goto('http://localhost:3000/product');

    // ค้นหาข้อความ "ทดสอบ" แล้วไปที่ปุ่มแก้ไขที่อยู่ในส่วนเดียวกัน
    const editButtonForTestProduct = await page.locator('div', {
        has: page.locator('text=ทดสอบ')
    }).locator('button:has-text("แก้ไข")').first();
    await editButtonForTestProduct.click();

    // ชื่อสินค้า
    const inputname = page.locator('#name');
    await inputname.fill('ทดสอบชื่อ');
    await expect(inputname).toHaveValue('ทดสอบชื่อ');

    // กรอกราคา
    const priceInput = page.locator('#price');
    await priceInput.fill('1.00');
    await expect(priceInput).toHaveValue('1.00');

    // หมวดหมู่
    const categorySelect = page.locator('#category');
    await categorySelect.selectOption('25');
    await expect(categorySelect).toHaveValue('25');

    // ใส่รูปภาพ
    const fileInput = page.locator('#image'); // แก้ไข selector ให้ตรงกับ id ในเอกสาร HTML
    const filePath = path.resolve(__dirname, '../public/images/no-image.png'); // เปลี่ยนชื่อไฟล์
    await fileInput.setInputFiles(filePath);
    const files = await fileInput.evaluate(input => input.files[0].name);
    expect(files).toBe('no-image.png'); // แก้ไขชื่อไฟล์ในการตรวจสอบด้วย

    // คลิกปุ่ม บันทึก
    await page.locator('button.btn.btn-primary', { hasText: 'บันทึก' }).click();

    // ตรวจสอบว่ามีสินค้าชื่อ "ทดสอบชื่อ"
    const productNameLocator = page.locator(`text=ทดสอบชื่อ`);
    await expect(productNameLocator).toBeVisible();
});

test('TC03 ระงับการขายสินค้า', async ({ page }) => {
    await page.goto('http://localhost:3000/product');

    await page.locator('div', { hasText: 'ทดสอบชื่อ' })
        .locator('button', { hasText: 'ระงับการขาย' })
        .first()
        .click();
});

test('TC04 ลบสินค้า', async ({ page }) => {
    await page.goto('http://localhost:3000/product');

    // จัดการ dialog event ล่วงหน้า
    page.on('dialog', async (dialog) => {
        console.log('Dialog message:', dialog.message());
        await dialog.accept();
    });
    // คลิกปุ่ม ลบสินค้า
    await page.locator('div')
        .filter({ hasText: 'ทดสอบชื่อ' })
        .locator('button.btn-danger.rounded-circle')
        .first()
        .click();
});