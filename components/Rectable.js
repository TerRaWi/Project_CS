import React, { useState, useEffect } from "react";
import styles from "../styles/rectable.module.css";
import { saveCustomerData } from "../api";

const Rectable = ({ table, onClose, onSave }) => {
  // สร้าง state เพื่อติดตามจำนวนของเด็กเล็ก, เด็กโต และผู้ใหญ่
  const [numSmallChildren, setNumSmallChildren] = useState(0);
  const [numChildren, setNumChildren] = useState(0);
  const [numAdults, setNumAdults] = useState(0);
  const [activeInput, setActiveInput] = useState(null);

  const handleNumpadClick = (value) => {
    if (
      activeInput === "smallChildren" &&
      numSmallChildren.toString().length < 3
    ) {
      setNumSmallChildren((prev) => Number(`${prev}${value}`));
    } else if (
      activeInput === "children" &&
      numChildren.toString().length < 3
    ) {
      setNumChildren((prev) => Number(`${prev}${value}`));
    } else if (activeInput === "adults" && numAdults.toString().length < 3) {
      setNumAdults((prev) => Number(`${prev}${value}`));
    }
  };

  // ฟังก์ชันที่เรียกเมื่อมีการกดปุ่มลบ (Backspace)
  const handleKeyDown = (e) => {
    if (e.key === "Backspace") {
      if (activeInput === "smallChildren") {
        setNumSmallChildren((prev) => Math.floor(prev / 10));
      } else if (activeInput === "children") {
        setNumChildren((prev) => Math.floor(prev / 10));
      } else if (activeInput === "adults") {
        setNumAdults((prev) => Math.floor(prev / 10));
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeInput]);

  const handleDelete = () => {
    if (activeInput === "smallChildren") {
      setNumSmallChildren(0);
    } else if (activeInput === "children") {
      setNumChildren(0);
    } else if (activeInput === "adults") {
      setNumAdults(0);
    }
  };

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

    const totalCount = numSmallChildren + numChildren + numAdults;

    try {
      const response = await saveCustomerData(
        table.id,
        numAdults,
        numChildren,
        numSmallChildren,
        totalCount
      );
      console.log("Data sent to API:", {
        id: table.id,
        adultCount: numAdults,
        oldChildCount: numChildren,
        childCount: numSmallChildren,
        count: totalCount
      });
      console.log("Response received:", response);

      alert("บันทึกข้อมูลสำเร็จ");
      onSave(response);  // ส่งข้อมูลที่อัพเดทกลับไปยัง parent component
      onClose();
    } catch (error) {
      console.error("Error saving customer data:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  if (!table) return null;

  return (
    <div className={styles.rectableContainer}>
      <button className={styles.closeButton} onClick={onClose}>
        X
      </button>
      <h2 className={styles.rectableHeader}>โต๊ะ {table.id}</h2>

      {/* Input เด็ก(เล็ก) */}
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
        />
      </h3>

      {/* Input เด็ก(โต) */}
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
        />
      </h3>

      {/* Input ผู้ใหญ่ */}
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
        />
      </h3>

      {/* Numpad for input */}
      <div className={styles.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
          <button
            key={num}
            className={styles.numpadButton}
            onClick={() => handleNumpadClick(num)}
          >
            {num}
          </button>
        ))}
        {/* ปุ่มตกลงและปุ่มลบ */}
        <div className={styles.actionButtons}>
          <button className={styles.confirmButton} onClick={handleConfirm}>
            ตกลง
          </button>
          <button className={styles.numpadDelete} onClick={handleDelete}>
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
};
export default Rectable;