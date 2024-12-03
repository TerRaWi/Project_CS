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
      setError('เกิดข้อผิดพลาดในการลบโต๊ะ');
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
