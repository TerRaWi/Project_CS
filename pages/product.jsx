import { useState, useEffect } from "react";
import styles from "../styles/product.module.css";
import { getProduct, getCategories } from "../api";
import Addproduct from "../components/Addproduct";
import Updateproduct from "../components/Updateproduct";
import Delproduct from "../components/Delproduct";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [error, setError] = useState("");
  const [modalState, setModalState] = useState({
    type: null,
    isVisible: false,
    selectedProduct: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getProduct();
      setProducts(data);
      setError("");
    } catch (err) {
      setError("ดึงข้อมูลไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await getCategories();
      const categoryMap = {};
      categoriesData.forEach(cat => {
        categoryMap[cat.id] = cat.name;
      });
      setCategories(categoryMap);
    } catch (err) {
      console.error("ไม่สามารถดึงข้อมูลหมวดหมู่ได้:", err);
    }
  };

  const handleDeleteSuccess = (deletedProductId) => {
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== deletedProductId)
    );
  };

  const handleOpenUpdateProduct = (product) => {
    setModalState({
      type: "update",
      isVisible: true,
      selectedProduct: product,
    });
  };

  const handleCloseModal = () => {
    setModalState({
      type: null,
      isVisible: false,
      selectedProduct: null,
    });
  };

  const handleUpdateSuccess = (updatedProduct) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === updatedProduct.id
          ? {
              ...product,
              ...updatedProduct,
              name: updatedProduct.name,
              price: updatedProduct.price,
              category_id: updatedProduct.category_id,
              image_url: updatedProduct.image_url || product.image_url
            }
          : product
      )
    );
    handleCloseModal();
  };

  if (isLoading) {
    return <div className="text-center p-4">กำลังโหลด...</div>;
  }

  return (
    <div>
      <h1 className={styles["heading-background"]}>จัดการเมนู</h1>

      <div className={styles["button-container"]}>
        <button
          onClick={() =>
            setModalState({
              type: "add",
              isVisible: true,
              selectedProduct: null,
            })
          }
          className={styles["image-add-button"]}
          title="เพิ่มสินค้าใหม่"
        >
          <img src="/images/+.png" alt="เพิ่มสินค้าใหม่" />
        </button>
      </div>

      {error && <div className="text-red-500 text-center p-4">{error}</div>}

      {modalState.isVisible && modalState.type === "add" && (
        <Addproduct
          onClose={handleCloseModal}
          onAddProduct={(newProduct) => {
            setProducts((prevProducts) => [...prevProducts, newProduct]);
            fetchProducts();
            handleCloseModal();
          }}
        />
      )}

      {modalState.isVisible &&
        modalState.type === "update" &&
        modalState.selectedProduct && (
          <Updateproduct
            product={modalState.selectedProduct}
            onClose={handleCloseModal}
            onUpdateSuccess={handleUpdateSuccess}
          />
        )}

      <div className={styles["product-list"]}>
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className={styles["product-item"]}>
              <img
                src={`http://localhost:3001${product.image_url}`}
                className={styles["product-image"]}
                alt={product.name}
              />
              <Delproduct 
                productId={product.id}
                onDelete={handleDeleteSuccess}
              />
              <p>
                <strong>รหัสสินค้า:</strong> {product.id}
              </p>
              <p>
                <strong>ชื่อสินค้า:</strong> {product.name}
              </p>
              <p>
                <strong>หมวดหมู่:</strong> {categories[product.category_id] || 'ไม่ระบุ'}
              </p>
              <p>
                <strong>ราคา:</strong>฿
                {product.price !== null && !isNaN(product.price)
                  ? Number(product.price).toFixed(2)
                  : "N/A"}
              </p>
              <button
                onClick={() => handleOpenUpdateProduct(product)}
                className={styles["edit-product"]}
              >
                แก้ไข
              </button>
            </div>
          ))
        ) : (
          <p className="text-center p-4">ไม่มีข้อมูลสินค้า</p>
        )}
      </div>
    </div>
  );
};

export default Products;