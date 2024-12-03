import { useState, useEffect } from "react";
import styles from "../styles/product.module.css";
import AddProduct from '../components/Addproducts';
import { getProduct } from "../api";

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

  const handleOpenAddProduct = () => {
    setIsAddProductVisible(true);
  };

  const handleCloseAddProduct = () => {
    setIsAddProductVisible(false);
  };

  return (
    <div>
      <h1 className={styles["heading-background"]}>จัดการเมนู</h1>

      <button
        onClick={handleOpenAddProduct}
        className={styles["image-add-button"]}
      >
        <img src="/images/+.png" alt="เพิ่มสินค้าใหม่" />
      </button>
      
      {isAddProductVisible && (
        <AddProduct 
          onClose={handleCloseAddProduct}
          onProductAdded={fetchProducts}
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