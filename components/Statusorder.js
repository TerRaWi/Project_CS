import React, { useState, useEffect } from 'react';
import styles from "../styles/statusorder.module.css";
import { updateOrderDetailStatus, getOrdersByTable, getCancelReasons } from '../api';
import Cancelreason from './Cancelreason';

const Statusorder = ({ orderId, tableId, tableNumber, onStatusUpdate }) => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [allOrderInstances, setAllOrderInstances] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId);
  const [orderTime, setOrderTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // เพิ่ม state สำหรับการจัดการ modal ยกเลิกรายการอาหาร
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState(null);

  useEffect(() => {
    fetchAllOrdersForTable();
  }, [tableId]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  const fetchAllOrdersForTable = async () => {
    try {
      setLoading(true);
      const orders = await getOrdersByTable(tableId);
      
      if (orders && orders.length > 0) {
        // Sort orders by date (newest first)
        const sortedOrders = [...orders].sort((a, b) => {
          // เปรียบเทียบวันที่ของออเดอร์ก่อน
          const dateComparison = new Date(b.date) - new Date(a.date);
          
          // ถ้าวันที่เท่ากัน ให้พิจารณาเวลาในรายการอาหารที่ใหม่ที่สุดของแต่ละออเดอร์
          if (dateComparison === 0 && a.items && b.items) {
            // หาเวลาล่าสุดในรายการของแต่ละออเดอร์
            const latestTimeA = a.items.reduce((latest, item) => {
              const itemTime = new Date(item.orderTime).getTime();
              return itemTime > latest ? itemTime : latest;
            }, 0);
            
            const latestTimeB = b.items.reduce((latest, item) => {
              const itemTime = new Date(item.orderTime).getTime();
              return itemTime > latest ? itemTime : latest;
            }, 0);
            
            return latestTimeB - latestTimeA;
          }
          
          return dateComparison;
        });
        
        setAllOrderInstances(sortedOrders);
        
        // If no order is selected yet, select the first one
        if (!selectedOrderId && sortedOrders.length > 0) {
          setSelectedOrderId(sortedOrders[0].orderId);
        }
      } else {
        setAllOrderInstances([]);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderIdToFetch) => {
    try {
      setLoading(true);
      const orders = await getOrdersByTable(tableId);
      
      // ค้นหา order ที่ตรงกับ orderId ที่เลือก
      const currentOrder = orders.find(order => order.orderId === orderIdToFetch);
      
      if (currentOrder) {
        // Sort items by order time - newest first
        const sortedItems = [...currentOrder.items].sort((a, b) => 
          new Date(b.orderTime) - new Date(a.orderTime)
        );
        
        setOrderDetails(sortedItems);
        setOrderTime(new Date(currentOrder.date));
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
    // ถ้าเป็นการยกเลิก (status = V) ให้แสดง modal เลือกเหตุผล
    if (newStatus === 'V') {
      setSelectedDetailId(detailId);
      setShowCancelModal(true);
      return;
    }
    
    // ถ้าไม่ใช่การยกเลิก ให้อัพเดทสถานะตามปกติ
    try {
      await updateOrderDetailStatus(detailId, newStatus);
      
      // อัปเดตสถานะในหน้าจอ
      fetchOrderDetails(selectedOrderId);
      
      // เรียก callback function เพื่อแจ้งให้ parent component ทราบ
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // ฟังก์ชันสำหรับจัดการการยกเลิกรายการอาหารพร้อมเหตุผล
  const handleCancelWithReason = async (detailId, newStatus, cancelReasonId) => {
    try {
      await updateOrderDetailStatus(detailId, newStatus, cancelReasonId);
      
      // ปิด modal
      setShowCancelModal(false);
      setSelectedDetailId(null);
      
      // อัปเดตสถานะในหน้าจอ
      fetchOrderDetails(selectedOrderId);
      
      // เรียก callback function เพื่อแจ้งให้ parent component ทราบ
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleOrderInstanceChange = (newOrderId) => {
    setSelectedOrderId(parseInt(newOrderId));
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'A': return 'กำลังทำ';
      case 'P': return 'กำลังดำเนินการ';
      case 'C': return 'สำเร็จ';
      case 'V': return 'ยกเลิก';
      default: return 'ไม่ระบุ';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'A': 
      case 'P': return styles.statusActive;
      case 'C': return styles.statusCompleted;
      case 'V': return styles.statusVoid;
      default: return '';
    }
  };

  // จัดรูปแบบวันที่และเวลา
  const formatDateTime = (date) => {
    if (!date) return '';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('th-TH', options);
  };

  // จัดรูปแบบเวลาอย่างเดียว
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    
    return date.toLocaleTimeString('th-TH', options);
  };

  if (loading && allOrderInstances.length === 0) {
    return <div className={styles.loading}>กำลังโหลด...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (allOrderInstances.length === 0) {
    return <div className={styles.noItems}>ไม่พบรายการอาหาร</div>;
  }

  return (
    <div className={styles.statusorderContainer}>
      <div className={styles.orderHeader}>
        <h3 className={styles.title}>ออเดอร์ #{selectedOrderId}</h3>
        <div className={styles.orderMeta}>
          <p className={styles.tableInfo}>โต๊ะ: {tableNumber}</p>
          {orderTime && <p className={styles.timeInfo}>เวลา: {formatDateTime(orderTime)}</p>}
        </div>
      </div>
      
      {allOrderInstances.length > 1 && (
        <div className={styles.orderInstancesSelector}>
          <label htmlFor="orderInstance">ครั้งที่สั่ง:</label>
          <select 
            id="orderInstance" 
            value={selectedOrderId}
            onChange={(e) => handleOrderInstanceChange(parseInt(e.target.value))}
            className={styles.orderInstanceSelect}
          >
            {allOrderInstances.map((order, index) => (
              <option key={order.orderId} value={order.orderId}>
                ครั้งที่ {allOrderInstances.length - index}: {formatDateTime(new Date(order.date))}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {loading ? (
        <div className={styles.loading}>กำลังโหลดรายการ...</div>
      ) : (
        <>
          <div className={styles.orderDetails}>
            {orderDetails.length === 0 ? (
              <div className={styles.noItems}>ไม่พบรายการอาหารในออเดอร์นี้</div>
            ) : (
              orderDetails.map((item, index) => (
                <div key={index} className={styles.orderItem}>
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>{item.productName}</span>
                    <span className={styles.quantity}>x{item.quantity}</span>
                    <span className={styles.price}>{item.price.toFixed(2)} บาท</span>
                    <span className={styles.orderTimeInfo}>เวลาสั่ง: {formatTime(item.orderTime)}</span>
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
                        onClick={() => handleStatusChange(item.orderDetailId, 'C')}
                        disabled={item.status === 'C' || item.status === 'V'}
                      >
                        เสร็จสิ้น
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.cancelButton}`}
                        onClick={() => handleStatusChange(item.orderDetailId, 'V')}
                        disabled={item.status === 'C' || item.status === 'V'}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className={styles.orderSummary}>
            <div className={styles.totalAmount}>
              รวมทั้งหมด: {orderDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} บาท
            </div>
          </div>
        </>
      )}

      {/* Modal สำหรับเลือกเหตุผลการยกเลิก */}
      <Cancelreason
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelWithReason}
        detailId={selectedDetailId}
      />
    </div>
  );
};

export default Statusorder;