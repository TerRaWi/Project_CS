import React, { useState, useEffect } from 'react';
import styles from '../styles/tablelayout.module.css';
import { getTables, deleteTable } from '../api';
import Addtable from '../components/Addtable';

const TableLayout = () => {
  const [tables, setTables] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  
  const fetchTables = async () => {
    try {
      const data = await getTables();
      setTables(data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm(`ยืนยันการลบโต๊ะเบอร์ ${tableId}?`)) {
      return;
    }
    
    try {
      await deleteTable(tableId);
      await fetchTables();
      setIsDeleteMode(false);
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('เกิดข้อผิดพลาดในการลบโต๊ะ');
    }
  };

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (showAddCard) setShowAddCard(false);
  };

  // เพิ่มฟังก์ชั่นสำหรับจัดการการเพิ่มโต๊ะใหม่
  const handleTableAdded = async () => {
    await fetchTables(); // โหลดข้อมูลโต๊ะใหม่
    setShowAddCard(false); // ปิด modal หลังจากเพิ่มโต๊ะเสร็จ
  };

  return (
    <div className={styles.container}>
      <h1 className={styles['heading-background']}>จัดการผังโต๊ะ</h1>
      
      <div className={styles['button-container']}>
        <button 
          onClick={() => {
            setShowAddCard(true);
            setIsDeleteMode(false);
          }} 
          className={styles.imageadd}
        >
          <img src='/images/+.png' alt="ปุ่มเพิ่มโต๊ะ" />
        </button>
        <button 
          onClick={toggleDeleteMode} 
          className={`${styles.imagedel} ${isDeleteMode ? styles.active : ''}`}
        >
          <img src='/images/-.png' alt="ปุ่มลบโต๊ะ" />
        </button>
      </div>

      <div className={styles.tablesGrid}>
        {tables.map((table) => (
          <div
            key={table.id}
            className={`${styles.table} ${isDeleteMode ? styles.deleteMode : ''}`}
            onClick={() => isDeleteMode && handleDeleteTable(table.id)}
          >
            <div></div>
            <span className={styles.tableNumber}>{table.id}</span>
            {isDeleteMode && (
              <div className={styles.deleteIcon}>×</div>
            )}
          </div>
        ))}
      </div>

      {showAddCard && (
        <Addtable 
          onClose={() => setShowAddCard(false)} 
          onTableAdded={handleTableAdded} // เปลี่ยนจาก onAdd เป็น onTableAdded
        />
      )}
    </div>
  );
};

export default TableLayout;