describe('TS01 - ทดสอบการทำงานจัดการผังโต๊ะ', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000/tablelayout');
  });

  it('TC01 เปิดเว็บไซต์และคลิกปุ่มเพิ่ม', () => {
    cy.get('img[alt="ปุ่มเพิ่มโต๊ะ"]').click();
    cy.get('.form-control').should('be.visible');
  });

  it('TC02 กรอกจำนวน 45 และบันทึก', () => {
    cy.get('img[alt="ปุ่มเพิ่มโต๊ะ"]').click();
    cy.get('.form-control').type('45');
    cy.get('.btn-success').click();

    // เช็คว่ามี error message หรือไม่
    cy.get('body').then($body => {
      if ($body.find('.alert-danger, .text-danger, [class*="error"]').length > 0) {
        // กรณีมี error - ตรวจสอบ error message
        cy.get('.alert-danger, .text-danger, [class*="error"]')
          .should('be.visible')
          .and('contain', 'เก็บข้อมูลหลายในการเพิ่มโต๊ะ');

        // ปิด modal หรือ error dialog
        cy.get('.btn:contains("ยกเลิก"), .btn-secondary, .close, [aria-label="Close"]')
          .click();
      } else {
        // กรณีไม่มี error - ตรวจสอบว่าโต๊ะแสดงขึ้น
        cy.contains('45').should('be.visible');
      }
    });
  });

  it('TC03 ลบโต๊ะ', () => {
    cy.get('[style="right:30px;top:20px;z-index:1000"] > div > .p-0 > img').click();
    cy.get(':nth-child(12) > .table-available > .position-relative > .bg-danger').click();
  });
});

describe('TS02 - ทดสอบการทำงานจัดการเมนู', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000/product');
  });
  it('TC01 เพิ่มสินค้า', () => {
    cy.get('.btn > img').click();
    cy.get('#productName').type('ทดสอบ');
    cy.get('#productPrice').clear('0');
    cy.get('#productPrice').type('0.00');
    cy.get('#productCategory').select('7');
    cy.get('#productImage').attachFile('test.png');
    cy.get('.btn-primary').click();
  });

  it('TC02 แก้ไขสินค้า', () => {
    cy.get(':nth-child(1) > .card > .card-footer > .btn-outline-primary').click();
    cy.get('#name').clear('ทดสอบ');
    cy.get('#name').type('ทดสอบชื่อ');
    cy.get('.modal').click();
    cy.get('#price').clear();
    cy.get('#price').type('1.00');
    cy.get('#category').select('19');
    cy.get('.btn-primary').click();
  });

  it('TC03 ระงับการขายสินค้า', () => {
    cy.get(':nth-child(1) > .card > .card-footer > .btn-secondary').click();
  });

  it('TC04 ลบสินค้า', () => {
    cy.get(':nth-child(1) > .card > .position-relative > .top-0 > .btn').click();
  });
});

describe('TS03 - ทดสอบการทำงานจัดการหมวดหมู่', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/category');
  });
  it('TC01 เพิ่มหมวดหมู่', () => {
    cy.get('.form-control').type('ทดสอบ');
    cy.get('.col-md-4 > .btn').click();
  });

  it('TC02 แก้ไขหมวดหมู่', () => {
    cy.get(':nth-child(1) > :nth-child(2) > .d-flex > .btn-primary').click();
    cy.get(':nth-child(1) > :nth-child(1) > .form-control').clear();
    cy.get(':nth-child(1) > :nth-child(1) > .form-control').type('ทดสอบหมวดหมู่');
    cy.get('.d-flex > .btn-success').click();
  });

  it('TC03 ลบหมวดหมู่', () => {
    cy.get(':nth-child(1) > :nth-child(2) > .d-flex > .btn-danger').click();
    cy.get('.modal-footer > .btn-danger').click();
  });
});

