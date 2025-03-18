import React, { useState } from 'react';
import { deleteProduct } from "../api";
// เพิ่ม import bootstrap (ไม่จำเป็นถ้า import ไว้ใน _app.js หรือ main layout แล้ว)
// import 'bootstrap/dist/css/bootstrap.min.css';

const Delproduct = ({ productId, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (window.confirm("คุณต้องการลบสินค้านี้ใช่หรือไม่?")) {
      try {
        setIsDeleting(true);
        await deleteProduct(productId); // เรียกใช้ฟังก์ชัน deleteproducts จาก api
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
        className="btn btn-danger rounded-circle d-flex justify-content-center align-items-center"
        style={{ width: '30px', height: '30px', fontSize: '18px', padding: '0' }}
      >
        {isDeleting ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : "×"}
      </button>
      {error && <div className="text-danger small mt-1">{error}</div>}
    </>
  );
};

export default Delproduct;