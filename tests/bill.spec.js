import { test, expect } from '@playwright/test';

test('TC01 ชำระเงิน', async ({ page, context }) => {
    // Go to tables page
    await page.goto('http://localhost:3000/tables');

    // Handle dialog events (alert/confirm/prompt)
    page.on('dialog', async (dialog) => {
        console.log('Dialog message:', dialog.message());
        await dialog.accept();
    });

    // Click on table 45
    const table45 = page.locator('div[style="font-weight: bold; font-size: 1.5rem;"]:has-text("45")');
    await expect(table45).toBeVisible();
    await table45.click();

    // Click on "คิดเงิน" (bill) button
    const billButton = page.locator('button.btn.btn-warning.text-white:has-text("คิดเงิน")');
    await expect(billButton).toBeVisible();
    await billButton.click();

    // Wait for payment page to load
    await page.waitForLoadState('networkidle');

    // Create a listener for new pages (tabs) before clicking the print button
    const pagePromise = context.waitForEvent('page');

    // Click "พิมพ์ใบเสร็จ" (print receipt) button
    const printButton = page.locator('button.btn.btn-success:has-text("พิมพ์ใบเสร็จ")');
    await expect(printButton).toBeVisible();
    await printButton.click();

    // Wait for the new page (tab) to be created
    const newPage = await pagePromise;
    await newPage.waitForLoadState('networkidle');

    // Verify receipt content is visible
    await expect(newPage.locator('text=ร้านอาหาร Fast Shabu')).toBeVisible();

    // // Optional: Take a screenshot of the receipt
    // await newPage.screenshot({ path: 'receipt.png' });

    // Close the new tab (receipt page)
    await newPage.close();

    // Verify you're back on the main page
    await expect(page).toHaveURL('http://localhost:3000/tables');

}); 