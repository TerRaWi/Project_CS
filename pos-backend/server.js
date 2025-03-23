process.env.TZ = 'Asia/Bangkok';

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

/**
 * ============================
 * การตั้งค่าเริ่มต้น (Configuration)
 * ============================
 */

// กำหนดการจัดเก็บไฟล์รูปภาพ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// สร้าง Express app และกำหนดพอร์ต
const app = express();
// const PORT = 3001;
const PORT = 4000; //server

// กำหนด middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// เชื่อมต่อฐานข้อมูล MySQL //server
const db = mysql.createConnection({
  host: 'mysql-db',
  user: 'root',
  port: '3306',
  password: 'root',
  database: 'posdb'
});

// // เชื่อมต่อฐานข้อมูล MySQL
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '6101',
//   database: 'posdb'
// });

db.connect((err) => {
  if (err) {
    console.error('เชื่อมต่อ MySQL ไม่สำเร็จ:', err);
    return;
  }
  console.log('เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
});

/**
 * ============================
 * Health check API
 * ============================
 */

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * ============================
 * API เกี่ยวกับโต๊ะ (Tables)
 * ============================
 */

// นำโต๊ะมาแสดงบน Page โต๊ะ
app.get('/api/tables', (req, res) => {
  // ค้นหาสถานะที่ไม่ต้องการแสดง (ไม่ใช้งาน)
  db.query(
    'SELECT id FROM table_status WHERE name = ?',
    ['ไม่ใช้งาน'], // หรือชื่อสถานะที่คุณเพิ่ม
    (statusErr, statusResults) => {
      if (statusErr) {
        console.error('เกิดข้อผิดพลาดในการค้นหาสถานะ:', statusErr);
        return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      }

      // ถ้าไม่พบสถานะ "ไม่ใช้งาน" ให้แสดงโต๊ะทั้งหมด
      if (statusResults.length === 0) {
        const query = `
          SELECT dt.*, ts.name as status_name 
          FROM dining_table dt 
          JOIN table_status ts ON dt.status_id = ts.id 
          ORDER BY CAST(table_number AS SIGNED)
        `;

        db.query(query, (err, results) => {
          if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโต๊ะ:', err);
            return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
          }
          res.json(results);
        });
        return;
      }

      // ถ้าพบสถานะ "ไม่ใช้งาน" ให้แสดงเฉพาะโต๊ะที่ไม่ได้มีสถานะนั้น
      const inactiveStatusId = statusResults[0].id;
      const query = `
        SELECT dt.*, ts.name as status_name 
        FROM dining_table dt 
        JOIN table_status ts ON dt.status_id = ts.id 
        WHERE dt.status_id != ?
        ORDER BY CAST(table_number AS SIGNED)
      `;

      db.query(query, [inactiveStatusId], (err, results) => {
        if (err) {
          console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโต๊ะ:', err);
          return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
        }
        res.json(results);
      });
    }
  );
});

// สร้างโต๊ะ
app.post('/api/tables', (req, res) => {
  const { table_number, status_id } = req.body;

  if (!table_number) {
    return res.status(400).json({ error: 'ต้องระบุเบอร์โต๊ะ' });
  }

  // First check if table_number already exists
  db.query('SELECT id, status_id FROM dining_table WHERE table_number = ?', [table_number], (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบเบอร์โต๊ะ:', err);
      return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
    }

    // ดึง ID ของสถานะ "ว่าง" และ "ไม่ใช้งาน"
    db.query(
      'SELECT id, name FROM table_status WHERE name IN (?, ?)',
      ['ว่าง', 'ไม่ใช้งาน'],
      (statusErr, statusResults) => {
        if (statusErr) {
          console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะ:', statusErr);
          return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
        }

        const availableStatusId = statusResults.find(s => s.name === 'ว่าง')?.id || 1;
        const inactiveStatusId = statusResults.find(s => s.name === 'ไม่ใช้งาน')?.id;

        if (results.length > 0) {
          // โต๊ะนี้มีอยู่แล้ว
          const table = results[0];
          
          // ถ้าโต๊ะมีสถานะเป็น "ไม่ใช้งาน" ให้เปลี่ยนเป็น "ว่าง"
          if (inactiveStatusId && table.status_id === inactiveStatusId) {
            db.query(
              'UPDATE dining_table SET status_id = ? WHERE id = ?',
              [availableStatusId, table.id],
              (updateErr, updateResult) => {
                if (updateErr) {
                  console.error('เกิดข้อผิดพลาดในการอัปเดตสถานะโต๊ะ:', updateErr);
                  return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
                }

                res.json({
                  id: table.id,
                  table_number,
                  status_id: availableStatusId,
                  message: 'เปิดใช้งานโต๊ะสำเร็จ'
                });
              }
            );
          } else {
            // ถ้าไม่ใช่สถานะ "ไม่ใช้งาน" แสดงว่าโต๊ะนี้กำลังใช้งานอยู่
            return res.status(409).json({ error: 'เบอร์โต๊ะนี้มีอยู่แล้ว' });
          }
        } else {
          // ถ้าไม่มีโต๊ะนี้ ให้สร้างโต๊ะใหม่
          db.query(
            'INSERT INTO dining_table (table_number, status_id) VALUES (?, ?)',
            [table_number, availableStatusId],
            (insertErr, result) => {
              if (insertErr) {
                console.error('เกิดข้อผิดพลาดในการเพิ่มโต๊ะ:', insertErr);
                return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
              }

              const newTable = {
                id: result.insertId,
                table_number,
                status_id: availableStatusId
              };

              res.json(newTable);
            }
          );
        }
      }
    );
  });
});

