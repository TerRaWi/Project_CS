import React, { useState, useEffect } from "react";
// ลบการ import styles และเปลี่ยนเป็น bootstrap
// import styles from "../styles/product.module.css";
import { getProduct, getCategories, updateProductStatus } from "../api";
import Addproduct from "../components/Addproduct";
import Updateproduct from "../components/Updateproduct";
import Delproduct from "../components/Delproduct";
// เพิ่ม import bootstrap (ไม่จำเป็นถ้า import ไว้ใน _app.js หรือ main layout แล้ว)
// import 'bootstrap/dist/css/bootstrap.min.css';

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

  const handleToggleStatus = async (product) => {
    try {
      setIsLoading(true);
      const newStatus = product.status === 'A' ? 'I' : 'A';
      const updatedProduct = await updateProductStatus(product.id, newStatus);
      
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, status: updatedProduct.status } : p
        )
      );
    } catch (err) {
      setError('ไม่สามารถอัพเดทสถานะสินค้าได้');
      console.error(err);
    } finally {
      setIsLoading(false);
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
    return (
      <div className="d-flex justify-content-center align-items-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
        <span className="ms-2">กำลังโหลด...</span>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="bg-warning text-white py-2 px-3 rounded d-inline-block">จัดการเมนู</h1>
          
          <button
            onClick={() =>
              setModalState({
                type: "add",
                isVisible: true,
                selectedProduct: null,
              })
            }
            className="btn position-absolute"
            style={{ right: '50px', top: '20px' }}
            title="เพิ่มสินค้าใหม่"
          >
            <img src="/images/+.png" alt="เพิ่มสินค้าใหม่" width="50" height="50" />
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger text-center">{error}</div>}

      {modalState.isVisible && modalState.type === "add" && (
        <Addproduct
          onClose={handleCloseModal}
          onAddProduct={(newProduct) => {
            setProducts((prevProducts) => [...prevProducts, newProduct]);
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

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="col">
              <div className={`card h-100 shadow-sm ${product.status === 'I' ? 'bg-light' : ''}`}>
                <div className="position-relative">
                  {product.status === 'I' && (
                    <div className="position-absolute top-50 start-50 translate-middle bg-dark bg-opacity-75 text-white px-3 py-2 rounded fw-bold">
                      ระงับการขายชั่วคราว
                    </div>
                  )}
                  <img
                    src={`http://localhost:3001${product.image_url}`}
                    className={`card-img-top p-3 ${product.status === 'I' ? 'opacity-50' : ''}`}
                    alt={product.name}
                    style={{ height: '200px', objectFit: 'contain' }}
                  />
                  <div className="position-absolute top-0 end-0 p-2">
                    <Delproduct 
                      productId={product.id}
                      onDelete={handleDeleteSuccess}
                    />
                  </div>
                </div>
                
                <div className="card-body">
                  <p className="card-text"><strong>รหัสสินค้า:</strong> {product.id}</p>
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text"><strong>หมวดหมู่:</strong> {categories[product.category_id] || 'ไม่ระบุ'}</p>
                  <p className="card-text">
                    <strong>ราคา:</strong> ฿
                    {product.price !== null && !isNaN(product.price)
                      ? Number(product.price).toFixed(2)
                      : "N/A"}
                  </p>
                </div>
                
                <div className="card-footer bg-transparent border-top-0 d-flex justify-content-between">
                  <button
                    onClick={() => handleToggleStatus(product)}
                    className={`btn ${product.status === 'I' ? 'btn-success' : 'btn-secondary'} btn-sm`}
                  >
                    {product.status === 'A' ? 'ระงับการขาย' : 'เปิดการขาย'}
                  </button>
                  <button
                    onClick={() => handleOpenUpdateProduct(product)}
                    className="btn btn-outline-primary btn-sm"
                  >
                    แก้ไข
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center p-4">
            <p className="text-muted">ไม่มีข้อมูลสินค้า</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;