describe('TS04 - ทดสอบการสั่งอาหาร', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/tables');
  });
  it('TC01 เปิดโต๊ะ', () => {
    cy.get(':nth-child(12) > button > [style="position: relative; width: 100%; height: auto;"] > [style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 2;"] > [style="font-weight: bold; font-size: 1.5rem;"]').click();
    cy.get(':nth-child(1) > .form-control').click();
    cy.get('.flex-wrap > :nth-child(1)').click();
    cy.get(':nth-child(2) > .form-control').click();
    cy.get('.flex-wrap > :nth-child(1)').click();
    cy.get(':nth-child(3) > .form-control').click();
    cy.get('.flex-wrap > :nth-child(1)').click();
    cy.get('.btn-success').click();
    cy.get(':nth-child(12) > button > [style="position: relative; width: 100%; height: auto;"] > [style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 2;"] > [style="font-weight: bold; font-size: 1.5rem;"]').click();
    cy.get('.btn-success').click();
  });

  it('TC02 สั่งรายการอาหาร', () => {
    cy.get(':nth-child(12) > button > [style="position: relative; width: 100%; height: auto;"] > [style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 2;"] > [style="font-weight: bold; font-size: 1.5rem;"]').click();
    cy.get('.btn-success').click();
    cy.get(':nth-child(30) > .card > .position-relative > .card-img-top').click();
    cy.get('.card-footer > .btn').click();
  });
});

describe('TS05 - ทดสอบการชำระเงิน', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/tables');
  });
  it('TC01 ชำระเงิน', () => {
    cy.get(':nth-child(8) > button > [style="position: relative; width: 100%; height: auto;"] > [style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 2;"] > [style="font-weight: bold; font-size: 1.5rem;"]').click();
    cy.get('.btn-warning').click();
    cy.window().then((win) => {
      cy.stub(win, 'open').callsFake((url) => {
        win.location.href = url;
      });
    });
    cy.get('.justify-content-center > .btn-success').click();
  });
});

describe('TS06 - ทดสอบการแก้ไขโต๊ะ', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/tables');
  });
  it('TC01 ย้ายโต๊ะ', () => {
    cy.get(':nth-child(9) > button > [style="position: relative; width: 100%; height: auto;"] > [style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 2;"] > [style="font-weight: bold; font-size: 1.5rem;"]').click();
    cy.get('.btn-purple').click();
    cy.get(':nth-child(7) > .card > .card-body > .card-text').click();
    cy.get('.btn-primary').click();
    cy.get('.btn-primary').click();
  });

  it('TC02 รวมโต๊ะ', () => {
    cy.get(':nth-child(10) > button > [style="position: relative; width: 100%; height: auto;"] > [style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 2;"] > [style="font-weight: bold; font-size: 1.5rem;"]').click();
    cy.get('.btn-purple').click();
    cy.get(':nth-child(2) > .nav-link').click();
    cy.get(':nth-child(2) > .card > .card-body').click();
    cy.get('.btn-primary').click();
    cy.get('.btn-primary').click();
  });

  it('TC03 ยกเลิกโต๊ะ', () => {
    cy.get(':nth-child(11) > button > [style="position: relative; width: 100%; height: auto;"] > [style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 2;"] > [style="font-weight: bold; font-size: 1.5rem;"]').click();
    cy.get('.btn-purple').click();
    cy.get(':nth-child(3) > .nav-link').click();
    cy.get('.btn-primary').click();
    cy.get('.btn-primary').click();
  });
});

describe('TS07 - ทดสอบการจัดการออร์เดอร์', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/orders');
  });
  it('TC01 เปลี่ยนสถานะรายการอาหารเป็น เสร็จสิ้น', () => {
    cy.get(':nth-child(6) > .badge').click();
    cy.get(':nth-child(1) > :nth-child(6) > .btn-group > .btn-success').click();
  });

  it('TC02 เปลี่ยนสถานะรายการอาหารเป็น ยกเลิก', () => {
    cy.get('.list-group > :nth-child(6)').click();
    cy.get('.btn-danger').click();
    cy.get('.bg-light > .btn-danger').click();
  });
});