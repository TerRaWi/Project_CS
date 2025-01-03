import { useState, useEffect } from "react";
import { updateProduct } from "../api";
import styles from "../styles/product.module.css";

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
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 ${styles.modal}`}
    >
      <div className="bg-white p-4 rounded max-w-md w-full mx-4">
        <h2 className="text-xl mb-4">แก้ไขสินค้า</h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block">ชื่อสินค้า:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border p-2 mb-2"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block">ราคา:</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full border p-2 mb-2"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block">หมวดหมู่:</label>
            <input
              type="text"
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="w-full border p-2 mb-2"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block">รูปภาพ:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full mb-2"
            />
            {previewImage && (
              <img
                src={previewImage}
                alt="Preview"
                className="mt-2 max-w-[200px]"
              />
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded"
              disabled={isLoading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
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