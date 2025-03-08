import React, { useState, useEffect } from "react";
import { getProduct, addOrderItem, getCategories } from "../api";
import styles from "../styles/addfooditme.module.css";

const Addfooditem = ({ orderId, onClose, onItemAdded }) => {
    const [products, setProducts] = useState([]);
    const [categoryMap, setCategoryMap] = useState({});
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // ดึงข้อมูลสินค้าและสร้างข้อมูลหมวดหมู่
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // ดึงข้อมูลสินค้า
                const productsData = await getProduct();

                // ดึงข้อมูลหมวดหมู่
                const categoriesData = await getCategories();

                // กรองเฉพาะสินค้าที่ active
                const activeProducts = productsData.filter(product => product.status === 'A');
                setProducts(activeProducts);

                // สร้าง categoryMap จากข้อมูลหมวดหมู่โดยตรง
                const catMap = {};
                categoriesData.forEach(category => {
                    catMap[category.id] = category.name;
                });
                setCategoryMap(catMap);

                // สร้างรายการ category IDs จากสินค้าที่มี
                const uniqueCategoryIds = new Set();
                activeProducts.forEach(product => {
                    if (product.category_id) {
                        uniqueCategoryIds.add(product.category_id);
                    }
                });

                setCategories(Array.from(uniqueCategoryIds));
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("ไม่สามารถโหลดข้อมูลได้");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // ฟังก์ชันแปลง category_id เป็นชื่อหมวดหมู่
    const getCategoryName = (categoryId) => {
        return categoryMap[categoryId] || `หมวดหมู่ ${categoryId}`;
    };

    // กรองสินค้าตามหมวดหมู่และคำค้นหา
    const filteredProducts = products.filter(product => {
        const matchCategory = selectedCategory === "all" ||
            product.category_id?.toString() === selectedCategory;
        const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
    });

    // เพิ่มสินค้าที่เลือกไว้ในรายการ
    const handleAddToOrder = (product) => {
        // ตรวจสอบว่ามีสินค้านี้ในรายการแล้วหรือไม่
        const existingItem = selectedItems.find(item => item.id === product.id);

        if (existingItem) {
            // ถ้ามีแล้ว เพิ่มจำนวน
            setSelectedItems(
                selectedItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
        } else {
            // ถ้ายังไม่มี เพิ่มเข้าไปใหม่
            setSelectedItems([
                ...selectedItems,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1
                }
            ]);
        }
    };

    // ลบสินค้าออกจากรายการ
    const handleRemoveFromOrder = (productId) => {
        setSelectedItems(selectedItems.filter(item => item.id !== productId));
    };

    // เปลี่ยนจำนวนสินค้า
    const handleChangeQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveFromOrder(productId);
            return;
        }

        setSelectedItems(
            selectedItems.map(item =>
                item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    // คำนวณยอดรวม
    const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // บันทึกการสั่งอาหาร
    const handleSubmit = async () => {
        if (selectedItems.length === 0) {
            alert("กรุณาเลือกรายการอาหารอย่างน้อย 1 รายการ");
            return;
        }

        setLoading(true);

        try {
            // เพิ่มรายการอาหารทีละรายการ
            for (const item of selectedItems) {
                await addOrderItem(orderId, item.id, item.quantity, item.price);
            }

            // เรียกฟังก์ชัน callback เพื่อให้ component หลักรีโหลดข้อมูล
            if (onItemAdded) {
                onItemAdded();
            }

            // ปิด modal
            onClose();
        } catch (err) {
            console.error("Error adding items:", err);
            setError(err.message || "เกิดข้อผิดพลาดในการเพิ่มรายการอาหาร");
            setLoading(false);
        }
    };

    if (loading && products.length === 0) {
        return (
            <div className={styles.modalContainer}>
                <div className={styles.modalContent}>
                    <div className={styles.loading}>กำลังโหลด...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.modalContainer}>
                <div className={styles.modalContent}>
                    <div className={styles.error}>{error}</div>
                    <button className={styles.closeButton} onClick={onClose}>ปิด</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.modalContainer}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2>เพิ่มรายการอาหาร</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.tabs}>
                        <div className={styles.tabControl}>
                            <button
                                className={`${styles.tabButton} ${selectedCategory === "all" ? styles.active : ""}`}
                                onClick={() => setSelectedCategory("all")}
                            >
                                ทั้งหมด
                            </button>
                            {categories.map(categoryId => (
                                <button
                                    key={categoryId}
                                    className={`${styles.tabButton} ${selectedCategory === categoryId.toString() ? styles.active : ""}`}
                                    onClick={() => setSelectedCategory(categoryId.toString())}
                                >
                                    {getCategoryName(categoryId)}
                                </button>
                            ))}
                        </div>

                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="ค้นหาอาหาร..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.menuContainer}>
                        <div className={styles.menuList}>
                            <h3>รายการอาหาร</h3>
                            <div className={styles.menuGrid}>
                                {filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className={styles.menuItem}
                                        onClick={() => handleAddToOrder(product)}
                                    >
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url.startsWith('/') ? `http://localhost:3001${product.image_url}` : product.image_url}
                                                alt={product.name}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.parentNode.innerHTML = `<div class="${styles.placeholderImage}">${product.name.substring(0, 1)}</div>`;
                                                }}
                                            />
                                        ) : (
                                            <div className={styles.placeholderImage}>{product.name.substring(0, 1)}</div>
                                        )}
                                        <div className={styles.menuItemInfo}>
                                            <h4>{product.name}</h4>
                                            <p>฿{parseFloat(product.price).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.orderSummary}>
                            <h3>รายการที่เลือก</h3>

                            {selectedItems.length === 0 ? (
                                <p className={styles.emptyOrder}>ยังไม่มีรายการที่เลือก</p>
                            ) : (
                                <div className={styles.orderItems}>
                                    {selectedItems.map(item => (
                                        <div key={item.id} className={styles.orderItem}>
                                            <div className={styles.orderItemInfo}>
                                                <span>{item.name}</span>
                                                <span>฿{parseFloat(item.price).toFixed(2)}</span>
                                            </div>
                                            <div className={styles.orderItemQuantity}>
                                                <button
                                                    onClick={() => handleChangeQuantity(item.id, item.quantity - 1)}
                                                >
                                                    -
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    onClick={() => handleChangeQuantity(item.id, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                className={styles.removeButton}
                                                onClick={() => handleRemoveFromOrder(item.id)}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    ))}

                                    <div className={styles.totalAmount}>
                                        <span>รวมทั้งสิ้น:</span>
                                        <span>฿{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={selectedItems.length === 0 || loading}
                    >
                        {loading ? 'กำลังบันทึก...' : 'เพิ่มรายการ'}
                    </button>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={loading}
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Addfooditem;