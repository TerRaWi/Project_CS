import React from "react";
import styles from "../styles/ordertable.module.css";

const Ordertable = ({ table, onClose }) => {
  return (
    <div className={styles.sidebar}>
      <button className={styles.closeButton} onClick={onClose}>
        X
      </button>
      <div className={styles.tableInfo}>โต๊ะ: {table ? table.id : "N/A"}</div>
      <div>
        <button className={styles.orderButton}>สั่งอาหาร</button>
        <button className={styles.qrButton}>พิมพ์ QR code</button>
        <button className={styles.billButton}>คิดเงิน</button>
        <button className={styles.editButton}>แก้ไข</button>
      </div>
    </div>
  );
};

export default Ordertable;
