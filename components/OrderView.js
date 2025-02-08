//ฟังก์ชั่นดูประัติการสั่ง //ทำงานกับหน้าtable.jsx
import React, { useState, useEffect } from 'react';
import { getOrdersByTable } from '../api';
import styles from '../styles/ordermenu.module.css';

const Orderview = ({ tableId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrdersByTable(tableId);
        setOrders(data);
        setError(null);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลออเดอร์ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [tableId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  const calculateOrderTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className={styles.historyCard}>
        <div className={styles.loading}>กำลังโหลด...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.historyCard}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.historyCard}>
      <div className={styles.historyHeader}>
        <h2 className={styles.historyTitle}>ประวัติการสั่งอาหาร</h2>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>ยังไม่มีประวัติการสั่งอาหาร</div>
      ) : (
        orders.map((order) => (
          <div key={order.orderId} className={styles.orderItem}>
            <div className={styles.orderHeader}>
              <div className={styles.orderDate}>
                เวลาที่สั่ง: {formatDate(order.date)}
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
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td className={styles.textRight}>{item.quantity}</td>
                    <td className={styles.textRight}>฿{formatPrice(item.price)}</td>
                    <td className={styles.textRight}>
                      ฿{formatPrice(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td colSpan="3" className={styles.textRight}>รวมทั้งหมด:</td>
                  <td className={styles.textRight}>
                    ฿{formatPrice(calculateOrderTotal(order.items))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default Orderview;