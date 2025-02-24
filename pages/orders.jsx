import React, { useState, useEffect } from 'react';
import { getOrdersByTable, getTables } from '../api';
import Statusorder from "../components/Statusorder";
import styles from "../styles/orders.module.css";

const Orders = () => {
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (activeTable) {
      fetchOrders(activeTable.id);
    }
  }, [activeTable]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const tablesData = await getTables();
      setTables(tablesData);
      
      // ถ้ามีโต๊ะ ให้เลือกโต๊ะแรกเป็นค่าเริ่มต้น
      if (tablesData.length > 0) {
        setActiveTable(tablesData[0]);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลโต๊ะ');
      setLoading(false);
    }
  };

  const fetchOrders = async (tableId) => {
    try {
      setLoading(true);
      const ordersData = await getOrdersByTable(tableId);
      
      // กรองเฉพาะออเดอร์ที่ยังทำงานอยู่ (Active)
      const activeOrders = ordersData.filter(order => order.status === 'A');
      
      setOrders(activeOrders);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลออเดอร์');
      setLoading(false);
    }
  };

  const handleTableClick = (table) => {
    setActiveTable(table);
  };

  const handleOrderUpdate = () => {
    // Refresh ข้อมูลออเดอร์หลังจากอัปเดตสถานะ
    if (activeTable) {
      fetchOrders(activeTable.id);
    }
  };

  if (loading && !activeTable) {
    return <div className={styles.loading}>กำลังโหลด...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.ordersContainer}>
      <h1 className={styles.pageTitle}>จัดการออเดอร์</h1>
      
      <div className={styles.contentWrapper}>
        <div className={styles.tablesList}>
          <h2 className={styles.sectionTitle}>โต๊ะอาหาร</h2>
          {tables.length === 0 ? (
            <div className={styles.noTables}>ไม่พบข้อมูลโต๊ะ</div>
          ) : (
            <div className={styles.tableButtons}>
              {tables.map((table) => (
                <button
                  key={table.id}
                  className={`${styles.tableButton} ${activeTable?.id === table.id ? styles.activeTable : ''}`}
                  onClick={() => handleTableClick(table)}
                >
                  โต๊ะ {table.table_number}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.ordersList}>
          <h2 className={styles.sectionTitle}>
            ออเดอร์{activeTable ? ` (โต๊ะ ${activeTable.table_number})` : ''}
          </h2>
          
          {!activeTable ? (
            <div className={styles.noTableSelected}>กรุณาเลือกโต๊ะ</div>
          ) : loading ? (
            <div className={styles.loading}>กำลังโหลดออเดอร์...</div>
          ) : orders.length === 0 ? (
            <div className={styles.noOrders}>ไม่พบออเดอร์ที่กำลังดำเนินการอยู่</div>
          ) : (
            <div className={styles.ordersGrid}>
              {orders.map((order) => (
                <Statusorder
                  key={order.orderId}
                  orderId={order.orderId}
                  tableId={activeTable.id}
                  onStatusUpdate={handleOrderUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;