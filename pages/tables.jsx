import React, { useEffect, useState } from 'react';
import { getTables } from '../api';
import Image from 'next/image';
import styles from '../styles/table.module.css';
import Rectable from '../components/Rectable';
import OrderFood from '../components/Ordertable.js';

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [error, setError] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderTable, setOrderTable] = useState(null); 

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await getTables();
      setTables(data);
    } catch (err) {
      setError('ดึงข้อมูลโต๊ะไม่สำเร็จ');
    }
  };

  const handleButtonClick = (table) => {
    if (table.status === 'A') {
      // Open OrderFood and reset selectedTable
      setOrderTable(table);
      setSelectedTable(null); // Reset Rectable
    } else {
      // Open Rectable and reset orderTable
      setSelectedTable(table);
      setOrderTable(null); // Reset OrderFood
    }
  };
  
  const handleSave = (updatedTable) => {
    setTables(prevTables => 
      prevTables.map(table => 
        table.id === updatedTable.id ? updatedTable : table
      )
    );
    fetchTables(); // เพิ่มการเรียก fetchTables หลังจากการ save
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
              className={styles.button}
              onClick={() => handleButtonClick(table)}
            >
              <Image
                src={table.status === 'A' ? '/images/tA.png' : '/images/tB.png'} // tA = table available, tB = table empty
                alt={`Table ${table.id}`}
                className={styles.image}
                width={150}
                height={150}
              />
              <div className={styles.tableNumber}>{table.id}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Show Rectable if selectedTable is set */}
      {selectedTable && (
        <Rectable 
          table={selectedTable} 
          onClose={() => setSelectedTable(null)} 
          onSave={handleSave}
        />
      )}

      {/* Show OrderFood if orderTable is set */}
      {orderTable && (
        <OrderFood 
          table={orderTable} 
          onClose={() => setOrderTable(null)} 
        />
      )}
    </div>
  );
};

export default Tables;