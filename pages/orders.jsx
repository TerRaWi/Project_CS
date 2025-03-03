import React, { useState, useEffect } from 'react';
import { getAllActiveOrders, getTables, updateOrderDetailStatus } from '../api';
import Statusorder from "../components/Statusorder";
import styles from "../styles/orders.module.css";

const Orders = () => {
  const [tables, setTables] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลโต๊ะทั้งหมด
      const tablesData = await getTables();
      setTables(tablesData);
      
      // ดึงข้อมูลออเดอร์ทั้งหมดที่กำลังทำงานอยู่ (Active)
      const activeOrders = await getAllActiveOrders();
      // จัดเรียงออเดอร์ตามเวลา (ล่าสุดขึ้นก่อน หรือ เก่าสุดขึ้นก่อน)
      sortOrders(activeOrders, sortOrder);
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  const sortOrders = (orders, sortType) => {
    const sorted = [...orders];
    if (sortType === 'newest') {
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    setAllOrders(sorted);
  };

  const handleSortChange = (e) => {
    const newSortOrder = e.target.value;
    setSortOrder(newSortOrder);
    sortOrders(allOrders, newSortOrder);
  };

  const handleOrderUpdate = () => {
    // Refresh ข้อมูลออเดอร์ทั้งหมดหลังจากอัปเดตสถานะ
    fetchData();
  };

  // กรองเฉพาะโต๊ะที่ไม่ว่าง (มีลูกค้าใช้บริการอยู่)
  const busyTables = tables.filter(table => table.status_id === 2);

  if (loading) {
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
          <h2 className={styles.sectionTitle}>สถานะโต๊ะอาหาร</h2>
          {tables.length === 0 ? (
            <div className={styles.noTables}>ไม่พบข้อมูลโต๊ะ</div>
          ) : (
            <div className={styles.tableStatus}>
              {tables.map((table) => (
                <div key={table.id} className={styles.tableStatusItem}>
                  <span className={styles.tableNumber}>โต๊ะ {table.table_number}</span>
                  <span className={`${styles.statusBadge} ${table.status_id === 2 ? styles.statusBusy : styles.statusFree}`}>
                    {table.status_id === 2 ? 'ไม่ว่าง' : 'ว่าง'}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className={styles.tableStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>จำนวนโต๊ะทั้งหมด:</span>
              <span className={styles.statValue}>{tables.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>โต๊ะที่ไม่ว่าง:</span>
              <span className={styles.statValue}>{busyTables.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>โต๊ะว่าง:</span>
              <span className={styles.statValue}>{tables.length - busyTables.length}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.ordersList}>
          <div className={styles.ordersHeader}>
            <h2 className={styles.sectionTitle}>ออเดอร์ทั้งหมด</h2>
            
            <div className={styles.orderTimeSort}>
              <label htmlFor="sortOrder">เรียงตาม: </label>
              <select 
                id="sortOrder" 
                value={sortOrder}
                onChange={handleSortChange}
                className={styles.sortSelect}
              >
                <option value="newest">ล่าสุดก่อน</option>
                <option value="oldest">เก่าสุดก่อน</option>
              </select>
            </div>
          </div>
          
          {allOrders.length === 0 ? (
            <div className={styles.noOrders}>ไม่พบออเดอร์ที่กำลังดำเนินการอยู่</div>
          ) : (
            <div className={styles.ordersGrid}>
              {allOrders.map((order) => (
                <Statusorder
                  key={order.orderId}
                  orderId={order.orderId}
                  tableId={order.tableId}
                  tableNumber={order.tableNumber}
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