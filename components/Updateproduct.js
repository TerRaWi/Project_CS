import { useState, useEffect } from "react";
import { updateProduct, getCategories } from "../api";
// ไม่จำเป็นต้องนำเข้า CSS module อีกต่อไป
// import styles from "../styles/updateproduct.module.css";

const Updateproduct = ({ product, onClose, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category_id: "",
    image: null,
  });
  const [categories, setCategories] = useState([]);
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
    fetchCategories();
    
    // ป้องกันการ scroll ของ body เมื่อ modal เปิด
    document.body.style.overflow = 'hidden';
    
    // คืนค่า scroll ให้ body เมื่อ component ถูก unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [product]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("ไม่สามารถดึงข้อมูลหมวดหมู่ได้:", err);
    }
  };

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
      const completeUpdatedProduct = {
        ...updatedProduct,
        id: product.id,
        image_url: updatedProduct.image_url || product.image_url,
        category_id: updatedProduct.category_id || product.category_id
      };
      onUpdateSuccess(completeUpdatedProduct);
      onClose();
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการแก้ไขสินค้า");
    } finally {
      setIsLoading(false);
    }
  };

  // ป้องกันการ propagation ของเหตุการณ์ wheel
  const preventScroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onWheel={preventScroll}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">แก้ไขสินค้า</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">ชื่อสินค้า</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="price" className="form-label">ราคา</label>
                <input
                  type="number"
                  className="form-control"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="category" className="form-label">หมวดหมู่</label>
                <select
                  className="form-select"
                  id="category"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
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
                <label htmlFor="image" className="form-label">รูปภาพ</label>
                <input
                  type="file"
                  className="form-control"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              {previewImage && (
                <div className="mb-3">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="img-thumbnail"
                    style={{ maxWidth: '200px' }}
                  />
                </div>
              )}
            </form>
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  กำลังบันทึก...
                </>
              ) : "บันทึก"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Updateproduct;