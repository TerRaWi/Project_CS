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

  db.query('SELECT * FROM customer WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบโต๊ะ:', err);
      return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'ไม่พบโต๊ะที่ต้องการลบ' });
    }

    db.query('DELETE FROM customer WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการลบโต๊ะ:', err);
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
  const { id, name, price, category_id } = req.body;
  
  // ตรวจสอบ product id ก่อน
  db.query('SELECT * FROM product WHERE id = ?', [id], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('เกิดข้อผิดพลาดในการตรวจสอบสินค้า:', checkErr);
      return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
    }

    // ถ้ามี product id ซ้ำ
    if (checkResults.length > 0) {
      return res.status(409).json({ 
        error: 'รหัสสินค้านี้มีอยู่แล้ว',
        duplicate: true
      });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const query = 'INSERT INTO product (id, name, price, category_id, image_url) VALUES (?, ?, ?, ?, ?)';
    
    db.query(query, [id, name, price, category_id, image_url], (err, result) => {
      if (err) {
        console.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า:', err);
        return res.status(500).send('ข้อผิดพลาดของเซิร์ฟเวอร์');
      }
      
      res.status(201).json({ 
        id, 
        name, 
        price, 
        category_id, 
        image_url 
      });
    });
  });
});

app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${PORT}`);
});