// เปิดโต๊ะ (บันทึกข้อมูลลูกค้า)
app.post('/api/saveCustomer', async (req, res) => {
  const { tableId, adultCount, oldChildCount, childCount } = req.body;

  try {
    // เริ่ม transaction
    await db.promise().query('START TRANSACTION');

    // 1. สร้าง order ใหม่
    const [orderResult] = await db.promise().query(
      `INSERT INTO \`order\` (table_id, status) 
        VALUES (?, 'A')`,
      [tableId]
    );

    const orderId = orderResult.insertId;

    // 2. ดึงข้อมูล product จากชื่อ
    const [products] = await db.promise().query(
      `SELECT id, price, name 
        FROM product 
        WHERE name IN ('ผู้ใหญ่', 'เด็กโต', 'เด็กเล็ก')
       AND status = 'A'`  // เพิ่มเงื่อนไขเช็คสถานะ product ว่ายังใช้งานอยู่
    );

    // 3. จับคู่จำนวนลูกค้ากับ product
    const customerTypes = [
      { name: 'ผู้ใหญ่', count: adultCount },
      { name: 'เด็กโต', count: oldChildCount },
      { name: 'เด็กเล็ก', count: childCount }
    ];

    // 4. ตรวจสอบว่ามีลูกค้าอย่างน้อย 1 คน
    const totalCustomers = adultCount + oldChildCount + childCount;
    if (totalCustomers === 0) {
      await db.promise().query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุจำนวนลูกค้าอย่างน้อย 1 คน'
      });
    }

    // 5. ตรวจสอบว่ามี product ครบทุกประเภท
    if (products.length !== 3) {
      await db.promise().query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'ไม่พบข้อมูลประเภทลูกค้าในระบบ'
      });
    }

    // 6. สร้าง order_detail สำหรับแต่ละประเภทลูกค้าที่มีจำนวนมากกว่า 0
    for (const type of customerTypes) {
      if (type.count > 0) {
        const product = products.find(p => p.name === type.name);
        if (product) {
          await db.promise().query(
            `INSERT INTO order_detail (
              order_id, 
              product_id, 
              quantity, 
              unit_price, 
              status,
              order_time
            ) VALUES (?, ?, ?, ?, 'C', CURRENT_TIMESTAMP)`,  // เปลี่ยนจาก 'A' เป็น 'C'
            [orderId, product.id, type.count, product.price]
          );
        }
      }
    }

    // 7. อัพเดทสถานะโต๊ะเป็นไม่ว่าง (status_id = 2)
    await db.promise().query(
      'UPDATE dining_table SET status_id = 2 WHERE id = ?',
      [tableId]
    );

    // 8. บันทึก transaction
    await db.promise().query('COMMIT');

    // 9. ส่งผลลัพธ์กลับ
    res.json({
      success: true,
      orderId,
      message: 'บันทึกข้อมูลสำเร็จ'
    });

  } catch (error) {
    // กรณีเกิดข้อผิดพลาด
    await db.promise().query('ROLLBACK');
    console.error('Error saving customer data:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
});

// ลบโต๊ะ
app.delete('/api/tables/:tableNumber', (req, res) => {
  const tableNumber = req.params.tableNumber;

  // First check if the table exists and get its status
  db.query(
    'SELECT dt.*, ts.name as status_name FROM dining_table dt JOIN table_status ts ON dt.status_id = ts.id WHERE dt.table_number = ?',
    [tableNumber],
    (err, results) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการตรวจสอบโต๊ะ:', err);
        return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'ไม่พบโต๊ะที่ต้องการลบ' });
      }

      // Check if table is occupied
      if (results[0].status_name === 'ไม่ว่าง') {
        return res.status(400).json({
          error: 'ไม่สามารถลบโต๊ะได้เนื่องจากโต๊ะกำลังถูกใช้งาน'
        });
      }

      // Check if table has any active orders
      db.query(
        `SELECT o.* FROM \`order\` o 
          JOIN dining_table dt ON o.table_id = dt.id 
          WHERE dt.table_number = ? AND o.status = 'A'`,
        [tableNumber],
        (err, orderResults) => {
          if (err) {
            console.error('เกิดข้อผิดพลาดในการตรวจสอบออเดอร์:', err);
            return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
          }

          if (orderResults.length > 0) {
            return res.status(400).json({
              error: 'ไม่สามารถลบโต๊ะได้เนื่องจากมีออเดอร์ที่ยังไม่เสร็จสิ้น'
            });
          }

          // ค้นหา ID ของสถานะ "ไม่ใช้งาน" (หรือสถานะที่คุณต้องการใช้)
          db.query(
            'SELECT id FROM table_status WHERE name = ?',
            ['ไม่ใช้งาน'], // หรือชื่อสถานะที่คุณเพิ่ม
            (err, statusResults) => {
              if (err || statusResults.length === 0) {
                console.error('เกิดข้อผิดพลาดในการค้นหาสถานะ:', err);
                return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
              }

              const inactiveStatusId = statusResults[0].id;

              // อัปเดตสถานะโต๊ะเป็น "ไม่ใช้งาน" แทนการลบข้อมูล
              db.query(
                'UPDATE dining_table SET status_id = ? WHERE table_number = ?',
                [inactiveStatusId, tableNumber],
                (err, result) => {
                  if (err) {
                    console.error('เกิดข้อผิดพลาดในการอัปเดตสถานะโต๊ะ:', err);
                    return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
                  }

                  res.json({ message: 'ลบโต๊ะสำเร็จ' });
                }
              );
            }
          );
        }
      );
    }
  );
});

/**
 * ============================
 * API เกี่ยวกับสินค้า (Products)
 * ============================
 */

