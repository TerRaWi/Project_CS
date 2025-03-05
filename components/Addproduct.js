import React, { useState, useEffect } from "react";
import styles from "../styles/addproduct.module.css";
import { addProducts, getCategories } from "../api";

const Addproduct = ({ onClose, onAddProduct }) => {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        setError("เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่");
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("ขนาดไฟล์ต้องไม่เกิน 5MB");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setError("รองรับไฟล์ภาพ JPG, PNG และ GIF เท่านั้น");
        return;
      }
      setProductImage(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!productName || !productPrice || !productCategory || !productImage) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const formData = new FormData();
    formData.append("name", productName.trim());
    formData.append("price", parseFloat(productPrice));
    formData.append("category_id", productCategory);
    formData.append("image", productImage);

    try {
      const newProduct = await addProducts(formData);
      onAddProduct(newProduct);
      onClose();
    } catch (error) {
      setError(error.message || "เกิดข้อผิดพลาดในการเพิ่มสินค้า");
      console.error(error);
    }
  };

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-container"]}>
        <div className={styles["modal-content"]}>
          <h2>เพิ่มสินค้าใหม่</h2>
          {error && <div className={styles["error-message"]}>{error}</div>}
          
          <form onSubmit={handleSubmit} className={styles["product-form"]}>
            <div className={styles["form-group"]}>
              <label>
                ชื่อสินค้า:
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^[ก-๛a-zA-Z\s]*$/.test(value)) {
                      setProductName(value);
                    }
                  }}
                  maxLength={100}
                  required
                />
              </label>
            </div>

            <div className={styles["form-group"]}>
              <label>
                ราคา:
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className={styles["form-group"]}>
              <label>
                หมวดหมู่:
                <select
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  required
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles["form-group"]}>
              <label>
                รูปภาพ:
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif"
                  required
                />
              </label>
            </div>

            <div className={styles["button-group"]}>
              <button
                type="submit"
                className={`${styles["button"]} ${styles["submit"]}`}
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`${styles["button"]} ${styles["cancel"]}`}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Addproduct;