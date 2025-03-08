import React, { useEffect, useState } from 'react';
import { getTables } from '../api';
import Image from 'next/image';
import styles from '../styles/table.module.css';
import Rectable from '../components/Rectable';
import OrderFood from '../components/Ordertable';

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [error, setError] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderTable, setOrderTable] = useState(null);
  const [isBillProcessed, setIsBillProcessed] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  // Effect เพื่อรีเฟรชข้อมูลหลังจากชำระเงินสำเร็จ
  useEffect(() => {
    if (isBillProcessed) {
      fetchTables();
      setIsBillProcessed(false);
    }
  }, [isBillProcessed]);

  const fetchTables = async () => {
    try {
      const data = await getTables();
      console.log('Table data:', data); // ดูข้อมูลที่ได้จาก API
      setTables(data);
    } catch (err) {
      setError('ดึงข้อมูลโต๊ะไม่สำเร็จ');
    }
  };

  const handleButtonClick = (table) => {
    // เช็คกับ status_id จากฐานข้อมูล
    if (table.status_id === 2) {
      setOrderTable(table);
      setSelectedTable(null);
    } else {
      setSelectedTable(table);
      setOrderTable(null);
    }
  };

  const handleSave = (updatedTable) => {
    setTables(prevTables => 
      prevTables.map(table => 
        table.id === updatedTable.id ? updatedTable : table
      )
    );
    fetchTables();
  };

  // Handler สำหรับเมื่อชำระเงินสำเร็จ
  const handleBillPaymentSuccess = () => {
    setOrderTable(null); // ปิด modal การสั่งอาหาร
    setIsBillProcessed(true); // กำหนดให้รีเฟรชข้อมูลโต๊ะ
  };

  const getTableImage = (statusId) => {
    // ใช้ status_id จากฐานข้อมูล: 1 = ว่าง, 2 = ไม่ว่าง
    return statusId === 2 ? '/images/t2.png' : '/images/t1.png';
  };

  const getTableStatus = (statusId) => {
    return statusId === 2 ? 'ไม่ว่าง' : 'ว่าง';
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h1>โต๊ะ</h1>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.buttonContainer}>
          {tables.map((table) => (
            <button
              key={table.id}
              className={`${styles.button} ${table.status_id === 2 ? styles.occupied : ''}`}
              onClick={() => handleButtonClick(table)}
            >
              <Image
                src={getTableImage(table.status_id)}
                alt={`โต๊ะ ${table.table_number} (${getTableStatus(table.status_id)})`}
                className={styles.image}
                width={150}
                height={150}
                priority
              />
              <div className={styles.tableNumber}>
                {table.table_number}
                <div style={{ fontSize: '12px', color: 'gray' }}>
                  {getTableStatus(table.status_id)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTable && (
        <Rectable 
          table={selectedTable} 
          onClose={() => setSelectedTable(null)} 
          onSave={handleSave}
        />
      )}
      
      {orderTable && (
        <OrderFood 
          table={orderTable} 
          onClose={() => setOrderTable(null)}
          onPaymentSuccess={handleBillPaymentSuccess} 
        />
      )}
    </div>
  );
};

export default Tables;