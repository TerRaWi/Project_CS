import React, { useState, useEffect } from "react";
import { addProducts, getCategories } from "../api";
// เพิ่ม import bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
// เพิ่ม useEffect เพื่อจัดการ scroll

const Addproduct = ({ onClose, onAddProduct }) => {
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  
  // จัดการ scroll lock เมื่อ modal เปิด
  useEffect(() => {
    // เมื่อ component mount ให้ล็อค scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '15px'; // ป้องกันการกระตุก
    
    // เมื่อ component unmount ให้ปลดล็อค scroll
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 1050 }}>
      <div className="modal d-block" tabIndex="-1" style={{ zIndex: 1051 }}>
        <div className="modal-dialog">
          <div className="modal-content" style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)', border: '1px solid #666' }}>
            <div className="modal-header">
              <h5 className="modal-title">เพิ่มสินค้าใหม่</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="productName" className="form-label">ชื่อสินค้า:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="productName"
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
                </div>

                <div className="mb-3">
                  <label htmlFor="productPrice" className="form-label">ราคา:</label>
                  <input
                    type="number"
                    className="form-control"
                    id="productPrice"
                    step="0.01"
                    min="0"
                    max="999999.99"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="productCategory" className="form-label">หมวดหมู่:</label>
                  <select
                    className="form-select"
                    id="productCategory"
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
                </div>

                <div className="mb-3">
                  <label htmlFor="productImage" className="form-label">รูปภาพ:</label>
                  <input
                    type="file"
                    className="form-control"
                    id="productImage"
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/gif"
                    required
                  />
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Addproduct;