//ฟังก์ชั่นลบโต๊ะ //ทำงานกับหน้าtablelayout.jsx
import React, { useState } from 'react';
import styles from '../styles/tablelayout.module.css';
import { deleteTable } from '../api';

const Deltable = ({ onClose }) => {
  const [number, setNumber] = useState('');
  const [error, setError] = useState(null);

  const handleNumberChange = (e) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= 50)) {
      setNumber(value);
      setError(null); // เคลียร์ข้อความ error เมื่อมีการเปลี่ยนแปลงค่า
    }
  };

  const handleSubmit = async () => {
    if (!number) {
      setError('กรุณาระบุเบอร์โต๊ะ');
      return;
    }

    try {
      await deleteTable(number);
      alert(`ลบโต๊ะเบอร์: ${number} สำเร็จ`);
      onClose();
    } catch (error) {
      console.error('Error deleting table:', error);
      // ตรวจสอบ error response จาก server
      if (error.response) {
        switch (error.response.status) {
          case 400:
            if (error.response.data.error === 'ไม่สามารถลบโต๊ะที่มีคนนั่งอยู่ได้') {
              setError('ไม่สามารถลบโต๊ะที่มีคนนั่งอยู่ได้');
            } else {
              setError('เกิดข้อผิดพลาดในการลบโต๊ะ');
            }
            break;
          case 404:
            setError('ไม่พบโต๊ะที่ต้องการลบ');
            break;
          default:
            setError('เกิดข้อผิดพลาดในการลบโต๊ะ');
        }
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      }
    }
  };

  return (
    <div className={styles.card}>
      <button className={styles.closeButton} onClick={onClose}>×</button>
      <h2>ลบโต๊ะ</h2>
      <input
        type="number"
        value={number}
        onChange={handleNumberChange}
        placeholder="เบอร์โต๊ะ"
        className={styles.numberInput}
        min="1"
        max="50"
      />
      <button className={styles.submitButton} onClick={handleSubmit}>ตกลง</button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default Deltable;