// นำเมนูมาแสดงบน Page จัดการเมนู
app.get('/api/product', (req, res) => {
  const query = `
    SELECT p.id, p.name, p.price, p.category_id, p.image_url, p.status 
    FROM product p 
    WHERE p.status IN ('A', 'I')
    ORDER BY p.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:', err);
      return res.status(500).json({ error: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
    res.json(results);
  });
});

// เพิ่มสินค้าใหม่
app.post('/api/product', upload.single('image'), (req, res) => {
  const { name, price, category_id } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const query = `
    INSERT INTO product (name, price, category_id, image_url, status) 
    VALUES (?, ?, ?, ?, 'A')
  `;

  db.query(query, [name, price, category_id, image_url], (err, result) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า:', err);
      return res.status(500).json({ error: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
    }

    const newProduct = {
      id: result.insertId,
      name,
      price,
      category_id,
      image_url,
      status: 'A'
    };

    res.status(201).json(newProduct);
  });
});

// ลบสินค้า
app.delete('/api/product/:id', (req, res) => {
  const productId = req.params.id;  // ดึงค่า id จาก URL parameters

  if (!productId) {
    return res.status(400).json({ error: 'ไม่ได้ระบุรหัสสินค้า' });
  }

  // ตรวจสอบว่ามีสินค้าอยู่หรือไม่ และดึง image_url
  db.query('SELECT image_url FROM product WHERE id = ?', [productId], (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบสินค้า:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสินค้า' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบสินค้าที่ต้องการลบ' });
    }

    const imageUrl = results[0].image_url;

    // ลบสินค้าจากฐานข้อมูล
    db.query('DELETE FROM product WHERE id = ?', [productId], (deleteErr, deleteResult) => {
      if (deleteErr) {
        console.error('เกิดข้อผิดพลาดในการลบสินค้า:', deleteErr);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบสินค้า' });
      }

      // ถ้ามีไฟล์รูปภาพ ให้ลบไฟล์ด้วย
      if (imageUrl) {
        const imagePath = path.join(__dirname, imageUrl);
        fs.unlink(imagePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== 'ENOENT') {
            console.error('เกิดข้อผิดพลาดในการลบไฟล์รูปภาพ:', unlinkErr);
          }
        });
      }

      res.json({
        message: 'ลบสินค้าสำเร็จ',
        id: productId
      });
    });
  });
});

// แก้ไขสินค้า
app.put('/api/product/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, price, category_id } = req.body;

  db.query('SELECT image_url FROM product WHERE id = ?', [id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบสินค้า:', checkErr);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'ไม่พบสินค้าที่ต้องการแก้ไข' });
    }

    const oldImageUrl = checkResults[0].image_url;
    const image_url = req.file ? `/uploads/${req.file.filename}` : oldImageUrl;

    if (req.file && oldImageUrl) {
      const oldImagePath = path.join(__dirname, oldImageUrl);
      fs.unlink(oldImagePath, (unlinkErr) => {
        if (unlinkErr && unlinkErr.code !== 'ENOENT') {
          console.error('เกิดข้อผิดพลาดในการลบรูปภาพเก่า:', unlinkErr);
        }
      });
    }

    const query = 'UPDATE product SET name = ?, price = ?, category_id = ?, image_url = ? WHERE id = ?';
    db.query(query, [name, price, category_id, image_url, id], (updateErr, result) => {
      if (updateErr) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตสินค้า:', updateErr);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
      }

      res.json({
        id,
        name,
        price,
        category_id,
        image_url
      });
    });
  });
});

// อัพเดทสถานะสินค้า (A,I)
app.patch('/api/product/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['A', 'I'].includes(status)) {
    return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
  }

  const query = 'UPDATE product SET status = ? WHERE id = ?';
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการอัพเดทสถานะสินค้า:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }

    db.query(
      'SELECT id, name, price, category_id, image_url, status FROM product WHERE id = ?',
      [id],
      (selectErr, selectResults) => {
        if (selectErr) {
          return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
        }
        res.json(selectResults[0]);
      });
  });
});

/**
 * ============================
 * API เกี่ยวกับออเดอร์ (Orders)
 * ============================
 */

// สร้างออเดอร์
app.post('/api/order', (req, res) => {
  const { tableId, items } = req.body;

  if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่ส่งมา'
    });
  }

  db.query(
    'SELECT id FROM `order` WHERE table_id = ? AND status = "A" ORDER BY id DESC LIMIT 1',
    [tableId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({
          error: 'เกิดข้อผิดพลาดในการค้นหาออเดอร์'
        });
      }

      if (!orders || orders.length === 0) {
        return res.status(404).json({
          error: 'ไม่พบออเดอร์ที่เปิดอยู่สำหรับโต๊ะนี้'
        });
      }

      const orderId = orders[0].id;

      // แก้ไข query ให้ตรงกับลำดับ columns ในตาราง
      const detailQuery = `
        INSERT INTO order_detail 
        (quantity, unit_price, status, order_id, product_id) 
        VALUES ?
      `;

      const orderDetails = items.map(item => [
        item.quantity,
        Number(item.price),
        'P',
        orderId,
        item.id
      ]);

      db.query(detailQuery, [orderDetails], (detailErr) => {
        if (detailErr) {
          console.error('Error inserting order details:', detailErr);
          return res.status(500).json({
            error: 'เกิดข้อผิดพลาดในการบันทึกรายการอาหาร'
          });
        }

        res.status(201).json({
          success: true,
          orderId,
          message: 'สั่งอาหารสำเร็จ'
        });
      });
    }
  );
});

// ประวัติการสั่งอาหาร
app.get('/api/order/:tableId', (req, res) => {
  const tableId = req.params.tableId;

  const query = `
    SELECT 
      o.id as orderId,
      o.start_time as date,      
      o.status as orderStatus,
      od.id as orderDetailId,
      od.quantity,
      od.unit_price as price,
      od.status as itemStatus,
      od.order_time,
      p.name as productName
    FROM \`order\` o
    JOIN order_detail od ON o.id = od.order_id
    JOIN product p ON od.product_id = p.id
    WHERE o.table_id = ?
    ORDER BY o.start_time DESC, od.order_time ASC
  `;

  db.query(query, [tableId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์'
      });
    }

    if (!results || results.length === 0) {
      return res.json([]);
    }

    const orders = [];
    const orderMap = new Map();

    results.forEach(row => {
      if (!orderMap.has(row.orderId)) {
        orderMap.set(row.orderId, {
          orderId: row.orderId,
          date: row.date,
          status: row.orderStatus,
          items: []
        });
        orders.push(orderMap.get(row.orderId));
      }

      const currentOrder = orderMap.get(row.orderId);
      currentOrder.items.push({
        orderDetailId: row.orderDetailId,
        productName: row.productName,
        quantity: row.quantity,
        price: parseFloat(row.price),
        orderTime: row.order_time,
        status: row.itemStatus
      });
    });

    res.json(orders);
  });
});

/**
 * ============================
 * API เกี่ยวกับรายละเอียดออเดอร์ (Order Details)
 * ============================
 */

// อัพเดทสถานะรายการอาหาร
app.patch('/api/order-detail/:id/status', (req, res) => {
  const detailId = req.params.id;
  const { status, cancel_reason_id } = req.body;

  // ตรวจสอบความถูกต้องของข้อมูล
  if (!detailId) {
    return res.status(400).json({ error: 'ต้องระบุรหัสรายการอาหาร' });
  }

  if (!['A', 'C', 'V'].includes(status)) {
    return res.status(400).json({ error: 'สถานะไม่ถูกต้อง กรุณาระบุ A, C หรือ V' });
  }

  // ตรวจสอบว่าถ้าเป็นการยกเลิก (V) ต้องมีเหตุผลการยกเลิก
  if (status === 'V' && !cancel_reason_id) {
    return res.status(400).json({ error: 'กรุณาระบุเหตุผลในการยกเลิก' });
  }

  // สร้าง query สำหรับอัพเดทสถานะ
  let query = 'UPDATE order_detail SET status = ?';
  let params = [status];

  // ถ้าเป็นการยกเลิก ให้อัพเดทเหตุผลการยกเลิกด้วย
  if (status === 'V' && cancel_reason_id) {
    query += ', cancel_reason_id = ?';
    params.push(cancel_reason_id);
  }

  // เพิ่ม id เป็น parameter สุดท้าย
  query += ' WHERE id = ?';
  params.push(detailId);

  // อัพเดทสถานะรายการอาหาร
  db.query(query, params, (err, result) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการอัพเดทสถานะรายการอาหาร:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบรายการอาหารที่ต้องการอัพเดท' });
    }

    // เมื่ออัพเดทสำเร็จ ส่งข้อมูลกลับไป
    const response = {
      id: detailId,
      status,
      message: 'อัพเดทสถานะรายการอาหารสำเร็จ'
    };

    // ถ้าเป็นการยกเลิก ให้ส่งข้อมูลเหตุผลกลับไปด้วย
    if (status === 'V' && cancel_reason_id) {
      response.cancel_reason_id = cancel_reason_id;
    }

    res.json(response);
  });
});

//================================================================================================================================================================

// /**
//  * ============================
//  * API เกี่ยวกับหมวดหมู่ (Categories)
//  * ============================
//  */

// // ดึงข้อมูล category
// app.get('/api/category', (req, res) => {
//   db.query('SELECT * FROM category ORDER BY id', (err, results) => {
//     if (err) {
//       console.error('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:', err);
//       res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
//       return;
//     }
//     res.json(results);
//   });
// });
//================================================================================================================================================================

