import styles from "../styles/addproduct.module.css";
import { useState } from "react";

const Addproduct = ({ onClose, onAddProduct }) => {
  const [productId, setProductId] = useState("");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImage, setProductImage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductImage(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newProduct = {
      id: productId,
      name: productName,
      price: parseFloat(productPrice),
      category_id: productCategory,
      image_url: productImage ? URL.createObjectURL(productImage) : "",
    };

    onAddProduct(newProduct);
    onClose();
  };

  return (
    <div className={styles["modal"]}>
      <div className={styles["modal-content"]}>
        <h2>เพิ่มสินค้าใหม่</h2>
        <form onSubmit={handleSubmit}>
          <label>
            รหัสสินค้า:
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            />
          </label>
          <label>
            ชื่อสินค้า:
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </label>
          <label>
            ราคา:
            <input
              type="number"
              step="0.01"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              required
            />
          </label>
          <label>
            หมวดหมู่:
            <input
              type="text"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              required
            />
          </label>
          <label>
            รูปภาพ:
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              required
            />
          </label>
          <div className={styles["button-group"]}>
            <button type="submit" className={`${styles["button"]} ${styles["submit"]}`}>
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
  );
};

export default Addproduct;