import React, { useState } from 'react';
import styles from "../styles/product.module.css";
import { deleteproducts } from "../api"; // import ฟังก์ชัน deleteproducts

const Delproduct = ({ productId, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (window.confirm("คุณต้องการลบสินค้านี้ใช่หรือไม่?")) {
      try {
        setIsDeleting(true);
        await deleteproducts(productId); // เรียกใช้ฟังก์ชัน deleteproducts จาก api
        onDelete(productId);
        setError(""); // เคลียร์ error message ถ้าสำเร็จ
      } catch (err) {
        setError(err.message || "ไม่สามารถลบสินค้าได้");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={styles["delete-button"]}
      >
        {isDeleting ? "..." : "×"}
      </button>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </>
  );
};

export default Delproduct;