/**
 * ============================
 * API เกี่ยวกับหมวดหมู่ (Categories)
 * ============================
 */

// ดึงข้อมูล category ทั้งหมด
app.get('/api/category', (req, res) => {
  db.query('SELECT * FROM category ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:', err);
      res.status(500).json({ error: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
      return;
    }
    res.json(results);
  });
});

// เพิ่มหมวดหมู่ใหม่
app.post('/api/category', (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุชื่อหมวดหมู่' });
  }

  db.query(
    'INSERT INTO category (name) VALUES (?)',
    [name],
    (err, result) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่:', err);
        return res.status(500).json({ error: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
      }

      const newCategory = {
        id: result.insertId,
        name,
        created_at: new Date(),
        updated_at: new Date()
      };

      res.status(201).json(newCategory);
    }
  );
});

// ดึงข้อมูลหมวดหมู่ตาม ID
app.get('/api/category/:id', (req, res) => {
  const categoryId = req.params.id;

  db.query(
    'SELECT * FROM category WHERE id = ?',
    [categoryId],
    (err, results) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:', err);
        return res.status(500).json({ error: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'ไม่พบหมวดหมู่ที่ต้องการ' });
      }

      res.json(results[0]);
    }
  );
});

// แก้ไขหมวดหมู่
app.put('/api/category/:id', (req, res) => {
  const categoryId = req.params.id;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'กรุณาระบุชื่อหมวดหมู่' });
  }

  db.query(
    'UPDATE category SET name = ? WHERE id = ?',
    [name, categoryId],
    (err, result) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่:', err);
        return res.status(500).json({ error: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'ไม่พบหมวดหมู่ที่ต้องการแก้ไข' });
      }

      res.json({
        id: parseInt(categoryId),
        name,
        updated_at: new Date()
      });
    }
  );
});

// ลบหมวดหมู่
app.delete('/api/category/:id', (req, res) => {
  const categoryId = req.params.id;

  // ตรวจสอบก่อนว่ามีสินค้าที่ใช้หมวดหมู่นี้หรือไม่
  db.query(
    'SELECT COUNT(*) as count FROM product WHERE category_id = ?',
    [categoryId],
    (err, results) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการตรวจสอบการใช้งานหมวดหมู่:', err);
        return res.status(500).json({ error: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
      }

      if (results[0].count > 0) {
        return res.status(400).json({
          error: 'ไม่สามารถลบหมวดหมู่ได้เนื่องจากมีสินค้าที่ใช้หมวดหมู่นี้อยู่',
          productsCount: results[0].count
        });
      }

      // หากไม่มีสินค้าใช้หมวดหมู่นี้ ดำเนินการลบได้
      db.query(
        'DELETE FROM category WHERE id = ?',
        [categoryId],
        (err, result) => {
          if (err) {
            console.error('เกิดข้อผิดพลาดในการลบหมวดหมู่:', err);
            return res.status(500).json({ error: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'ไม่พบหมวดหมู่ที่ต้องการลบ' });
          }

          res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
        }
      );
    }
  );
});

/**
 * ============================
 * API เกี่ยวกับการชำระเงิน (Payment)
 * ============================
 */

// คิดเงินและปิดโต๊ะ (อัพเดต)
app.post('/api/checkout/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  const { paymentMethod } = req.body; // เราจะยังคงรับ parameter นี้ไว้ แต่ไม่จำเป็นต้องส่งมา

  try {
    // เริ่ม transaction
    await db.promise().query('START TRANSACTION');

    // 1. ดึงข้อมูลออเดอร์และโต๊ะ
    const [orderData] = await db.promise().query(
      `SELECT o.*, dt.id AS table_id 
        FROM \`order\` o
        JOIN dining_table dt ON o.table_id = dt.id
        WHERE o.id = ? AND o.status = 'A'`,
      [orderId]
    );

    if (orderData.length === 0) {
      await db.promise().query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'ไม่พบออเดอร์ที่ต้องการชำระเงิน หรือออเดอร์ถูกชำระแล้ว'
      });
    }

    const tableId = orderData[0].table_id;

    // 2. ดึงรายการอาหารทั้งหมดในออเดอร์
    const [orderItems] = await db.promise().query(
      `SELECT od.*, p.name as product_name
        FROM order_detail od
        JOIN product p ON od.product_id = p.id
        WHERE od.order_id = ? AND od.status != 'V'`,
      [orderId]
    );

    // 3. คำนวณยอดรวม
    let totalAmount = 0;
    for (const item of orderItems) {
      totalAmount += item.quantity * item.unit_price;
    }

    // 4. อัพเดทสถานะออเดอร์เป็นเสร็จสิ้น
    await db.promise().query(
      `UPDATE \`order\` 
        SET status = 'C', end_time = CURRENT_TIMESTAMP 
        WHERE id = ?`,
      [orderId]
    );

    // 5. อัพเดทสถานะโต๊ะเป็นว่าง
    await db.promise().query(
      'UPDATE dining_table SET status_id = 1 WHERE id = ?',
      [tableId]
    );

    // 6. บันทึกข้อมูลการชำระเงิน (กำหนดสถานะเป็น Success เสมอ)
    await db.promise().query(
      `INSERT INTO payment 
        (order_id, amount, payment_method, payment_date, status) 
        VALUES (?, ?, 'ชำระแล้ว', CURRENT_TIMESTAMP, 'S')`,
      [orderId, totalAmount]
    );

    // 7. บันทึก transaction
    await db.promise().query('COMMIT');

    // 8. ส่งผลลัพธ์กลับ
    res.json({
      success: true,
      orderId,
      tableId,
      totalAmount,
      items: orderItems,
      message: 'ชำระเงินสำเร็จ'
    });

  } catch (error) {
    // กรณีเกิดข้อผิดพลาด
    await db.promise().query('ROLLBACK');
    console.error('Error during checkout:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการชำระเงิน'
    });
  }
});

// API สำหรับคำนวณยอดรวมของออเดอร์ (สำหรับแสดงบิล)
app.get('/api/order/:orderId/bill', async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // ดึงข้อมูลรายการอาหารทั้งหมดในออเดอร์
    const [orderItems] = await db.promise().query(
      `SELECT od.*, p.name as product_name
        FROM order_detail od
        JOIN product p ON od.product_id = p.id
        WHERE od.order_id = ? AND od.status != 'V'
        ORDER BY od.order_time`,
      [orderId]
    );

    // ดึงข้อมูลโต๊ะและเวลาเริ่มต้น
    const [orderInfo] = await db.promise().query(
      `SELECT o.*, dt.table_number 
        FROM \`order\` o
        JOIN dining_table dt ON o.table_id = dt.id
        WHERE o.id = ?`,
      [orderId]
    );

    if (orderInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลออเดอร์'
      });
    }

    // คำนวณยอดรวม
    let totalAmount = 0;
    const items = orderItems.map(item => {
      const amount = item.quantity * item.unit_price;
      totalAmount += amount;
      return {
        id: item.id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: amount,
        status: item.status
      };
    });

    // ลบการคำนวณภาษีมูลค่าเพิ่ม
    res.json({
      success: true,
      orderId,
      tableNumber: orderInfo[0].table_number,
      startTime: orderInfo[0].start_time,
      items,
      totalAmount,
      status: orderInfo[0].status
    });

  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างบิล'
    });
  }
});

