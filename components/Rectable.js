import React, { useState, useEffect } from "react";
import styles from "../styles/rectable.module.css";
import { saveCustomerData } from "../api";

const Rectable = ({ table, onClose, onSave }) => {
  const [numSmallChildren, setNumSmallChildren] = useState(0);
  const [numChildren, setNumChildren] = useState(0);
  const [numAdults, setNumAdults] = useState(0);
  const [activeInput, setActiveInput] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNumpadClick = (value) => {
    if (activeInput === "smallChildren" && numSmallChildren.toString().length < 3) {
      setNumSmallChildren(prev => Number(`${prev}${value}`));
    } else if (activeInput === "children" && numChildren.toString().length < 3) {
      setNumChildren(prev => Number(`${prev}${value}`));
    } else if (activeInput === "adults" && numAdults.toString().length < 3) {
      setNumAdults(prev => Number(`${prev}${value}`));
    }
  };

  const handleDelete = () => {
    if (activeInput === "smallChildren") {
      setNumSmallChildren(0);
    } else if (activeInput === "children") {
      setNumChildren(0);
    } else if (activeInput === "adults") {
      setNumAdults(0);
    }
  };

  const handleBackspace = () => {
    if (activeInput === "smallChildren") {
      setNumSmallChildren(prev => Math.floor(prev / 10));
    } else if (activeInput === "children") {
      setNumChildren(prev => Math.floor(prev / 10));
    } else if (activeInput === "adults") {
      setNumAdults(prev => Math.floor(prev / 10));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace") {
      handleBackspace();
    } else if (/^\d$/.test(e.key)) {
      handleNumpadClick(Number(e.key));
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeInput]);

  const handleInputChange = (e, type) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 3) {
      if (type === "smallChildren") {
        setNumSmallChildren(Number(value));
      } else if (type === "children") {
        setNumChildren(Number(value));
      } else if (type === "adults") {
        setNumAdults(Number(value));
      }
    }
  };

  const handleConfirm = async () => {
    if (numSmallChildren === 0 && numChildren === 0 && numAdults === 0) {
      alert("กรุณาใส่จำนวนลูกค้า");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await saveCustomerData(
        table.id,
        numAdults,
        numChildren,
        numSmallChildren
      );

      if (response.success) {
        alert("บันทึกข้อมูลสำเร็จ");
        onSave({
          ...table,
          orderId: response.orderId,
          status_id: 2 // Assuming 2 is the status for occupied tables
        });
        onClose();
      } else {
        alert(response.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      console.error("Error saving customer data:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!table) return null;

  return (
    <div className={styles.rectableContainer}>
      <button 
        className={styles.closeButton} 
        onClick={onClose}
        disabled={isSubmitting}
      >
        X
      </button>
      <h2 className={styles.rectableHeader}>โต๊ะ {table.table_number}</h2>

      <div className={styles.inputSection}>
        <h3 
          className={styles.rectableContent}
          onClick={() => setActiveInput("smallChildren")}
        >
          เด็ก(เล็ก)
          <input
            type="number"
            value={numSmallChildren}
            onChange={(e) => handleInputChange(e, "smallChildren")}
            className={styles.inputField}
            disabled={isSubmitting}
          />
        </h3>

        <h3 
          className={styles.rectableContent}
          onClick={() => setActiveInput("children")}
        >
          เด็ก(โต)
          <input
            type="number"
            value={numChildren}
            onChange={(e) => handleInputChange(e, "children")}
            className={styles.inputField}
            disabled={isSubmitting}
          />
        </h3>

        <h3 
          className={styles.rectableContent}
          onClick={() => setActiveInput("adults")}
        >
          ผู้ใหญ่
          <input
            type="number"
            value={numAdults}
            onChange={(e) => handleInputChange(e, "adults")}
            className={styles.inputField}
            disabled={isSubmitting}
          />
        </h3>
      </div>

      <div className={styles.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
          <button
            key={num}
            className={styles.numpadButton}
            onClick={() => handleNumpadClick(num)}
            disabled={isSubmitting}
          >
            {num}
          </button>
        ))}
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.confirmButton} 
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังบันทึก..." : "ตกลง"}
          </button>
          <button 
            className={styles.numpadDelete} 
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
};

export default Rectable;