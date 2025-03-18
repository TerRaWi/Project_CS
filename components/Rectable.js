import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
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
    <div className="card shadow rounded-4 p-4 position-relative" style={{ width: "350px", minHeight: "450px" }}>
      <button 
        className="btn btn-danger position-absolute"
        style={{ top: "10px", right: "10px", padding: "5px 10px" }}
        onClick={onClose}
        disabled={isSubmitting}
      >
        X
      </button>
      
      <h2 className="fw-bold mb-4 mt-2">โต๊ะ {table.table_number}</h2>

      <div className="mb-4">
        <div 
          className="d-flex justify-content-between align-items-center mb-4"
          onClick={() => setActiveInput("smallChildren")}
        >
          <h5 className="mb-0">เด็ก(เล็ก)</h5>
          <input
            type="number"
            value={numSmallChildren}
            onChange={(e) => handleInputChange(e, "smallChildren")}
            className="form-control text-center"
            style={{ width: "80px" }}
            disabled={isSubmitting}
          />
        </div>

        <div 
          className="d-flex justify-content-between align-items-center mb-4"
          onClick={() => setActiveInput("children")}
        >
          <h5 className="mb-0">เด็ก(โต)</h5>
          <input
            type="number"
            value={numChildren}
            onChange={(e) => handleInputChange(e, "children")}
            className="form-control text-center"
            style={{ width: "80px" }}
            disabled={isSubmitting}
          />
        </div>

        <div 
          className="d-flex justify-content-between align-items-center mb-4"
          onClick={() => setActiveInput("adults")}
        >
          <h5 className="mb-0">ผู้ใหญ่</h5>
          <input
            type="number"
            value={numAdults}
            onChange={(e) => handleInputChange(e, "adults")}
            className="form-control text-center"
            style={{ width: "80px" }}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="mt-auto">
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
            <button
              key={num}
              className="btn btn-light border"
              style={{ width: "50px", height: "50px", fontSize: "18px" }}
              onClick={() => handleNumpadClick(num)}
              disabled={isSubmitting}
            >
              {num}
            </button>
          ))}
        </div>
        
        <div className="d-flex justify-content-center gap-3">
          <button 
            className="btn btn-success"
            style={{ width: "100px", height: "50px", fontSize: "18px" }}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "กำลังบันทึก..." : "ตกลง"}
          </button>
          <button 
            className="btn btn-danger"
            style={{ width: "100px", height: "50px", fontSize: "18px" }}
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