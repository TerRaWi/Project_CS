import { test, expect } from '@playwright/test';

test('TC01 ย้ายโต๊ะ', async ({ page, context }) => {
    // Go to tables page
    await page.goto('http://localhost:3000/tables');

    // Click on table 42
    const table42 = page.locator('div[style="font-weight: bold; font-size: 1.5rem;"]:has-text("42")');
    await expect(table42).toBeVisible();
    await table42.click();

    // Click on Edit button
    const editButton = page.locator('button.btn.btn-purple', { hasText: 'แก้ไข' });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Click on โต๊ะ 43
    const table43 = page.locator('p.card-text.mb-0', { hasText: 'โต๊ะ 43' });
    await expect(table43).toBeVisible();
    await table43.click();

    // Click on ดำเนินการต่อ button
    const proceedButton = page.locator('button.btn.btn-primary', { hasText: 'ดำเนินการต่อ' });
    await expect(proceedButton).toBeVisible();
    await proceedButton.click();

    // Click on ยืนยัน button
    const confirmButton = page.locator('button.btn.btn-primary', { hasText: 'ยืนยัน' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
});

test('TC02 รวมโต๊ะ', async ({ page, context }) => {
    // Go to tables page
    await page.goto('http://localhost:3000/tables');

    // Click on table 43
    const table42 = page.locator('div[style="font-weight: bold; font-size: 1.5rem;"]:has-text("43")');
    await expect(table42).toBeVisible();
    await table42.click();

    // Click on แก้ไข
    const editButton = page.locator('button.btn.btn-purple', { hasText: 'แก้ไข' });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Click on รวมโต๊ะ
    const mergeButton = page.locator('button.nav-link', { hasText: 'รวมโต๊ะ' });
    await expect(mergeButton).toBeVisible();
    await mergeButton.click();

    // Click on โต๊ะ 44
    const table44 = page.locator('p.card-text.mb-0', { hasText: 'โต๊ะ 44' });
    await expect(table44).toBeVisible();
    await table44.click();

    // Click on ดำเนินการต่อ
    const proceedButton = page.locator('button.btn.btn-primary', { hasText: 'ดำเนินการต่อ' });
    await expect(proceedButton).toBeVisible();
    await proceedButton.click();

    // Click on ยืนยัน
    const confirmButton = page.locator('button.btn.btn-primary', { hasText: 'ยืนยัน' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
});

test('TC03  ยกเลิกโต๊ะ', async ({ page, context }) => {
    // Go to tables page
    await page.goto('http://localhost:3000/tables');

    // Click on โต๊ะ 44
    const table42 = page.locator('div[style="font-weight: bold; font-size: 1.5rem;"]:has-text("44")');
    await expect(table42).toBeVisible();
    await table42.click();

    // Click on แก้ไข
    const editButton = page.locator('button.btn.btn-purple', { hasText: 'แก้ไข' });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Click on รวมโต๊ะ
    const mergeButton = page.locator('button.nav-link', { hasText: 'ยกเลิกโต๊ะ' });
    await expect(mergeButton).toBeVisible();
    await mergeButton.click();

    // Click on ดำเนินการต่อ
    const proceedButton = page.locator('button.btn.btn-primary', { hasText: 'ดำเนินการต่อ' });
    await expect(proceedButton).toBeVisible();
    await proceedButton.click();

    // Click on ยืนยัน
    const confirmButton = page.locator('button.btn.btn-primary', { hasText: 'ยืนยัน' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();
});
