const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// เพิ่มการ import multer เพื่อจัดการกับ file upload
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// การตั้งค่า multer สำหรับการอัปโหลดรูปภาพ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/') // สร้างโฟลเดอร์ uploads เพื่อเก็บรูปภาพ
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)) // ตั้งชื่อไฟล์แบบไม่ซ้ำกัน
  }
});

const upload = multer({ storage: storage });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '6101',
  database: 'posdb',
});

db.connect((err) => {
  if (err) {
    console.error('เชื่อมต่อ MySQL ไม่สำเร็จ:', err);
    return;
  }
  console.log('เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
});

//นำโต๊ะมาแสดงบน Page โต๊ะ
app.get('/api/customer', (req, res) => {
  db.query('SELECT * FROM customer', (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโต๊ะ:', err);
      res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      return;
    }
    res.json(results);
  });
});

//สร้างโต๊ะ
app.post('/api/customer', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ต้องระบุ ID ของโต๊ะ' });
  }

  db.query('INSERT INTO customer (id) VALUES (?)', [id], (err, result) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการเพิ่มโต๊ะ:', err);
      res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      return;
    }
    res.json({ id });
  });
});

// เปิดโต๊ะ
app.put('/api/customer/:id', (req, res) => {
  const { id } = req.params;
  const { adultCount, oldChildCount, childCount, count } = req.body;

  console.log('Received data:', req.body);

  if (!id) {
    return res.status(400).json({ error: 'ต้องระบุ ID ของโต๊ะ' });
  }

  const query = `
    UPDATE customer 
    SET adultCount = ?, oldChildCount = ?, childCount = ?, count = ?, status = 'A'
    WHERE id = ?
  `;

  db.query(query, [adultCount, oldChildCount, childCount, count, id], (err, result) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า:', err);
      res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      return;
    }
    console.log('Update result:', result);

    res.json({ id, adultCount, oldChildCount, childCount, count, status: 'A' });
  });
});

//ลบโต๊ะ
app.delete('/api/customer/:id', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ต้องระบุ ID ของโต๊ะ' });
  }

  // ตรวจสอบสถานะโต๊ะก่อนลบ
  db.query('SELECT * FROM customer WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบโต๊ะ:', err);
      return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบโต๊ะที่ต้องการลบ' });
    }

    // ตรวจสอบว่าโต๊ะมีคนนั่งอยู่หรือไม่
    if (results[0].status === 'A') {
      return res.status(400).json({ error: 'ไม่สามารถลบโต๊ะที่มีคนนั่งอยู่ได้' });
    }

    // ถ้าไม่มีคนนั่ง ดำเนินการลบโต๊ะ
    db.query('DELETE FROM customer WHERE id = ?', [id], (deleteErr, result) => {
      if (deleteErr) {
        console.error('เกิดข้อผิดพลาดในการลบโต๊ะ:', deleteErr);
        return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      }

      res.json({ id });
    });
  });
});

//นำเมนูมาแสดงบน Page จัดการเมนู
app.get('/api/product', (req, res) => {
  db.query('SELECT id, name, price, category_id, image_url FROM product', (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:', err);
      res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      return;
    }
    res.json(results);
  });
});

// เพิ่ม endpoint สำหรับเพิ่มสินค้าใหม่
app.post('/api/product', upload.single('image'), (req, res) => {
  const { name, price, category_id } = req.body;
  
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  const query = 'INSERT INTO product (name, price, category_id, image_url) VALUES (?, ?, ?, ?)';
  
  db.query(query, [name, price, category_id, image_url], (err, result) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า:', err);
      return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
    }
    
    res.status(201).json({ 
      id: result.insertId,
      name, 
      price, 
      category_id, 
      image_url 
    });
  });
});

 // เพิ่ม endpoint สำหรับลบสินค้า
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

// Add this endpoint in server.js
app.put('/api/product/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, price, category_id } = req.body;
  
  // Check if product exists
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

    // If new image is uploaded, delete old image
    if (req.file && oldImageUrl) {
      const oldImagePath = path.join(__dirname, oldImageUrl);
      fs.unlink(oldImagePath, (unlinkErr) => {
        if (unlinkErr && unlinkErr.code !== 'ENOENT') {
          console.error('เกิดข้อผิดพลาดในการลบรูปภาพเก่า:', unlinkErr);
        }
      });
    }

    // Update product in database
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

// เพิ่ม endpoint สำหรับสร้าง order
app.post('/api/order', (req, res) => {
  const { tableId, items } = req.body;
  
  // เริ่ม transaction
  db.beginTransaction(err => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการเริ่ม transaction:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง order' });
    }

    // สร้าง order ใหม่
    const orderQuery = `
      INSERT INTO \`order\` (customer_id, date, status)
      VALUES (?, NOW(), 'A')
    `;

    db.query(orderQuery, [tableId], (orderErr, orderResult) => {
      if (orderErr) {
        return db.rollback(() => {
          console.error('เกิดข้อผิดพลาดในการสร้าง order:', orderErr);
          res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง order' });
        });
      }

      const orderId = orderResult.insertId;
      const orderDetails = [];
      let detailId = 1; // เริ่มต้น ID ที่ 1

      // สร้างข้อมูลสำหรับ orderdetail
      items.forEach(item => {
        orderDetails.push([
          detailId++, // ใช้ detailId และเพิ่มค่า
          item.id,
          orderId,
          item.quantity,
          Number(item.price)
        ]);
      });

      // เพิ่ม orderdetail
      const detailQuery = `
        INSERT INTO orderdetail 
        (id, product_id, order_id, qty, price) 
        VALUES ?
      `;

      db.query(detailQuery, [orderDetails], (detailErr) => {
        if (detailErr) {
          return db.rollback(() => {
            console.error('เกิดข้อผิดพลาดในการสร้าง order details:', detailErr);
            res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง order details' });
          });
        }

        // Commit transaction
        db.commit(commitErr => {
          if (commitErr) {
            return db.rollback(() => {
              console.error('เกิดข้อผิดพลาดในการ commit transaction:', commitErr);
              res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง order' });
            });
          }

          res.status(201).json({
            orderId,
            tableId,
            items,
            message: 'สั่งอาหารสำเร็จ'
          });
        });
      });
    });
  });
});

// endpoint สำหรับดึงข้อมูล category
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

// Endpoint to get orders by table ID
app.get('/api/orders/:tableId', (req, res) => {
  const { tableId } = req.params;
  
  const query = `
    SELECT o.id as order_id, o.date, o.status,
           od.id, od.product_id, od.qty, od.price,
           p.name as product_name
    FROM \`order\` o
    JOIN orderdetail od ON o.id = od.order_id
    JOIN product p ON od.product_id = p.id
    WHERE o.customer_id = ?
    ORDER BY o.date DESC, od.id ASC
  `;

  db.query(query, [tableId], (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }

    // Group results by order
    const orders = results.reduce((acc, curr) => {
      const order = acc[curr.order_id] || {
        orderId: curr.order_id,
        date: curr.date,
        status: curr.status,
        items: []
      };

      order.items.push({
        id: curr.id,
        productId: curr.product_id,
        productName: curr.product_name,
        quantity: curr.qty,
        price: curr.price
      });

      acc[curr.order_id] = order;
      return acc;
    }, {});

    res.json(Object.values(orders));
  });
});

app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${PORT}`);
});