// API สำหรับดึงประวัติการชำระเงิน
app.get('/api/payments', async (req, res) => {
  try {
    const [payments] = await db.promise().query(
      `SELECT p.*, o.table_id, dt.table_number, o.status AS order_status
        FROM payment p
        JOIN \`order\` o ON p.order_id = o.id
        JOIN dining_table dt ON o.table_id = dt.id
        ORDER BY p.payment_date DESC`
    );

    res.json(payments);

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน'
    });
  }
});

// API สำหรับพิมพ์ใบเสร็จ (อาจรวมกับ bill API ก็ได้)
app.get('/api/receipt/:paymentId', async (req, res) => {
  const paymentId = req.params.paymentId;

  try {
    // ดึงข้อมูลการชำระเงิน
    const [payments] = await db.promise().query(
      `SELECT p.*, o.start_time, o.end_time, dt.table_number
        FROM payment p
        JOIN \`order\` o ON p.order_id = o.id
        JOIN dining_table dt ON o.table_id = dt.id
        WHERE p.id = ?`,
      [paymentId]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการชำระเงิน'
      });
    }

    const payment = payments[0];

    // ดึงรายการสินค้าในออเดอร์
    const [items] = await db.promise().query(
      `SELECT od.*, p.name as product_name
        FROM order_detail od
        JOIN product p ON od.product_id = p.id
        WHERE od.order_id = ? AND od.status != 'V'`,
      [payment.order_id]
    );

    res.json({
      success: true,
      payment,
      items,
      receiptNumber: `R${payment.id.toString().padStart(6, '0')}`,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างใบเสร็จ'
    });
  }
});

app.post('/api/order-detail', async (req, res) => {
  const { order_id, product_id, quantity, unit_price } = req.body;

  if (!order_id || !product_id || !quantity || !unit_price) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาระบุข้อมูลให้ครบถ้วน'
    });
  }

  try {
    // ตรวจสอบว่าออเดอร์ยังเปิดอยู่หรือไม่
    const [orderCheck] = await db.promise().query(
      `SELECT id FROM \`order\` WHERE id = ? AND status = 'A'`,
      [order_id]
    );

    if (orderCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบออเดอร์ที่เปิดอยู่'
      });
    }

    // เพิ่มรายการใหม่
    const [result] = await db.promise().query(
      `INSERT INTO order_detail 
        (order_id, product_id, quantity, unit_price, status, order_time) 
        VALUES (?, ?, ?, ?, 'P', CURRENT_TIMESTAMP)`,
      [order_id, product_id, quantity, unit_price]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'เพิ่มรายการอาหารสำเร็จ'
    });

  } catch (error) {
    console.error('Error adding order item:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มรายการอาหาร'
    });
  }
});

/**
 * ดึงข้อมูลเหตุผลในการยกเลิกรายการอาหาร
 */
app.get('/api/cancel-reasons', (req, res) => {
  db.query('SELECT * FROM cancel_reason ORDER BY id', (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลเหตุผลการยกเลิก:', err);
      return res.status(500).json({ error: 'ข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
    res.json(results);
  });
});

/**
 * ============================
 * API เกี่ยวกับการจัดการโต๊ะ (ย้าย, รวม, ยกเลิก)
 * ============================
 */

// ย้ายโต๊ะ (ย้ายออเดอร์ไปยังโต๊ะใหม่)
app.post('/api/tables/move', async (req, res) => {
  const { sourceTableId, targetTableId } = req.body;

  if (!sourceTableId || !targetTableId) {
    return res.status(400).json({ 
      success: false, 
      message: 'กรุณาระบุรหัสโต๊ะต้นทางและปลายทาง' 
    });
  }

  try {
    // เริ่ม transaction
    await db.promise().query('START TRANSACTION');

    // 1. ตรวจสอบว่าโต๊ะปลายทางว่างอยู่หรือไม่
    const [targetTable] = await db.promise().query(
      'SELECT * FROM dining_table WHERE id = ? AND status_id = 1',
      [targetTableId]
    );

    if (targetTable.length === 0) {
      await db.promise().query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'โต๊ะปลายทางไม่ว่าง ไม่สามารถย้ายได้'
      });
    }

    // 2. ดึงออเดอร์ที่เปิดอยู่ของโต๊ะต้นทาง
    const [activeOrders] = await db.promise().query(
      'SELECT * FROM `order` WHERE table_id = ? AND status = "A"',
      [sourceTableId]
    );

    if (activeOrders.length === 0) {
      await db.promise().query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'ไม่พบออเดอร์ที่เปิดอยู่สำหรับโต๊ะต้นทาง'
      });
    }

    const orderId = activeOrders[0].id;

    // 3. อัพเดทออเดอร์ไปยังโต๊ะใหม่
    await db.promise().query(
      'UPDATE `order` SET table_id = ? WHERE id = ?',
      [targetTableId, orderId]
    );

    // 4. อัพเดทสถานะโต๊ะต้นทางเป็นว่าง
    await db.promise().query(
      'UPDATE dining_table SET status_id = 1 WHERE id = ?',
      [sourceTableId]
    );

    // 5. อัพเดทสถานะโต๊ะปลายทางเป็นไม่ว่าง
    await db.promise().query(
      'UPDATE dining_table SET status_id = 2 WHERE id = ?',
      [targetTableId]
    );

    // บันทึก transaction
    await db.promise().query('COMMIT');

    res.json({
      success: true,
      message: 'ย้ายโต๊ะสำเร็จ',
      sourceTableId,
      targetTableId,
      orderId
    });

  } catch (error) {
    await db.promise().query('ROLLBACK');
    console.error('Error moving table:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการย้ายโต๊ะ'
    });
  }
});

