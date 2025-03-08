import React, { useState, useEffect } from "react";
import { getBill, checkout, updateOrderDetailStatus, getProduct } from "../api";
import styles from "../styles/billpayment.module.css";

const Billpayment = ({ orderId, tableNumber, onClose, onSuccess }) => {
    const [bill, setBill] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [showConfirm, setShowConfirm] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // ดึงข้อมูลบิล
    const fetchBill = async () => {
        try {
            setIsLoading(true);
            const data = await getBill(orderId);
            setBill(data);
            setError(null);
        } catch (err) {
            setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลบิล");
        } finally {
            setIsLoading(false);
        }
    };

    // ดึงข้อมูลสินค้า
    const fetchProducts = async () => {
        try {
            const data = await getProduct();
            // กรองเฉพาะสินค้าที่มีสถานะ Active
            setProducts(data.filter(product => product.status === 'A'));
        } catch (err) {
            console.error("Error fetching products:", err);
        }
    };

    useEffect(() => {
        fetchBill();
        fetchProducts();
    }, [orderId]);

    // ฟังก์ชันชำระเงิน
    const handleCheckout = async () => {
        try {
            setIsLoading(true);
            const result = await checkout(orderId, paymentMethod);
            if (result.success) {
                if (onSuccess) {
                    onSuccess(result);
                }
            }
        } catch (err) {
            setError(err.message || "เกิดข้อผิดพลาดในการชำระเงิน");
        } finally {
            setIsLoading(false);
            setShowConfirm(false);
        }
    };

    // ฟังก์ชันลบรายการ
    const handleRemoveItem = async (itemId) => {
        try {
            setIsLoading(true);
            // อัพเดทสถานะเป็น V (Void)
            await updateOrderDetailStatus(itemId, 'V');
            // โหลดข้อมูลบิลใหม่
            await fetchBill();
        } catch (err) {
            setError(err.message || "เกิดข้อผิดพลาดในการลบรายการ");
            setIsLoading(false);
        }
    };

    // ฟังก์ชันเพิ่มรายการ
    const handleAddItem = async () => {
        if (!selectedProduct || quantity <= 0) {
            alert("กรุณาเลือกรายการและระบุจำนวนที่ถูกต้อง");
            return;
        }

        try {
            setIsLoading(true);
            // เพิ่มรายการใหม่เข้าไปในออเดอร์
            await addOrderItem(orderId, selectedProduct.id, quantity, selectedProduct.price);
            // ปิด modal เพิ่มรายการ
            setShowAddItem(false);
            setSelectedProduct(null);
            setQuantity(1);
            // โหลดข้อมูลบิลใหม่
            await fetchBill();
        } catch (err) {
            setError(err.message || "เกิดข้อผิดพลาดในการเพิ่มรายการ");
            setIsLoading(false);
        }
    };

    // ฟังก์ชันในการจัดรูปแบบเงิน
    const formatCurrency = (amount) => {
        return amount?.toLocaleString("th-TH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // ฟังก์ชันในการจัดรูปแบบวันที่และเวลา
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("th-TH");
    };

    if (isLoading && !bill) {
        return <div className={styles.loading}>กำลังโหลด...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!bill) {
        return <div className={styles.error}>ไม่พบข้อมูลบิล</div>;
    }

    return (
        <>
            <div className={styles.modalOverlay} onClick={onClose}></div>
            <div className={styles.billContainer}>
                <div className={styles.header}>
                    <h2>ใบเสร็จรับเงิน</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        X
                    </button>
                </div>

                <div className={styles.billContent}>
                    <div className={styles.billInfo}>
                        <p>โต๊ะ: {tableNumber || bill.tableNumber}</p>
                        <p>วันที่: {formatDateTime(bill.startTime)}</p>
                        <p>เลขที่ใบเสร็จ: {orderId}</p>
                    </div>

                    {/* ปุ่มเพิ่มรายการ */}
                    {bill.status !== "C" && (
                        <div className={styles.addItemSection}>
                            <button
                                className={styles.addButton}
                                onClick={() => setShowAddItem(true)}
                            >
                                + เพิ่มรายการ
                            </button>
                        </div>
                    )}

                    <div className={styles.itemsContainer}>
                        <table className={styles.itemsTable}>
                            <thead>
                                <tr>
                                    <th>รายการ</th>
                                    <th>จำนวน</th>
                                    <th>ราคา/หน่วย</th>
                                    <th>รวม</th>
                                    {bill.status !== "C" && <th>จัดการ</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {bill.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.productName}</td>
                                        <td className={styles.textCenter}>{item.quantity}</td>
                                        <td className={styles.textRight}>{formatCurrency(item.unitPrice)}</td>
                                        <td className={styles.textRight}>{formatCurrency(item.amount)}</td>
                                        {bill.status !== "C" && (
                                            <td className={styles.textCenter}>
                                                <button
                                                    className={styles.removeButton}
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    disabled={isLoading}
                                                >
                                                    ลบ
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.summary}>
                        <div className={`${styles.summaryRow} ${styles.total}`}>
                            <span>ยอดรวมทั้งสิ้น:</span>
                            <span>{formatCurrency(bill.totalAmount)} บาท</span>
                        </div>
                    </div>

                    {bill.status !== "C" && (
                        <div className={styles.paymentSection}>
                            <h3>เลือกวิธีชำระเงิน</h3>
                            <div className={styles.paymentMethods}>
                                <div className={styles.paymentMethodItem}>
                                    <input
                                        id="cash"
                                        type="radio"
                                        value="cash"
                                        checked={paymentMethod === "cash"}
                                        onChange={() => setPaymentMethod("cash")}
                                    />
                                    <label htmlFor="cash">เงินสด</label>
                                </div>
                                <div className={styles.paymentMethodItem}>
                                    <input
                                        id="transfer"
                                        type="radio"
                                        value="transfer"
                                        checked={paymentMethod === "transfer"}
                                        onChange={() => setPaymentMethod("transfer")}
                                    />
                                    <label htmlFor="transfer">โอนเงิน</label>
                                </div>
                                <div className={styles.paymentMethodItem}>
                                    <input
                                        id="credit_card"
                                        type="radio"
                                        value="credit_card"
                                        checked={paymentMethod === "credit_card"}
                                        onChange={() => setPaymentMethod("credit_card")}
                                    />
                                    <label htmlFor="credit_card">บัตรเครดิต</label>
                                </div>
                            </div>

                            <div className={styles.actionButtons}>
                                <button
                                    className={styles.payButton}
                                    onClick={() => setShowConfirm(true)}
                                    disabled={isLoading}
                                >
                                    ชำระเงิน
                                </button>
                                <button className={styles.cancelButton} onClick={onClose}>
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modal ยืนยันการชำระเงิน */}
                    {showConfirm && (
                        <div className={styles.confirmModal}>
                            <div className={styles.confirmContent}>
                                <h3>ยืนยันการชำระเงิน</h3>
                                <p>
                                    คุณต้องการชำระเงินจำนวน <strong>{formatCurrency(bill.totalAmount)} บาท</strong>
                                    <br />ด้วย<strong>{paymentMethod === "cash" ? "เงินสด" : paymentMethod === "transfer" ? "การโอนเงิน" : "บัตรเครดิต"}</strong> ใช่หรือไม่?
                                </p>
                                <div className={styles.confirmButtons}>
                                    <button
                                        className={styles.confirmButton}
                                        onClick={handleCheckout}
                                        disabled={isLoading}
                                    >
                                        ยืนยัน
                                    </button>
                                    <button
                                        className={styles.cancelButton}
                                        onClick={() => setShowConfirm(false)}
                                        disabled={isLoading}
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal เพิ่มรายการอาหาร */}
                    {showAddItem && (
                        <div className={styles.confirmModal}>
                            <div className={styles.confirmContent}>
                                <h3>เพิ่มรายการอาหาร</h3>
                                <div className={styles.formGroup}>
                                    <label>เลือกรายการ:</label>
                                    <select
                                        value={selectedProduct ? selectedProduct.id : ""}
                                        onChange={(e) => {
                                            const product = products.find(p => p.id.toString() === e.target.value);
                                            setSelectedProduct(product || null);
                                        }}
                                    >
                                        <option value="">-- เลือกรายการ --</option>
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} - {formatCurrency(product.price)} บาท
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>จำนวน:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <div className={styles.confirmButtons}>
                                    <button
                                        className={styles.confirmButton}
                                        onClick={handleAddItem}
                                        disabled={isLoading || !selectedProduct}
                                    >
                                        เพิ่มรายการ
                                    </button>
                                    <button
                                        className={styles.cancelButton}
                                        onClick={() => setShowAddItem(false)}
                                        disabled={isLoading}
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Billpayment;