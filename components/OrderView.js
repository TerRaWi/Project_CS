import React, { useState, useEffect } from 'react';
import { getOrdersByTable } from '../api';
import styles from '../styles/ordermenu.module.css';

const OrderView = ({ tableId }) => {
  // กำหนดค่าเริ่มต้นเป็น array ว่าง
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      // รีเซ็ตสถานะเริ่มต้น
      setLoading(true);
      setError(null);

      try {
        // ตรวจสอบ tableId
        if (!tableId) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // เรียกข้อมูล
        const data = await getOrdersByTable(tableId);
        console.log('Fetched data:', data); // เพิ่ม log เพื่อดูข้อมูลที่ได้

        // ตรวจสอบและเซ็ตข้อมูล
        setOrders(Array.isArray(data) ? data : []);
        
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'ไม่สามารถโหลดข้อมูลออเดอร์ได้');
        setOrders([]); // เซ็ตเป็น array ว่างเมื่อเกิด error
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [tableId]);

  // แสดง loading
  if (loading) {
    return (
      <div className={styles.historyCard}>
        <div className={styles.loading}>กำลังโหลด...</div>
      </div>
    );
  }

  // แสดง error
  if (error) {
    return (
      <div className={styles.historyCard}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  // แสดงเมื่อไม่มีข้อมูล
  if (!orders || orders.length === 0) {
    return (
      <div className={styles.historyCard}>
        <div className={styles.emptyState}>ยังไม่มีประวัติการสั่งอาหาร</div>
      </div>
    );
  }

  // ส่วนแสดงผลเมื่อมีข้อมูล
  return (
    <div className={styles.historyCard}>
      <div className={styles.historyHeader}>
        <h2 className={styles.historyTitle}>ประวัติการสั่งอาหาร</h2>
      </div>

      {/* รายการออเดอร์ */}
      {orders && orders.length > 0 && orders.map((order) => (
        <div key={order.orderId} className={styles.orderItem}>
          <div className={styles.orderHeader}>
            <div className={styles.orderDate}>
              เวลาที่สั่ง: {new Date(order.date).toLocaleString('th-TH')}
            </div>
            <div className={`${styles.statusBadge} ${
              order.status === 'A' ? styles.statusActive : styles.statusComplete
            }`}>
              {order.status === 'A' ? 'กำลังจัดเตรียม' : 'เสร็จสิ้น'}
            </div>
          </div>
          
          <table className={styles.orderTable}>
            <thead>
              <tr>
                <th>รายการ</th>
                <th className={styles.textRight}>จำนวน</th>
                <th className={styles.textRight}>ราคา</th>
                <th className={styles.textRight}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.productName}</td>
                  <td className={styles.textRight}>{item.quantity}</td>
                  <td className={styles.textRight}>฿{item.price.toFixed(2)}</td>
                  <td className={styles.textRight}>
                    ฿{(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className={styles.totalRow}>
                <td colSpan="3" className={styles.textRight}>รวมทั้งหมด:</td>
                <td className={styles.textRight}>
                  ฿{order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default OrderView;