//ฟังก์ชั่นคำสั่งโต๊ะ //ทำงานกับหน้าtable.jsx
import React, { useState } from "react";
import styles from "../styles/ordertable.module.css";
import Ordermenu from "./OrderMenu";

const Ordertable = ({ table, onClose }) => {
  const [showOrdermenu, setShowOrdermenu] = useState(false);

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
            onClick={() => setShowOrdermenu(true)}
          >
            สั่งอาหาร
          </button>
          <button className={styles.qrButton}>พิมพ์ QR code</button>
          <button className={styles.billButton}>คิดเงิน</button>
          <button className={styles.editButton}>แก้ไข</button>
        </div>
      </div>

      {showOrdermenu && (
        <Ordermenu 
          table={table} 
          onClose={() => setShowOrdermenu(false)} 
        />
      )}
    </>
  );
};

export default Ordertable;