// รวมโต๊ะ (รวมออเดอร์สองโต๊ะ)
app.post('/api/tables/merge', async (req, res) => {
  const { sourceTableId, targetTableId } = req.body;

  if (!sourceTableId || !targetTableId) {
    return res.status(400).json({ 
      success: false, 
      message: 'กรุณาระบุรหัสโต๊ะทั้งสอง' 
    });
  }

  try {
    // เริ่ม transaction
    await db.promise().query('START TRANSACTION');

    // 1. ตรวจสอบว่าทั้งสองโต๊ะมีออเดอร์ที่เปิดอยู่
    const [sourceOrders] = await db.promise().query(
      'SELECT * FROM `order` WHERE table_id = ? AND status = "A"',
      [sourceTableId]
    );

    const [targetOrders] = await db.promise().query(
      'SELECT * FROM `order` WHERE table_id = ? AND status = "A"',
      [targetTableId]
    );

    if (sourceOrders.length === 0 || targetOrders.length === 0) {
      await db.promise().query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'ทั้งสองโต๊ะต้องมีออเดอร์ที่เปิดอยู่'
      });
    }

    const sourceOrderId = sourceOrders[0].id;
    const targetOrderId = targetOrders[0].id;

    // 2. ย้ายรายการอาหารทั้งหมดจากต้นทางไปปลายทาง
    await db.promise().query(
      'UPDATE order_detail SET order_id = ? WHERE order_id = ?',
      [targetOrderId, sourceOrderId]
    );

    // 3. ปิดออเดอร์ของโต๊ะต้นทาง (แต่ไม่ชำระเงิน)
    await db.promise().query(
      'UPDATE `order` SET status = "M", end_time = CURRENT_TIMESTAMP WHERE id = ?',
      [sourceOrderId]
    );

    // 4. เพิ่มบันทึกการรวมโต๊ะ (สร้างตาราง merge_log ก่อนใช้งาน)
    try {
      await db.promise().query(
        'INSERT INTO merge_log (source_order_id, target_order_id, merge_time) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [sourceOrderId, targetOrderId]
      );
    } catch (logError) {
      // ถ้าไม่มีตาราง merge_log ก็ข้ามขั้นตอนนี้ไป
      console.log('Merge log table does not exist, skipping log:', logError);
    }

    // 5. อัพเดทสถานะโต๊ะต้นทางเป็นว่าง
    await db.promise().query(
      'UPDATE dining_table SET status_id = 1 WHERE id = ?',
      [sourceTableId]
    );

    // บันทึก transaction
    await db.promise().query('COMMIT');

    res.json({
      success: true,
      message: 'รวมโต๊ะสำเร็จ',
      sourceTableId,
      targetTableId,
      sourceOrderId,
      targetOrderId
    });

  } catch (error) {
    await db.promise().query('ROLLBACK');
    console.error('Error merging tables:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการรวมโต๊ะ'
    });
  }
});

// ยกเลิกโต๊ะ (ยกเลิกออเดอร์และปิดโต๊ะ)
app.post('/api/tables/cancel', async (req, res) => {
  const { tableId } = req.body;

  if (!tableId) {
    return res.status(400).json({ 
      success: false, 
      message: 'กรุณาระบุรหัสโต๊ะ' 
    });
  }

  try {
    // เริ่ม transaction
    await db.promise().query('START TRANSACTION');

    // 1. ตรวจสอบว่าโต๊ะมีออเดอร์ที่เปิดอยู่
    const [activeOrders] = await db.promise().query(
      'SELECT * FROM `order` WHERE table_id = ? AND status = "A"',
      [tableId]
    );

    if (activeOrders.length === 0) {
      await db.promise().query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'ไม่พบออเดอร์ที่เปิดอยู่สำหรับโต๊ะนี้'
      });
    }

    const orderId = activeOrders[0].id;

    // 2. ยกเลิกรายการอาหารที่ยังไม่เสร็จทั้งหมด
    await db.promise().query(
      'UPDATE order_detail SET status = "V" WHERE order_id = ? AND status IN ("A", "P")',
      [orderId]
    );

    // 3. อัพเดทสถานะออเดอร์เป็นยกเลิก
    await db.promise().query(
      'UPDATE `order` SET status = "X", end_time = CURRENT_TIMESTAMP WHERE id = ?',
      [orderId]
    );

    // 4. อัพเดทสถานะโต๊ะเป็นว่าง
    await db.promise().query(
      'UPDATE dining_table SET status_id = 1 WHERE id = ?',
      [tableId]
    );

    // บันทึก transaction
    await db.promise().query('COMMIT');

    res.json({
      success: true,
      message: 'ยกเลิกโต๊ะสำเร็จ',
      tableId,
      orderId
    });

  } catch (error) {
    await db.promise().query('ROLLBACK');
    console.error('Error canceling table:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยกเลิกโต๊ะ'
    });
  }
});

// สร้างตาราง merge_log ถ้ายังไม่มี
app.post('/api/system/create-merge-log-table', async (req, res) => {
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS merge_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_order_id INT NOT NULL,
        target_order_id INT NOT NULL,
        merge_time TIMESTAMP NOT NULL,
        FOREIGN KEY (source_order_id) REFERENCES \`order\`(id),
        FOREIGN KEY (target_order_id) REFERENCES \`order\`(id)
      )
    `);
    
    res.json({
      success: true,
      message: 'Created merge_log table'
    });
  } catch (error) {
    console.error('Error creating merge_log table:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างตาราง merge_log'
    });
  }
});

// สร้างตาราง cancellation_log ถ้ายังไม่มี
app.post('/api/system/create-cancellation-log-table', async (req, res) => {
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS cancellation_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        reason TEXT NOT NULL,
        cancel_time TIMESTAMP NOT NULL,
        FOREIGN KEY (order_id) REFERENCES \`order\`(id)
      )
    `);
    
    res.json({
      success: true,
      message: 'Created cancellation_log table'
    });
  } catch (error) {
    console.error('Error creating cancellation_log table:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างตาราง cancellation_log'
    });
  }
});

/**
 * ============================
 * API เกี่ยวกับคำขอบริการลูกค้า (Service Requests)
 * ============================
 */

// สร้างตาราง service_requests หากยังไม่มี
app.post('/api/system/create-service-requests-table', async (req, res) => {
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_id INT NOT NULL,
        order_id INT NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        note TEXT,
        status ENUM('pending', 'in-progress', 'completed', 'canceled') DEFAULT 'pending',
        request_time TIMESTAMP NOT NULL,
        complete_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES dining_table(id),
        FOREIGN KEY (order_id) REFERENCES \`order\`(id)
      )
    `);
    
    res.json({
      success: true,
      message: 'Created service_requests table'
    });
  } catch (error) {
    console.error('Error creating service_requests table:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างตาราง service_requests'
    });
  }
});

// สร้างคำขอบริการใหม่
app.post('/api/service-requests', async (req, res) => {
  const { tableId, orderId, serviceType, note, requestTime } = req.body;

  if (!tableId || !orderId || !serviceType) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาระบุข้อมูลให้ครบถ้วน'
    });
  }

  try {
    // ตรวจสอบว่าโต๊ะและออเดอร์มีอยู่จริง
    const [tableCheck] = await db.promise().query(
      'SELECT id FROM dining_table WHERE id = ?',
      [tableId]
    );

    const [orderCheck] = await db.promise().query(
      'SELECT id FROM `order` WHERE id = ? AND status = "A"',
      [orderId]
    );

    if (tableCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลโต๊ะที่ระบุ'
      });
    }

    if (orderCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลออเดอร์ที่ระบุหรือออเดอร์ไม่ได้มีสถานะเปิดใช้งาน'
      });
    }

    // บันทึกคำขอบริการ
    const [result] = await db.promise().query(
      `INSERT INTO service_requests 
        (table_id, order_id, service_type, note, request_time) 
        VALUES (?, ?, ?, ?, ?)`,
      [tableId, orderId, serviceType, note || null, requestTime || new Date()]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'บันทึกคำขอบริการเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกคำขอบริการ'
    });
  }
});

