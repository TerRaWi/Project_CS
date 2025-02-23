//ฟังก์ชั่นสร้างสินค้า //ทำงานกับหน้า product.jsx
import { useState } from "react";
import styles from "../styles/addproduct.module.css";
import { addproducts } from "../api";

const Addproduct = ({ onClose, onAddProduct }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", productName);
    formData.append("price", parseFloat(productPrice));
    formData.append("category_id", productCategory);
    if (productImage) {
      formData.append("image", productImage);
    }

    try {
      const newProduct = await addproducts(formData);
      onAddProduct(newProduct);
      onClose();
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเพิ่มสินค้า:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มสินค้า");
    }
  };

  return (
    <div className={styles["modal"]}>
      <div className={styles["modal-content"]}>
        <h2>เพิ่มสินค้าใหม่</h2>
        <form onSubmit={handleSubmit}>
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
              required
            />
          </label>
          <label>
            ราคา:
            <input
              type="number"
              step="1.00"
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
  );
};

export default Addproduct;