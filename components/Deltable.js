import React from 'react';
import styles from '../styles/tablelayout.module.css';
import { deleteTable } from '../api';

const Deltable = ({ tables, isDeleteMode, onTableDelete, onDeleteModeToggle }) => {
  const handleDeleteTable = async (tableNumber) => {
    if (!window.confirm(`ยืนยันการลบโต๊ะเบอร์ ${tableNumber}?`)) {
      return;
    }
    
    try {
      await deleteTable(tableNumber);
      await onTableDelete();
      onDeleteModeToggle(false);
    } catch (error) {
      console.error('Error deleting table:', error);
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบโต๊ะ');
    }
  };

  return (
    <div>
      <button 
        onClick={() => onDeleteModeToggle(!isDeleteMode)} 
        className={`${styles.imagedel} ${isDeleteMode ? styles.active : ''}`}
      >
        <img src="/images/-.png" alt="ปุ่มลบโต๊ะ" />
      </button>
      
      {/* Pass handleDeleteTable function up to parent */}
      {isDeleteMode && (
        <div style={{ display: 'none' }}>
          {tables.map(table => (
            <div
              key={table.table_number}
              onClick={() => handleDeleteTable(table.table_number)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Deltable;