// ดึงข้อมูลคำขอบริการตามโต๊ะ
app.get('/api/service-requests', async (req, res) => {
  const { tableId, status } = req.query;

  try {
    let query = `
      SELECT sr.*, dt.table_number
      FROM service_requests sr
      JOIN dining_table dt ON sr.table_id = dt.id
    `;

    const queryParams = [];

    // เพิ่มเงื่อนไขการค้นหา
    if (tableId) {
      query += ' WHERE sr.table_id = ?';
      queryParams.push(tableId);
      
      if (status) {
        query += ' AND sr.status = ?';
        queryParams.push(status);
      }
    } else if (status) {
      query += ' WHERE sr.status = ?';
      queryParams.push(status);
    }

    // เรียงลำดับตามเวลาล่าสุด
    query += ' ORDER BY sr.request_time DESC';

    const [results] = await db.promise().query(query, queryParams);

    res.json(results);

  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอบริการ'
    });
  }
});

// อัพเดตสถานะคำขอบริการ
app.patch('/api/service-requests/:id/status', async (req, res) => {
  const requestId = req.params.id;
  const { status, note } = req.body;

  if (!requestId || !status) {
    return res.status(400).json({
      success: false,
      message: 'กรุณาระบุรหัสคำขอและสถานะใหม่'
    });
  }

  // ตรวจสอบค่าสถานะ
  const validStatuses = ['pending', 'in-progress', 'completed', 'canceled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'สถานะไม่ถูกต้อง'
    });
  }

  try {
    // อัพเดตสถานะ
    const updateData = {
      status,
      note: note || null
    };

    // เพิ่มเวลาเสร็จสิ้นถ้าสถานะเป็น completed
    if (status === 'completed') {
      updateData.complete_time = new Date();
    }

    const query = `
      UPDATE service_requests 
      SET ? 
      WHERE id = ?
    `;

    const [result] = await db.promise().query(query, [updateData, requestId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบคำขอบริการที่ระบุ'
      });
    }

    // ดึงข้อมูลคำขอที่อัพเดตแล้ว
    const [updatedRequest] = await db.promise().query(
      'SELECT * FROM service_requests WHERE id = ?',
      [requestId]
    );

    res.json({
      success: true,
      data: updatedRequest[0],
      message: 'อัพเดตสถานะคำขอบริการเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error updating service request status:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดตสถานะคำขอบริการ'
    });
  }
});

// API สำหรับดึงข้อมูลบิลที่ถูกยกเลิก
app.get('/api/canceled-orders', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    let query = `
      SELECT o.*, dt.table_number
      FROM \`order\` o
      JOIN dining_table dt ON o.table_id = dt.id
      WHERE o.status = 'X'
    `;
    
    const queryParams = [];
    
    // เพิ่มเงื่อนไขการกรองตามวันที่
    if (startDate && endDate) {
      query += ` AND o.end_time BETWEEN ? AND ?`;
      queryParams.push(startDate, endDate);
    }
    
    query += ` ORDER BY o.end_time DESC`;
    
    const [canceledOrders] = await db.promise().query(query, queryParams);
    
    // สำหรับแต่ละออเดอร์ที่ถูกยกเลิก ให้ดึงรายละเอียดด้วย
    for (const order of canceledOrders) {
      const [orderDetails] = await db.promise().query(
        `SELECT od.*, p.name as product_name
         FROM order_detail od
         JOIN product p ON od.product_id = p.id
         WHERE od.order_id = ?`,
        [order.id]
      );
      
      // คำนวณยอดรวมจากรายการทั้งหมด
      let totalAmount = 0;
      orderDetails.forEach(item => {
        if (item.status !== 'V') { // นับเฉพาะรายการที่ไม่ได้ถูกยกเลิก
          totalAmount += item.quantity * item.unit_price;
        }
      });
      
      order.items = orderDetails;
      order.totalAmount = totalAmount;
    }
    
    res.json(canceledOrders);
    
  } catch (error) {
    console.error('Error fetching canceled orders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบิลที่ถูกยกเลิก'
    });
  }
});

/**
 * API สำหรับดึงประวัติบิลทั้งหมด (ทั้งที่ชำระแล้วและที่ยกเลิก)
 */
app.get('/api/bill-history', async (req, res) => {
  const { startDate, endDate, status } = req.query;

  try {
    // 1. ดึงข้อมูลบิลที่ชำระแล้วจากตาราง payment
    const paymentQuery = `
      SELECT 
        p.id,  
        p.order_id, 
        p.amount, 
        p.payment_method, 
        p.payment_date, 
        p.status AS payment_status,
        o.status AS order_status,
        o.start_time,
        o.end_time,
        dt.table_number
      FROM payment p
      JOIN \`order\` o ON p.order_id = o.id
      JOIN dining_table dt ON o.table_id = dt.id
    `;

    let paymentParams = [];
    
    // เพิ่มเงื่อนไขการกรองตามวันที่สำหรับ payment
    let paymentDateFilter = '';
    if (startDate && endDate) {
      paymentDateFilter = ' WHERE p.payment_date BETWEEN ? AND ?';
      paymentParams.push(startDate, endDate);
    }

    // ดึงข้อมูลการชำระเงิน
    const [paymentResults] = await db.promise().query(
      paymentQuery + paymentDateFilter, 
      paymentParams
    );

    // 2. ดึงข้อมูลบิลที่ถูกยกเลิกจากตาราง order (เฉพาะที่ไม่มีในตาราง payment)
    const canceledQuery = `
      SELECT 
        o.id AS order_id,
        NULL AS id,
        0 AS amount,
        'ยกเลิก' AS payment_method,
        o.end_time AS payment_date,
        'X' AS payment_status,
        o.status AS order_status,
        o.start_time,
        o.end_time,
        dt.table_number
      FROM \`order\` o
      JOIN dining_table dt ON o.table_id = dt.id
      LEFT JOIN payment p ON o.id = p.order_id
      WHERE o.status = 'X' AND p.id IS NULL
    `;

    let canceledParams = [];
    
    // เพิ่มเงื่อนไขการกรองตามวันที่สำหรับออเดอร์ที่ยกเลิก
    let canceledDateFilter = '';
    if (startDate && endDate) {
      canceledDateFilter = ' AND o.end_time BETWEEN ? AND ?';
      canceledParams.push(startDate, endDate);
    }

    // ดึงข้อมูลออเดอร์ที่ถูกยกเลิก
    const [canceledResults] = await db.promise().query(
      canceledQuery + canceledDateFilter,
      canceledParams
    );

    // 3. รวมผลลัพธ์ทั้งสองชุด
    let allBills = [...paymentResults, ...canceledResults];

    // 4. กรองตามสถานะที่ต้องการ (ถ้ามีการระบุ)
    if (status && status !== 'all') {
      if (status === 'completed') {
        allBills = allBills.filter(bill => bill.order_status === 'C');
      } else if (status === 'canceled') {
        allBills = allBills.filter(bill => bill.order_status === 'X');
      }
    }

    // 5. เรียงลำดับตามวันที่ล่าสุด
    allBills.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    res.json(allBills);

  } catch (error) {
    console.error('Error fetching bill history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติบิล'
    });
  }
});

