import React, { useState, useEffect } from 'react';
import { getProduct, getCategories, createOrder, getOrdersByTable } from '../api';
import styles from '../styles/ordermenu.module.css';
import OrderView from './OrderView';

const OrderMenu = ({ table, onClose }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('order'); 

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProduct(),
        getCategories()
      ]);
      setProducts(productsData);
      setCategories([
        { id: 'all', name: 'ทั้งหมด' },
        ...categoriesData
      ]);
      setError('');
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    return Number(price).toFixed(2);
  };

  const addToOrder = (product) => {
    setSelectedItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromOrder = (productId) => {
    setSelectedItems(prev => 
      prev.filter(item => item.id !== productId)
    );
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromOrder(productId);
      return;
    }
    
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => 
      total + (Number(item.price || 0) * item.quantity), 0
    );
  };

  const handleConfirmOrder = async () => {
    if (selectedItems.length === 0) {
      alert('กรุณาเลือกรายการอาหาร');
      return;
    }

    try {
      const orderItems = selectedItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        name: item.name
      }));

      const response = await createOrder(
        table.id,
        orderItems
      );
      
      if (response && response.orderId) {
        alert('สั่งอาหารสำเร็จ');
        setSelectedItems([]);
        setActiveTab('history');
      } else {
        throw new Error('ไม่ได้รับ order ID จากเซิร์ฟเวอร์');
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการสั่งอาหาร:', error);
      alert(error.response?.data?.error || 'เกิดข้อผิดพลาดในการสั่งอาหาร กรุณาลองใหม่อีกครั้ง');
    }
  };

  const getFilteredProducts = () => {
    if (selectedCategory === 'all') {
      return products;
    }
    return products.filter(product => product.category_id === selectedCategory);
  };

  if (isLoading) {
    return <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>กำลังโหลด...</div>
    </div>;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2 className={styles.title}>สั่งอาหาร - โต๊ะ {table.id}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className="mb-4 border-b">
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 ${activeTab === 'order' 
                ? 'border-b-2 border-green-500 text-green-600' 
                : 'text-gray-500'}`}
              onClick={() => setActiveTab('order')}
            >
              สั่งอาหาร
            </button>
            <button
              className={`px-4 py-2 ${activeTab === 'history' 
                ? 'border-b-2 border-green-500 text-green-600' 
                : 'text-gray-500'}`}
              onClick={() => setActiveTab('history')}
            >
              ประวัติการสั่ง
            </button>
          </div>
        </div>

        {activeTab === 'order' ? (
          <div className={styles.content}>
            <div className={styles.menuSection}>
              <h3>รายการอาหาร</h3>
              
              <div className={styles.categoryTabs}>
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`${styles.categoryTab} ${selectedCategory === category.id ? styles.active : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className={styles.menuGrid}>
                {getFilteredProducts().map(product => (
                  <div 
                    key={product.id} 
                    className={styles.menuItem}
                    onClick={() => addToOrder(product)}
                  >
                    <img 
                      src={`http://localhost:3001${product.image_url}`}
                      alt={product.name}
                      className={styles.menuImage}
                    />
                    <div className={styles.menuName}>{product.name}</div>
                    <div className={styles.menuPrice}>฿{formatPrice(product.price)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.orderSection}>
              <h3>รายการที่สั่ง</h3>
              <div className={styles.orderList}>
                {selectedItems.length === 0 ? (
                  <p>ยังไม่มีรายการที่สั่ง</p>
                ) : (
                  <>
                    {selectedItems.map(item => (
                      <div key={item.id} className={styles.orderItem}>
                        <div>
                          <div>{item.name}</div>
                          <div>฿{formatPrice(item.price)}</div>
                        </div>
                        <div className={styles.quantityControl}>
                          <button 
                            className={styles.quantityButton}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button 
                            className={styles.quantityButton}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className={styles.total}>
                      <span>รวมทั้งหมด</span>
                      <span>฿{formatPrice(calculateTotal())}</span>
                    </div>
                  </>
                )}
              </div>
              <button 
                className={styles.confirmButton}
                onClick={handleConfirmOrder}
                disabled={selectedItems.length === 0}
              >
                ยืนยันการสั่งอาหาร
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <OrderView tableId={table.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderMenu;