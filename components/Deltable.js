//ฟังก์ชั่นลบโต๊ะ //ทำงานกับหน้าtablelayout.jsx
import React from 'react';
import styles from '../styles/tablelayout.module.css';
import { deleteTable } from '../api';

const Deltable = ({ tables, isDeleteMode, onTableDelete, onDeleteModeToggle }) => {
  const handleDeleteTable = async (tableId) => {
    if (!window.confirm(`ยืนยันการลบโต๊ะเบอร์ ${tableId}?`)) {
      return;
    }
    
    try {
      await deleteTable(tableId);
      await onTableDelete();
      onDeleteModeToggle(false);
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('เกิดข้อผิดพลาดในการลบโต๊ะ');
    }
  };

  return (
    <>
      <button 
        onClick={() => onDeleteModeToggle(!isDeleteMode)} 
        className={`${styles.imagedel} ${isDeleteMode ? styles.active : ''}`}
      >
        <img src="/images/-.png" alt="ปุ่มลบโต๊ะ" />
      </button>

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
    </>
  );
};

export default Deltable;