// API สำหรับดึงประวัติการใช้งานโต๊ะทั้งหมด (รวมถึงโต๊ะที่ไม่ใช้งานแล้ว)
app.get('/api/table-history', async (req, res) => {
  try {
    // ค้นหาสถานะ "ไม่ใช้งาน"
    const [statusResults] = await db.promise().query(
      'SELECT id, name FROM table_status WHERE name = ?',
      ['ไม่ใช้งาน'] // หรือชื่อสถานะที่คุณเพิ่ม
    );
    
    const inactiveStatusId = statusResults.length > 0 ? statusResults[0].id : -1;
    const inactiveStatusName = statusResults.length > 0 ? statusResults[0].name : 'ไม่ใช้งาน';
    
    // ดึงข้อมูลออเดอร์ทั้งหมดพร้อมข้อมูลโต๊ะ
    const query = `
      SELECT 
        o.id AS order_id,
        o.start_time,
        o.end_time,
        o.status AS order_status,
        dt.id AS table_id,
        dt.table_number,
        dt.status_id,
        ts.name AS table_status_name,
        p.id AS payment_id,
        p.amount AS payment_amount,
        p.payment_date,
        p.status AS payment_status
      FROM \`order\` o
      JOIN dining_table dt ON o.table_id = dt.id
      JOIN table_status ts ON dt.status_id = ts.id
      LEFT JOIN payment p ON o.id = p.order_id
      ORDER BY o.start_time DESC
    `;
    
    const [results] = await db.promise().query(query);
    
    // จัดกลุ่มข้อมูลตามโต๊ะ
    const tableHistory = {};
    
    results.forEach(row => {
      const tableNumber = row.table_number;
      
      if (!tableHistory[tableNumber]) {
        tableHistory[tableNumber] = {
          tableId: row.table_id,
          tableNumber: tableNumber,
          statusId: row.status_id,
          statusName: row.table_status_name,
          isInactive: row.status_id === inactiveStatusId,
          orders: []
        };
      }
      
      // ตรวจสอบว่าออเดอร์นี้มีอยู่ในรายการแล้วหรือไม่
      const existingOrder = tableHistory[tableNumber].orders.find(o => o.orderId === row.order_id);
      
      if (!existingOrder) {
        // เพิ่มข้อมูลออเดอร์
        const order = {
          orderId: row.order_id,
          startTime: row.start_time,
          endTime: row.end_time,
          status: row.order_status
        };
        
        // เพิ่มข้อมูลการชำระเงิน (ถ้ามี)
        if (row.payment_id) {
          order.payment = {
            paymentId: row.payment_id,
            amount: row.payment_amount,
            paymentDate: row.payment_date,
            status: row.payment_status
          };
        }
        
        tableHistory[tableNumber].orders.push(order);
      }
    });
    
    // แปลงข้อมูลจาก object เป็น array
    const response = Object.values(tableHistory);
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching table history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติการใช้งานโต๊ะ'
    });
  }
});

// API สำหรับดึงประวัติการใช้งานของโต๊ะเฉพาะหมายเลข
app.get('/api/table-history/:tableNumber', async (req, res) => {
  const tableNumber = req.params.tableNumber;
  
  try {
    // ดึงข้อมูลโต๊ะ
    const [tableInfo] = await db.promise().query(
      `SELECT dt.*, ts.name AS status_name 
        FROM dining_table dt
        JOIN table_status ts ON dt.status_id = ts.id
        หWHERE dt.table_number = ?`,
      [tableNumber]
    );
    
    if (tableInfo.length === 0) {
      // ถ้าไม่พบโต๊ะในฐานข้อมูล
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลโต๊ะที่ระบุ'
      });
    }
    
    // ดึงประวัติการใช้งานโต๊ะ (ออเดอร์และการชำระเงิน)
    const query = `
      SELECT 
        o.id AS order_id,
        o.start_time,
        o.end_time,
        o.status AS order_status,
        p.id AS payment_id,
        p.amount AS payment_amount,
        p.payment_date,
        p.payment_method,
        p.status AS payment_status
      FROM \`order\` o
      JOIN dining_table dt ON o.table_id = dt.id
      LEFT JOIN payment p ON o.id = p.order_id
      WHERE dt.table_number = ?
      ORDER BY o.start_time DESC
    `;
    
    const [orderHistory] = await db.promise().query(query, [tableNumber]);
    
    // สร้างรายการออเดอร์พร้อมรายละเอียด
    const orders = [];
    const orderMap = new Map();
    
    for (const row of orderHistory) {
      if (!orderMap.has(row.order_id)) {
        const order = {
          orderId: row.order_id,
          startTime: row.start_time,
          endTime: row.end_time,
          status: row.order_status,
          items: [] // จะเติมข้อมูลในขั้นตอนถัดไป
        };
        
        // เพิ่มข้อมูลการชำระเงิน (ถ้ามี)
        if (row.payment_id) {
          order.payment = {
            paymentId: row.payment_id,
            amount: row.payment_amount,
            paymentDate: row.payment_date,
            paymentMethod: row.payment_method,
            status: row.payment_status
          };
        }
        
        orderMap.set(row.order_id, order);
        orders.push(order);
      }
    }
    
    // ดึงรายละเอียดรายการอาหารสำหรับแต่ละออเดอร์
    for (const order of orders) {
      const [orderItems] = await db.promise().query(
        `SELECT od.*, p.name as product_name
         FROM order_detail od
         JOIN product p ON od.product_id = p.id
         WHERE od.order_id = ?`,
        [order.orderId]
      );
      
      order.items = orderItems.map(item => ({
        id: item.id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        status: item.status,
        orderTime: item.order_time
      }));
    }
    
    // สร้าง response ข้อมูลประวัติโต๊ะ
    const tableHistory = {
      tableNumber: tableNumber,
      tableId: tableInfo[0].id,
      statusId: tableInfo[0].status_id,
      statusName: tableInfo[0].status_name,
      isInactive: tableInfo[0].status_name === 'ไม่ใช้งาน', // หรือชื่อสถานะที่คุณเพิ่ม
      orders: orders
    };
    
    res.json(tableHistory);
    
  } catch (error) {
    console.error('Error fetching table history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติการใช้งานโต๊ะ'
    });
  }
});

/**
 * ============================
 * เริ่มการทำงานของเซิร์ฟเวอร์
 * ============================
 */

app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${PORT}`);
});
