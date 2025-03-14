import React from 'react';
import { Button } from 'react-bootstrap';
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
      <Button 
        variant="link"
        className={`p-0 border-0 ${isDeleteMode ? 'active' : ''}`}
        onClick={() => onDeleteModeToggle(!isDeleteMode)}
      >
        <img src="/images/-.png" alt="ปุ่มลบโต๊ะ" width="50" height="50" />
      </Button>
    </div>
  );
};

export default Deltable;