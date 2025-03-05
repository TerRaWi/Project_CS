//ฟังก์ชั่นเพิ่มโต๊ะ //ทำงานกับหน้าtablelayout.jsx
import React, { useState } from 'react';
import styles from '../styles/tablelayout.module.css';
import { addTable } from '../api';

const Addtable = ({ onClose, onTableAdded }) => {
  const [tableNumber, setTableNumber] = useState('');
  const [error, setError] = useState(null);

  const handleNumberChange = (e) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= 50)) {
      setTableNumber(value);
    }
  };

  const handleSubmit = async () => {
    if (!tableNumber) {
      setError('กรุณาระบุเบอร์โต๊ะ');
      return;
    }

    try {
      const result = await addTable(tableNumber);
      alert(`เพิ่มโต๊ะเบอร์: ${tableNumber} สำเร็จ`);
      if (onTableAdded) {
        onTableAdded(result);
      }
      onClose();
    } catch (error) {
      console.error('Error adding table:', error);
      if (error.response?.status === 409) {
        setError('เบอร์โต๊ะนี้มีอยู่แล้ว');
      } else {
        setError('เกิดข้อผิดพลาดในการเพิ่มโต๊ะ');
      }
    }
  };

  return (
    <div className={styles.card}>
      <button className={styles.closeButton} onClick={onClose}>×</button>
      <h2>เพิ่มโต๊ะใหม่</h2>
      <input
        type="number"
        value={tableNumber}
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

export default Addtable;