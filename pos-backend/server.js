const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '6101',
  database: 'newtestdb'
});

db.connect((err) => {
  if (err) {
    console.error('เชื่อมต่อ MySQL ไม่สำเร็จ:', err);
    return;
  }
  console.log('เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
});

//นำโต๊ะมาแสดงบน Page โต๊ะ
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

//สร้างโต๊ะ
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

//นำเมนูมาแสดงบน Page จัดการเมนู
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

//เพิ่มสินค้าใหม่
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

 //สำหรับลบสินค้า
app.delete('/api/product/:id', (req, res) => {
  const productId = req.params.id;  // ดึงค่า id จาก URL parameters

  if (!productId) {ไ
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

//สำหรับสร้าง order
app.post('/api/order', (req, res) => {
  const { tableId, items } = req.body;

  db.beginTransaction(err => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการเริ่ม transaction:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง order' });
    }
    
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

//ดึงข้อมูล category
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