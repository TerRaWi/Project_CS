import React, { useState, useEffect } from 'react';
import { getProduct, getCategories, createOrder, getImageUrl } from '../api';
import Orderview from './Orderview';

// เปลี่ยนจาก CSS Module เป็น Bootstrap
const Ordermenu = ({ table, onClose }) => {
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
                alert('ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง');
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการสั่งอาหาร:', error);
            const errorMessage = error.response?.data?.error ||
                'เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ กรุณาลองใหม่อีกครั้ง';
            alert(errorMessage);
        }
    };

    const getFilteredProducts = () => {
        let filteredProducts = products.filter(product => product.status === 'A');

        if (selectedCategory === 'all') {
            return filteredProducts;
        }
        return filteredProducts.filter(product => product.category_id === selectedCategory);
    };

    if (isLoading) {
        return (
            <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{zIndex: 1050}}>
                <div className="bg-white p-4 rounded shadow">
                    <div className="d-flex align-items-center">
                        <div className="spinner-border text-primary me-3" role="status">
                            <span className="visually-hidden">กำลังโหลด...</span>
                        </div>
                        <span>กำลังโหลด...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{zIndex: 1050}}>
            <div className="bg-white rounded shadow w-100 h-100 h-md-auto w-md-75 m-3 overflow-auto position-relative">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <h5 className="m-0 fw-bold">สั่งอาหาร - โต๊ะ {table.table_number}</h5>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>

                {/* Navigation Tabs */}
                <ul className="nav nav-tabs px-3 pt-2">
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'order' ? 'active' : ''}`}
                            onClick={() => setActiveTab('order')}
                        >
                            สั่งอาหาร
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            ประวัติการสั่ง
                        </button>
                    </li>
                </ul>

                {/* Content */}
                <div className="p-3">
                    {activeTab === 'order' ? (
                        <div className="row g-3">
                            {/* Menu Section - Left Column */}
                            <div className="col-md-8">
                                <div className="card h-100">
                                    <div className="card-header bg-light">
                                        <h5 className="card-title mb-0">รายการอาหาร</h5>
                                    </div>
                                    <div className="card-body">
                                        {/* Category Buttons */}
                                        <div className="mb-3 d-flex flex-wrap gap-2">
                                            {categories.map(category => (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    className={`btn ${selectedCategory === category.id ? 'btn-success' : 'btn-outline-secondary'}`}
                                                    onClick={() => setSelectedCategory(category.id)}
                                                >
                                                    {category.name}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Menu Grid */}
                                        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
                                            {getFilteredProducts().map(product => (
                                                <div className="col" key={product.id}>
                                                    <div 
                                                        className="card h-100 shadow-sm"
                                                        style={{cursor: 'pointer'}}
                                                        onClick={() => addToOrder(product)}
                                                    >
                                                        <div className="position-relative" style={{height: '150px'}}>
                                                            <img 
                                                                src={getImageUrl(product.image_url)}
                                                                className={`card-img-top p-3 ${product.status === 'I' ? 'opacity-50' : ''}`}
                                                                alt={product.name}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'contain'
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.onerror = null; // ป้องกันการวนซ้ำ
                                                                    e.target.src = '/images/no-image.png'; // กำหนดรูปแทนเมื่อโหลดไม่สำเร็จ
                                                                    console.log('Failed to load image:', product.image_url);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="card-body text-center">
                                                            <h6 className="card-title">{product.name}</h6>
                                                            <p className="card-text text-primary fw-bold">฿{formatPrice(product.price)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Section - Right Column */}
                            <div className="col-md-4">
                                <div className="card h-100 d-flex flex-column">
                                    <div className="card-header bg-light">
                                        <h5 className="card-title mb-0">รายการที่สั่ง</h5>
                                    </div>
                                    
                                    <div className="card-body flex-grow-1 overflow-auto">
                                        {selectedItems.length === 0 ? (
                                            <div className="text-center text-muted my-5">
                                                <i className="bi bi-cart fs-1"></i>
                                                <p className="mt-3">ยังไม่มีรายการที่สั่ง</p>
                                            </div>
                                        ) : (
                                            <div>
                                                {selectedItems.map(item => (
                                                    <div key={item.id} className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                                        <div>
                                                            <div className="fw-medium">{item.name}</div>
                                                            <div className="text-primary">฿{formatPrice(item.price)}</div>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            >
                                                                -
                                                            </button>
                                                            <span className="mx-2 fw-bold">{item.quantity}</span>
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="card-footer bg-light">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="fw-bold">รวมทั้งหมด</span>
                                            <span className="fw-bold fs-5 text-primary">฿{formatPrice(calculateTotal())}</span>
                                        </div>
                                        <button
                                            className="btn btn-success w-100"
                                            onClick={handleConfirmOrder}
                                            disabled={selectedItems.length === 0}
                                        >
                                            ยืนยันการสั่งอาหาร
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Orderview tableId={table.id} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Ordermenu;