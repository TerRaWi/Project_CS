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
const PORT = 3001;

// กำหนด middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// เชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '6101',
  database: 'posdb'
});

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
  const query = `
    SELECT dt.*, ts.name as status_name 
    FROM dining_table dt 
    JOIN table_status ts ON dt.status_id = ts.id 
    ORDER BY CAST(table_number AS SIGNED)
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโต๊ะ:', err);
      res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      return;
    }
    res.json(results);
  });
});

// สร้างโต๊ะ
app.post('/api/tables', (req, res) => {
  const { table_number, status_id } = req.body;

  if (!table_number) {
    return res.status(400).json({ error: 'ต้องระบุเบอร์โต๊ะ' });
  }

  // First check if table_number already exists
  db.query('SELECT id FROM dining_table WHERE table_number = ?', [table_number], (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบเบอร์โต๊ะ:', err);
      return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
    }

    if (results.length > 0) {
      return res.status(409).json({ error: 'เบอร์โต๊ะนี้มีอยู่แล้ว' });
    }

    // If table_number doesn't exist, insert new table
    db.query(
      'INSERT INTO dining_table (table_number, status_id) VALUES (?, ?)',
      [table_number, status_id],
      (err, result) => {
        if (err) {
          console.error('เกิดข้อผิดพลาดในการเพิ่มโต๊ะ:', err);
          res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
          return;
        }

        // Return the newly created table data
        const newTable = {
          id: result.insertId,
          table_number,
          status_id
        };

        res.json(newTable);
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

          // If table is available and has no active orders, proceed with deletion
          db.query(
            'DELETE FROM dining_table WHERE table_number = ?',
            [tableNumber],
            (err, result) => {
              if (err) {
                console.error('เกิดข้อผิดพลาดในการลบโต๊ะ:', err);
                return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
              }

              res.json({ message: 'ลบโต๊ะสำเร็จ' });
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
        'P',  // เปลี่ยนจาก 'A' เป็น 'P' สำหรับสถานะ "กำลังทำ"
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

  if (!['A', 'P', 'C', 'V'].includes(status)) {
    return res.status(400).json({ error: 'สถานะไม่ถูกต้อง กรุณาระบุ A, P, C หรือ V' });
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

/**
 * ============================
 * API เกี่ยวกับหมวดหมู่ (Categories)
 * ============================
 */

// ดึงข้อมูล category
app.get('/api/category', (req, res) => {
  db.query('SELECT * FROM category ORDER BY id', (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่:', err);
      res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      return;
    }
    res.json(results);
  });
});

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

// คิดเงินและปิดโต๊ะ
app.post('/api/checkout/:orderId', async (req, res) => {
  const orderId = req.params.orderId;
  const { paymentMethod } = req.body; // เช่น เงินสด, โอนเงิน, บัตรเครดิต

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

    // 6. บันทึกข้อมูลการชำระเงิน
    await db.promise().query(
      `INSERT INTO payment 
        (order_id, amount, payment_method, payment_date, status) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'S')`,
      [orderId, totalAmount, paymentMethod]
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
      `SELECT p.*, o.table_id, dt.table_number
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
 * เริ่มการทำงานของเซิร์ฟเวอร์
 * ============================
 */

app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${PORT}`);
});