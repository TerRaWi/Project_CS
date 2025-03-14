import React, { useState, useEffect } from "react";
import { getProduct, addOrderItem, getCategories } from "../api";
import { Modal, Button, Form, Container, Row, Col, Card, Badge, InputGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Addfooditem = ({ orderId, onClose, onItemAdded }) => {
    const [products, setProducts] = useState([]);
    const [categoryMap, setCategoryMap] = useState({});
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // ป้องกันการเลื่อนของ document เมื่อ modal เปิด
    useEffect(() => {
        // บันทึกค่า overflow และ position เดิมของ body
        const originalStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            width: document.body.style.width,
            height: document.body.style.height,
            top: document.body.style.top
        };
        
        // ล็อคการเลื่อนของ body
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = `-${window.scrollY}px`;
        
        // ป้องกันการเลื่อนของ Billpayment modal ด้านหลัง
        const billContainer = document.querySelector('.billContainer');
        if (billContainer) {
            billContainer.style.overflow = 'hidden';
            billContainer.style.pointerEvents = 'none';
        }
        
        // คืนค่าเดิมเมื่อ component unmount
        return () => {
            // คืนค่า scroll position
            const scrollY = document.body.style.top;
            document.body.style.overflow = originalStyle.overflow;
            document.body.style.position = originalStyle.position;
            document.body.style.width = originalStyle.width;
            document.body.style.height = originalStyle.height;
            document.body.style.top = originalStyle.top;
            
            // Restore scroll position
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
            
            // คืนค่าการทำงานของ Billpayment modal
            if (billContainer) {
                billContainer.style.overflow = 'auto';
                billContainer.style.pointerEvents = 'auto';
            }
        };
    }, []);

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

    // Main render for the modal
    return (
        <Modal 
            show={true} 
            onHide={onClose} 
            centered 
            size="xl" 
            backdrop="static" 
            keyboard={false}
        >
            <Modal.Header className="bg-warning text-white">
                <Modal.Title className="w-100 text-center">เพิ่มรายการอาหาร</Modal.Title>
                <Button 
                    variant="light" 
                    className="rounded-circle position-absolute" 
                    style={{ right: '15px', width: '35px', height: '35px', padding: '0' }}
                    onClick={onClose}
                >
                    &times;
                </Button>
            </Modal.Header>

            <Modal.Body className="px-3 pt-3 pb-0">
                <div className="mb-3 d-flex flex-column flex-md-row align-items-start align-items-md-center">
                    <div className="nav nav-pills mb-2 mb-md-0 flex-nowrap overflow-auto" style={{ maxWidth: '100%' }}>
                        <Button 
                            variant={selectedCategory === "all" ? "warning" : "light"}
                            className="me-2 text-nowrap" 
                            onClick={() => setSelectedCategory("all")}
                        >
                            ทั้งหมด
                        </Button>
                        {categories.map(categoryId => (
                            <Button
                                key={categoryId}
                                variant={selectedCategory === categoryId.toString() ? "warning" : "light"}
                                className="me-2 text-nowrap"
                                onClick={() => setSelectedCategory(categoryId.toString())}
                            >
                                {getCategoryName(categoryId)}
                            </Button>
                        ))}
                    </div>

                    <div className="ms-md-auto mt-2 mt-md-0 w-100 w-md-auto" style={{ maxWidth: '300px' }}>
                        <InputGroup>
                            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                            <Form.Control
                                placeholder="ค้นหาอาหาร"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoComplete="off"
                            />
                            {searchTerm && (
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => setSearchTerm('')}
                                >
                                    &times;
                                </Button>
                            )}
                        </InputGroup>
                    </div>
                </div>

                <Container fluid className="px-0">
                    <Row>
                        <Col md={8} className="mb-3 mb-md-0">
                            <h5 className="mb-3">รายการอาหาร</h5>
                            <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
                                <Row xs={2} sm={3} md={3} lg={4} className="g-3">
                                    {filteredProducts.map(product => (
                                        <Col key={product.id}>
                                            <Card className="h-100 shadow-sm" onClick={() => handleAddToOrder(product)} style={{ cursor: 'pointer' }}>
                                                {product.image_url ? (
                                                    <Card.Img 
                                                        variant="top" 
                                                        src={product.image_url.startsWith('/') ? `http://localhost:3001${product.image_url}` : product.image_url}
                                                        style={{ height: '130px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f8f9fa'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='20' text-anchor='middle' dominant-baseline='middle' fill='%23adb5bd'%3E" + product.name.substring(0, 1) + "%3C/text%3E%3C/svg%3E";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '130px' }}>
                                                        <span className="display-4 text-muted">{product.name.substring(0, 1)}</span>
                                                    </div>
                                                )}
                                                <Card.Body className="py-2">
                                                    <Card.Title className="fs-6 text-truncate mb-1">{product.name}</Card.Title>
                                                    <Card.Text className="text-warning fw-bold mb-0">
                                                        ฿{parseFloat(product.price).toFixed(2)}
                                                    </Card.Text>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </Col>

                        <Col md={4}>
                            <div className="bg-light rounded p-3 h-100 d-flex flex-column">
                                <h5 className="mb-3">รายการที่เลือก</h5>
                                
                                {selectedItems.length === 0 ? (
                                    <div className="text-center text-muted my-4">ยังไม่มีรายการที่เลือก</div>
                                ) : (
                                    <div className="overflow-auto flex-grow-1" style={{ maxHeight: '50vh' }}>
                                        {selectedItems.map(item => (
                                            <div key={item.id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                                <div className="d-flex flex-column" style={{ width: '40%' }}>
                                                    <span className="text-truncate">{item.name}</span>
                                                    <span className="text-muted small">฿{parseFloat(item.price).toFixed(2)}</span>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm" 
                                                        className="px-2 py-0" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChangeQuantity(item.id, item.quantity - 1);
                                                        }}
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="mx-2">{item.quantity}</span>
                                                    <Button 
                                                        variant="outline-secondary" 
                                                        size="sm" 
                                                        className="px-2 py-0" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChangeQuantity(item.id, item.quantity + 1);
                                                        }}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                                <Button 
                                                    variant="danger" 
                                                    size="sm" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveFromOrder(item.id);
                                                    }}
                                                >
                                                    ลบ
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="d-flex justify-content-between fw-bold pt-3 mt-auto border-top">
                                    <span>รวมทั้งสิ้น:</span>
                                    <span>฿{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Modal.Body>

            <Modal.Footer className="justify-content-center">
                <Button 
                    variant="success" 
                    disabled={selectedItems.length === 0 || loading} 
                    onClick={handleSubmit}
                >
                    {loading ? 'กำลังบันทึก...' : 'เพิ่มรายการ'}
                </Button>
                <Button 
                    variant="danger" 
                    disabled={loading} 
                    onClick={onClose}
                >
                    ยกเลิก
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default Addfooditem;