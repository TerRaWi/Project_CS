import React, { useEffect, useState } from 'react';
import { getTables } from '../api';
import Image from 'next/image';
import Rectable from '../components/Rectable';
import Ordertable from '../components/Ordertable';

// เพิ่ม CSS เฉพาะเพื่อแก้ปัญหากรอบโต๊ะ
const customStyles = {
  tableContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0',
    padding: '0',
  },
  tableWrapper: {
    width: '25%',
    padding: '10px',
    boxSizing: 'border-box',
    position: 'relative',
  },
  tableButton: {
    width: '100%',
    padding: '10px',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    background: 'none',
    cursor: 'pointer',
    position: 'relative',
    display: 'block',
  },
  tableContent: {
    position: 'relative',
    width: '100%',
    height: 'auto',
  },
  tableInfo: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    zIndex: 2,
  },
  tableNumber: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
  tableStatus: {
    fontSize: '0.8rem',
    color: '#6c757d',
  },
  // พื้นหลังทำด้วย div เพื่อหลีกเลี่ยงปัญหากรอบ - แก้ไขส่วนนี้
  tableBackground: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: 0,
    borderRadius: '0',
    // ลบหรือเปลี่ยนสีพื้นหลังถ้าต้องการ
    // backgroundColor: แก้จาก '#d4edda' ถ้าต้องการ
  }
};

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [error, setError] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderTable, setOrderTable] = useState(null);
  const [isBillProcessed, setIsBillProcessed] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (isBillProcessed) {
      fetchTables();
      setIsBillProcessed(false);
    }
  }, [isBillProcessed]);

  const fetchTables = async () => {
    try {
      const data = await getTables();
      console.log('Table data:', data);
      setTables(data);
    } catch (err) {
      setError('ดึงข้อมูลโต๊ะไม่สำเร็จ');
    }
  };

  const handleButtonClick = (table) => {
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

  const handleBillPaymentSuccess = (result) => {
    console.log("Payment or table action success:", result);
    setOrderTable(null);
    fetchTables();
    
    if (result && result.totalAmount) {
      setIsBillProcessed(true);
    }
  };

  const getTableImage = (statusId) => {
    return statusId === 2 ? '/images/t2.png' : '/images/t1.png';
  };

  const getTableStatus = (statusId) => {
    return statusId === 2 ? 'ไม่ว่าง' : 'ว่าง';
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-8 p-4">
          <h1 className="mb-4">โต๊ะ</h1>
          {error && <p className="text-danger">{error}</p>}
          
          {/* ใช้ div แทน grid ของ Bootstrap */}
          <div style={customStyles.tableContainer}>
            {tables.map((table) => (
              <div key={table.id} style={customStyles.tableWrapper}>
                <button
                  type="button"
                  onClick={() => handleButtonClick(table)}
                  style={customStyles.tableButton}
                >
                  {/* พื้นหลังสำหรับโต๊ะไม่ว่าง ใช้ div แยกต่างหาก - ตรงนี้ลบกรอบสีเขียวโดยไม่แสดง div นี้ */}
                  {/* ลบหรือคอมเมนต์บล็อก div นี้ทิ้งเพื่อเอากรอบสีเขียวออก
                  {table.status_id === 2 && (
                    <div 
                      style={{
                        ...customStyles.tableBackground,
                        backgroundColor: '#d4edda',
                      }}
                    />
                  )}
                  */}
                  
                  <div style={customStyles.tableContent}>
                    <Image
                      src={getTableImage(table.status_id)}
                      alt={`โต๊ะ ${table.table_number} (${getTableStatus(table.status_id)})`}
                      width={150}
                      height={150}
                      style={{ width: '100%', height: 'auto', position: 'relative', zIndex: 1 }}
                      priority
                    />
                    
                    <div style={customStyles.tableInfo}>
                      <div style={customStyles.tableNumber}>
                        {table.table_number}
                      </div>
                      <div style={customStyles.tableStatus}>
                        {getTableStatus(table.status_id)}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-4 p-4">
          {selectedTable && (
            <Rectable 
              table={selectedTable} 
              onClose={() => setSelectedTable(null)} 
              onSave={handleSave}
            />
          )}
          
          {orderTable && (
            <Ordertable 
              table={orderTable} 
              onClose={() => setOrderTable(null)}
              onPaymentSuccess={handleBillPaymentSuccess} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Tables;