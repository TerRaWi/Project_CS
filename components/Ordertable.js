//ฟังก์ชั่นคำสั่งโต๊ะ //ทำงานกับหน้าtable.jsx
import React, { useState } from "react";
import styles from "../styles/ordertable.module.css";
import OrderMenu from "./OrderMenu";

const Ordertable = ({ table, onClose }) => {
  const [showOrderMenu, setShowOrderMenu] = useState(false);

  return (
    <>
      <div className={styles.sidebar}>
        <button className={styles.closeButton} onClick={onClose}>
          X
        </button>
        <div className={styles.tableInfo}>โต๊ะ: {table ? table.id : "N/A"}</div>
        <div>
          <button 
            className={styles.orderButton}
            onClick={() => setShowOrderMenu(true)}
          >
            สั่งอาหาร
          </button>
          <button className={styles.qrButton}>พิมพ์ QR code</button>
          <button className={styles.billButton}>คิดเงิน</button>
          <button className={styles.editButton}>แก้ไข</button>
        </div>
      </div>

      {showOrderMenu && (
        <OrderMenu 
          table={table} 
          onClose={() => setShowOrderMenu(false)} 
        />
      )}
    </>
  );
};

export default Ordertable;