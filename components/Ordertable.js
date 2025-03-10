import React, { useState, useEffect } from "react";
import styles from "../styles/ordertable.module.css";
import Ordermenu from "./Ordermenu";
import Billpayment from "./Billpayment";
import Tablemanage from "./Tablemanage";
import { getOrdersByTable } from "../api";

const Ordertable = ({ table, onClose, onPaymentSuccess }) => {
  const [showOrdermenu, setShowOrdermenu] = useState(false);
  const [showBillpayment, setShowBillpayment] = useState(false);
  const [showTablemanage, setShowTablemanage] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ดึงข้อมูลออเดอร์ที่เปิดอยู่
  useEffect(() => {
    const fetchActiveOrder = async () => {
      if (!table) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const orders = await getOrdersByTable(table.id);
        console.log("Orders for table:", orders); // เพิ่ม log เพื่อดูข้อมูล
        
        // กรองเฉพาะออเดอร์ที่มีสถานะ Active
        const activeOrders = orders.filter(order => order.status === 'A');
        
        if (activeOrders.length > 0) {
          // เรียงลำดับตามเวลาล่าสุด
          activeOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
          setActiveOrder(activeOrders[0]);
          console.log("Active order found:", activeOrders[0]); // เพิ่ม log
        } else {
          setActiveOrder(null);
          console.log("No active orders found"); // เพิ่ม log
        }
      } catch (err) {
        console.error("Error fetching active order:", err);
        setError("ไม่สามารถดึงข้อมูลออเดอร์ได้");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveOrder();
  }, [table]);

  // จัดการเมื่อชำระเงินสำเร็จ
  const handlePaymentSuccess = (result) => {
    console.log("Payment successful:", result); // เพิ่ม log
    
    // ปิด modal การชำระเงิน
    setShowBillpayment(false);
    
    // แจ้ง component หลักว่าชำระเงินสำเร็จ
    if (onPaymentSuccess) {
      onPaymentSuccess(result);
    }
    
    // รีเฟรชข้อมูลหรือปิดหน้าต่าง
    if (onClose) {
      onClose();
    }
    
    // แสดงข้อความสำเร็จ (อาจใช้ modal หรือ toast notification)
    alert(`ชำระเงินสำเร็จ: ${result.totalAmount} บาท`);
  };

  // จัดการเมื่อกดปุ่มคิดเงิน
  const handleBillButtonClick = () => {
    console.log("Bill button clicked, activeOrder:", activeOrder); // เพิ่ม log
    
    if (!activeOrder) {
      alert("ไม่พบออเดอร์ที่เปิดอยู่");
      return;
    }
    
    setShowBillpayment(true);
  };

  // จัดการเมื่อจัดการโต๊ะสำเร็จ
  const handleTablemanageSuccess = (result) => {
    console.log("Table management successful:", result); // เพิ่ม log
    
    // ปิด modal จัดการโต๊ะ
    setShowTablemanage(false);
    
    // รีเฟรชข้อมูลหรือปิดหน้าต่าง
    if (onClose) {
      onClose();
    }
    
    // แสดงข้อความสำเร็จตามประเภทการจัดการ
    let message = "";
    
    switch (result.action) {
      case 'move':
        message = `ย้ายโต๊ะเรียบร้อยแล้ว`;
        break;
      case 'merge':
        message = `รวมโต๊ะเรียบร้อยแล้ว`;
        break;
      case 'cancel':
        message = `ยกเลิกโต๊ะเรียบร้อยแล้ว`;
        break;
      default:
        message = `ดำเนินการเรียบร้อยแล้ว`;
    }
    
    alert(message);
  };

  return (
    <>
      <div className={styles.sidebar}>
        <button className={styles.closeButton} onClick={onClose}>
          X
        </button>
        <div className={styles.tableInfo}>โต๊ะ: {table ? table.table_number : "N/A"}</div>
        
        {isLoading ? (
          <div>กำลังโหลดข้อมูล...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div>
            <button 
              className={styles.orderButton}
              onClick={() => setShowOrdermenu(true)}
            >
              สั่งอาหาร
            </button>
            <button className={styles.qrButton}>พิมพ์ QR code</button>
            <button 
              className={styles.billButton}
              onClick={handleBillButtonClick}
            >
              คิดเงิน
            </button>
            <button 
              className={styles.editButton}
              onClick={() => setShowTablemanage(true)}
            >
              แก้ไข
            </button>
          </div>
        )}
      </div>

      {showOrdermenu && (
        <Ordermenu 
          table={table} 
          onClose={() => setShowOrdermenu(false)} 
        />
      )}

      {showBillpayment && activeOrder && (
        <Billpayment
          orderId={activeOrder.orderId}
          tableNumber={table ? table.table_number : ""}
          onClose={() => setShowBillpayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showTablemanage && (
        <Tablemanage
          table={table}
          onClose={() => setShowTablemanage(false)}
          onSuccess={handleTablemanageSuccess}
        />
      )}
    </>
  );
};

export default Ordertable;