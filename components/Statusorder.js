import React, { useState, useEffect } from 'react';
import styles from "../styles/statusorder.module.css";
import { updateOrderDetailStatus, getOrdersByTable } from '../api';

const Statusorder = ({ orderId, tableId, onStatusUpdate }) => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [tableId, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orders = await getOrdersByTable(tableId);
      
      // ค้นหา order ที่ตรงกับ orderId ที่รับเข้ามา
      const currentOrder = orders.find(order => order.orderId === orderId);
      
      if (currentOrder) {
        setOrderDetails(currentOrder.items);
      } else {
        setOrderDetails([]);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  const handleStatusChange = async (detailId, newStatus) => {
    try {
      await updateOrderDetailStatus(detailId, newStatus);
      
      // อัปเดตสถานะในหน้าจอ
      fetchOrderDetails();
      
      // เรียก callback function เพื่อแจ้งให้ parent component ทราบ
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'A': return 'กำลังทำ';
      case 'C': return 'สำเร็จ';
      case 'V': return 'ยกเลิก';
      default: return 'ไม่ระบุ';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'A': return styles.statusActive;
      case 'C': return styles.statusCompleted;
      case 'V': return styles.statusVoid;
      default: return '';
    }
  };

  if (loading) {
    return <div className={styles.loading}>กำลังโหลด...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (orderDetails.length === 0) {
    return <div className={styles.noItems}>ไม่พบรายการอาหาร</div>;
  }

  return (
    <div className={styles.statusorderContainer}>
      <h3 className={styles.title}>ออเดอร์ #{orderId}</h3>
      <p className={styles.tableInfo}>โต๊ะ: {tableId}</p>
      
      <div className={styles.orderDetails}>
        {orderDetails.map((item, index) => (
          <div key={index} className={styles.orderItem}>
            <div className={styles.productInfo}>
              <span className={styles.productName}>{item.productName}</span>
              <span className={styles.quantity}>x{item.quantity}</span>
              <span className={styles.price}>{item.price.toFixed(2)} บาท</span>
            </div>
            
            <div className={styles.statusActions}>
              <div className={styles.currentStatus}>
                <span className={`${styles.statusBadge} ${getStatusClass(item.status || 'A')}`}>
                  {getStatusLabel(item.status || 'A')}
                </span>
              </div>
              
              <div className={styles.actionButtons}>
                <button 
                  className={`${styles.actionButton} ${styles.completeButton}`}
                  onClick={() => handleStatusChange(item.id, 'C')}
                  disabled={item.status === 'C' || item.status === 'V'}
                >
                  เสร็จสิ้น
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.cancelButton}`}
                  onClick={() => handleStatusChange(item.id, 'V')}
                  disabled={item.status === 'C' || item.status === 'V'}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.orderSummary}>
        <div className={styles.totalAmount}>
          รวมทั้งหมด: {orderDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} บาท
        </div>
      </div>
    </div>
  );
};

export default Statusorder;