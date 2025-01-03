//สร้างโต๊ะ
import React, { useState } from 'react';
import styles from '../styles/tablelayout.module.css';
import { addTable } from '../api';

const Addtable = ({ onClose }) => {
  const [number, setNumber] = useState('');
  const [error, setError] = useState(null);

  const handleNumberChange = (e) => {
    const value = e.target.value;

    if (value === '' || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= 50)) {
      setNumber(value);
    }
  };

  const handleSubmit = async () => {
    if (!number) {
      setError('กรุณาระบุเบอร์โต๊ะ');
      return;
    }

    try {
      await addTable(number);
      alert(`เพิ่มโต๊ะเบอร์: ${number} สำเร็จ`);
      onClose();
    } catch (error) {
      console.error('Error adding table:', error);
      setError('เกิดข้อผิดพลาดในการเพิ่มโต๊ะ');
    }
  };

  return (
    <div className={styles.card}>
      <button className={styles.closeButton} onClick={onClose}>×</button>
      <h2>เพิ่มโต๊ะใหม่</h2>
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
      {error && <p className={styles.error}>{error}</p>} {}
    </div>
  );
};

export default Addtable;