import { useState, useEffect } from "react";
import styles from "../styles/product.module.css";
import { getProduct } from "../api";
import Addproduct from "../components/Addproduct";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [isAddProductVisible, setIsAddProductVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProduct();
      setProducts(data);
    } catch (err) {
      setError("ดึงข้อมูลไม่สำเร็จ");
    }
  };

  const handleOpenAddproduct = () => {
    setIsAddProductVisible(true);
  };

  const handleCloseAddproduct = () => {
    setIsAddProductVisible(false);
  };

  return (
    <div>
      <h1 className={styles["heading-background"]}>จัดการเมนู</h1>

      <button
        onClick={handleOpenAddproduct}
        className={styles["image-add-button"]}
      >
        <img src="/images/+.png" alt="เพิ่มสินค้าใหม่" />
      </button>

      {/* แสดงฟอร์ม AddProduct เมื่อ isAddProductVisible เป็น true */}
      {isAddProductVisible && (
        <Addproduct
          onClose={handleCloseAddproduct}
          onAddProduct={(newProduct) => {
            setProducts((prevProducts) => [...prevProducts, newProduct]);
          }}
        />
      )}

      <div className={styles["product-list"]}>
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className={styles["product-item"]}>
              <img
                src={product.image_url}
                className={styles["product-image"]}
                alt={product.name}
              />
              <p>
                <strong>รหัสสินค้า:</strong> {product.id}
              </p>
              <p>
                <strong>ชื่อสินค้า:</strong> {product.name}
              </p>
              <p>
                <strong>หมวดหมู่:</strong> {product.category_id}
              </p>
              <p>
                <strong>ราคา:</strong>฿
                {product.price !== null && !isNaN(product.price)
                  ? Number(product.price).toFixed(2)
                  : "N/A"}
              </p>
            </div>
          ))
        ) : (
          <p>ไม่มีข้อมูลสินค้า</p>
        )}
      </div>
    </div>
  );
};

export default Products;
