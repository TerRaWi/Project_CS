import React, { useState } from 'react';
import { deleteproducts } from "../api";

const Delproduct = ({ onClose, onDeleteProduct }) => {
  const [productId, setProductId] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!productId.trim()) {
      setError('กรุณาระบุรหัสสินค้าที่ต้องการลบ');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      
      await deleteproducts(productId);
      onDeleteProduct(productId);
      onClose();
    } catch (err) {
      setError(err.message || 'ไม่สามารถลบสินค้าได้ กรุณาตรวจสอบรหัสสินค้า');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">ลบสินค้า</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="productId" className="block text-sm font-medium mb-2">
              รหัสสินค้า
            </label>
            <input
              type="text"
              id="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="กรุณาใส่รหัสสินค้าที่ต้องการลบ"
            />
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
            >
              {isDeleting ? 'กำลังลบ...' : 'ลบสินค้า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Delproduct;