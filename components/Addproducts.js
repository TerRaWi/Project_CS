import React, { useState } from 'react';
import axios from 'axios';
import styles from "../styles/product.module.css";

const AddProduct = ({ onClose, onProductAdded }) => {
  const [productData, setProductData] = useState({
    id: '',
    name: '',
    price: '',
    category: '',
    image: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProductData(prev => ({
      ...prev,
      image: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('id', productData.id);
    formData.append('name', productData.name);
    formData.append('price', productData.price);
    formData.append('category', productData.category);
    if (productData.image) {
      formData.append('image', productData.image);
    }

    try {
      const response = await axios.post('http://localhost:3001/api/product', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 201) {
        alert('เพิ่มสินค้าสำเร็จ');
        onProductAdded();
        onClose();
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      alert('เพิ่มสินค้าไม่สำเร็จ');
    }
  };

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-content"]}>
        <h2>เพิ่มสินค้าใหม่</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>รหัสสินค้า:</label>
            <input
              type="text"
              name="id"
              value={productData.id}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>ชื่อสินค้า:</label>
            <input
              type="text"
              name="name"
              value={productData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>ราคา:</label>
            <input
              type="number"
              name="price"
              value={productData.price}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>หมวดหมู่:</label>
            <input
              type="text"
              name="category"
              value={productData.category}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>เลือกรูปภาพ:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
          </div>
          <div>
            <button type="submit">บันทึก</button>
            <button type="button" onClick={onClose}>ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;