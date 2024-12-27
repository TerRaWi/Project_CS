import { useState, useEffect } from "react";
import styles from "../styles/product.module.css";
import { getProduct } from "../api";
import Addproduct from "../components/Addproduct";
import Delproduct from "../components/Delproduct";
import Updateproduct from "../components/Updateproduct";  // เพิ่มการ import

const Products = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [isAddProductVisible, setIsAddProductVisible] = useState(false);
  const [isDeleteProductVisible, setIsDeleteProductVisible] = useState(false);
  const [isUpdateProductVisible, setIsUpdateProductVisible] = useState(false);  // เพิ่ม state
  const [selectedProduct, setSelectedProduct] = useState(null);  // เพิ่ม state
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
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

  const handleOpenAddproduct = () => {
    setIsAddProductVisible(true);
  };

  const handleCloseAddproduct = () => {
    setIsAddProductVisible(false);
  };

  const handleOpenDeleteproduct = () => {
    setIsDeleteProductVisible(true);
  };

  const handleCloseDeleteproduct = () => {
    setIsDeleteProductVisible(false);
  };

  // เพิ่มฟังก์ชันสำหรับจัดการการแก้ไขสินค้า
  const handleOpenUpdateProduct = (product) => {
    setSelectedProduct(product);
    setIsUpdateProductVisible(true);
  };

  const handleCloseUpdateProduct = () => {
    setSelectedProduct(null);
    setIsUpdateProductVisible(false);
  };

  const handleUpdateSuccess = (updatedProduct) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product
      )
    );
  };

  const handleDeleteSuccess = (deletedproductId) => {
    setProducts((prevProducts) =>
      prevProducts.filter((product) => product.id !== deletedproductId)
    );
  };

  if (isLoading) {
    return <div className="text-center p-4">กำลังโหลด...</div>;
  }

  return (
    <div>
      <h1 className={styles["heading-background"]}>จัดการเมนู</h1>

      <div className={styles["button-container"]}>
        <button
          onClick={handleOpenAddproduct}
          className={styles["image-add-button"]}
          title="เพิ่มสินค้าใหม่"
        >
          <img src="/images/+.png" alt="เพิ่มสินค้าใหม่" />
        </button>

        <button
          onClick={handleOpenDeleteproduct}
          className={styles["image-del-button"]}
          title="ลบสินค้า"
        >
          <img src="/images/-.png" alt="ลบสินค้า" />
        </button>
      </div>

      {error && <div className="text-red-500 text-center p-4">{error}</div>}

      {/* Modal สำหรับเพิ่มสินค้า */}
      {isAddProductVisible && (
        <Addproduct
          onClose={handleCloseAddproduct}
          onAddProduct={(newProduct) => {
            setProducts((prevProducts) => [...prevProducts, newProduct]);
          }}
        />
      )}

      {/* Modal สำหรับลบสินค้า */}
      {isDeleteProductVisible && (
        <Delproduct
          onClose={handleCloseDeleteproduct}
          onDeleteProduct={handleDeleteSuccess}
        />
      )}

      {/* เพิ่ม Modal สำหรับแก้ไขสินค้า */}
      {isUpdateProductVisible && selectedProduct && (
        <Updateproduct
          product={selectedProduct}
          onClose={handleCloseUpdateProduct}
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
                onError={(e) => {
                  e.target.src = "/images/default-product.png";
                }}
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
              {/* เพิ่มปุ่มแก้ไข */}
              <button
                onClick={() => handleOpenUpdateProduct(product)}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
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