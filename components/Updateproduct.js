//ฟังก์ชั่นแก้ไขข้อมูลสินค้า //ทำงานกับหน้าproduct.jsx
import { useState, useEffect } from "react";
import { updateProduct } from "../api";
import styles from "../styles/updateproduct.module.css";

const Updateproduct = ({ product, onClose, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category_id: "",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        category_id: product.category_id,
        image: null,
      });
      setPreviewImage(
        product.image_url ? `http://localhost:3001${product.image_url}` : ""
      );
    }
  }, [product]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("category_id", formData.category_id);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      const updatedProduct = await updateProduct(product.id, formDataToSend);
      onUpdateSuccess(updatedProduct);
      onClose();
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการแก้ไขสินค้า");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles["modal-content"]}>
        <h2 className={styles["modal-title"]}>แก้ไขสินค้า</h2>
        
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              ชื่อสินค้า
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={styles["form-input"]}
                required
              />
            </label>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              ราคา
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className={styles["form-input"]}
                min="0"
                step="0.01"
                required
              />
            </label>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              หมวดหมู่
              <input
                type="text"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={styles["form-input"]}
                required
              />
            </label>
          </div>

          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>
              รูปภาพ
              <div className={styles["file-input-container"]}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={styles["file-input"]}
                />
              </div>
            </label>
            {previewImage && (
              <div className={styles["preview-container"]}>
                <img
                  src={previewImage}
                  alt="Preview"
                  className={styles["preview-image"]}
                />
              </div>
            )}
          </div>

          <div className={styles["button-group"]}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.cancel}`}
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.submit}`}
              disabled={isLoading}
            >
              {isLoading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Updateproduct;