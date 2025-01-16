import React, { useState, useEffect } from 'react';
import styles from '../styles/tablelayout.module.css';
import { getTables } from '../api';
import Addtable from '../components/Addtable';
import Deltable from '../components/Deltable';

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

  const handleTableAdded = async () => {
    await fetchTables(); 
    setShowAddCard(false);
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
        
        <Deltable
          tables={tables}
          isDeleteMode={isDeleteMode}
          onTableDelete={fetchTables}
          onDeleteModeToggle={setIsDeleteMode}
        />
      </div>

      {showAddCard && (
        <Addtable 
          onClose={() => setShowAddCard(false)} 
          onTableAdded={handleTableAdded}
        />
      )}
    </div>
  );
};

export default TableLayout;