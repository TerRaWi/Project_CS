import React, { useState, useEffect } from "react";
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
        console.log("Orders for table:", orders);

        // กรองเฉพาะออเดอร์ที่มีสถานะ Active
        const activeOrders = orders.filter(order => order.status === 'A');

        if (activeOrders.length > 0) {
          // เรียงลำดับตามเวลาล่าสุด
          activeOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
          setActiveOrder(activeOrders[0]);
          console.log("Active order found:", activeOrders[0]);
        } else {
          setActiveOrder(null);
          console.log("No active orders found");
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
    console.log("Payment successful:", result);

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
    console.log("Bill button clicked, activeOrder:", activeOrder);

    if (!activeOrder) {
      alert("ไม่พบออเดอร์ที่เปิดอยู่");
      return;
    }

    setShowBillpayment(true);
  };

  // จัดการเมื่อจัดการโต๊ะสำเร็จ
  const handleTablemanageSuccess = (result) => {
    console.log("Table management successful:", result);

    // ปิด modal จัดการโต๊ะ
    setShowTablemanage(false);

    // แจ้ง component หลักว่ามีการเปลี่ยนแปลงโต๊ะ
    if (onPaymentSuccess) {
      onPaymentSuccess({
        action: result.action,
        tableId: table.id,
      });
    }

    // ปิดหน้าต่าง Ordertable เนื่องจากโต๊ะอาจถูกย้ายหรือยกเลิกไปแล้ว
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

  // กำหนด CSS เพิ่มเติมสำหรับ sidebar
  const sidebarStyle = {
    height: '100%',
    position: 'fixed',
    right: 0,
    top: 0,
    width: '300px',
    zIndex: 1000
  };

  // ปิดทุก modal
  const closeAllModals = () => {
    setShowOrdermenu(false);
    setShowBillpayment(false);
    setShowTablemanage(false);
  };

  return (
    <>
      <div className="bg-light d-flex flex-column border-start shadow-sm p-3" style={sidebarStyle}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">โต๊ะ: {table ? table.table_number : "N/A"}</h5>
          <button
            className="btn btn-danger"
            onClick={onClose}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        {isLoading ? (
          <div className="d-flex justify-content-center my-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <div className="d-grid gap-3">
            <button
              className="btn btn-success"
              onClick={() => {
                closeAllModals();
                setShowOrdermenu(true);
              }}
            >
              <i className="bi bi-cart-plus me-2"></i>
              สั่งอาหาร
            </button>

            <button
              className="btn btn-warning text-white"
              onClick={() => {
                closeAllModals();
                handleBillButtonClick();
              }}
              disabled={!activeOrder}
            >
              <i className="bi bi-cash-coin me-2"></i>
              คิดเงิน
            </button>

            <button
              className="btn btn-purple"
              style={{ backgroundColor: '#9c27b0', color: 'white' }}
              onClick={() => {
                closeAllModals();
                setShowTablemanage(true);
              }}
            >
              <i className="bi bi-gear me-2"></i>
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
          onTableUpdate={() => {
            // ให้ parent component อัพเดตข้อมูลโต๊ะ
            if (onPaymentSuccess) {
              onPaymentSuccess({ action: 'refreshTables' });
            }
          }}
        />
      )}
    </>
  );
};

export default Ordertable;