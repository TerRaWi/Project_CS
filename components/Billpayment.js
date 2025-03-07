import React, { useState, useEffect } from "react";
import { getBill, checkout } from "../api";
import styles from "../styles/billpayment.module.css";

const Billpayment = ({ orderId, tableNumber, onClose, onSuccess }) => {
    const [bill, setBill] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cash"); // default: cash
    const [showConfirm, setShowConfirm] = useState(false);

    // ดึงข้อมูลบิล
    useEffect(() => {
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

        fetchBill();
    }, [orderId]);

    // ฟังก์ชันชำระเงิน
    const handleCheckout = async () => {
        try {
            setIsLoading(true);
            const result = await checkout(orderId, paymentMethod);
            if (result.success) {
                // แสดง success message หรือ redirect
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

    if (isLoading) {
        return <div className={styles.loading}>กำลังโหลด...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (!bill) {
        return <div className={styles.error}>ไม่พบข้อมูลบิล</div>;
    }

    return (
        <div className={styles.billContainer}>
            <div className={styles.header}>
                <button className={styles.closeButton} onClick={onClose}>
                    X
                </button>
                <h2>ใบเสร็จรับเงิน</h2>
            </div>

            <div className={styles.billInfo}>
                <p>โต๊ะ: {tableNumber || bill.tableNumber}</p>
                <p>วันที่: {formatDateTime(bill.startTime)}</p>
                <p>เลขที่ใบเสร็จ: {orderId}</p>
            </div>

            <div className={styles.itemsContainer}>
                <table className={styles.itemsTable}>
                    <thead>
                        <tr>
                            <th>รายการ</th>
                            <th>จำนวน</th>
                            <th>ราคา/หน่วย</th>
                            <th>รวม</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.items.map((item) => (
                            <tr key={item.id}>
                                <td>{item.productName}</td>
                                <td className={styles.textCenter}>{item.quantity}</td>
                                <td className={styles.textRight}>{formatCurrency(item.unitPrice)}</td>
                                <td className={styles.textRight}>{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span>รวม:</span>
                    <span>{formatCurrency(bill.subtotal)} บาท</span>
                </div>
                <div className={styles.summaryRow}>
                    <span>ภาษีมูลค่าเพิ่ม 7%:</span>
                    <span>{formatCurrency(bill.vat)} บาท</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                    <span>ยอดรวมทั้งสิ้น:</span>
                    <span>{formatCurrency(bill.totalAmount)} บาท</span>
                </div>
            </div>

            {bill.status !== "C" && (
                <div className={styles.paymentSection}>
                    <h3>เลือกวิธีชำระเงิน</h3>
                    <div className={styles.paymentMethods}>
                        <label>
                            <input
                                type="radio"
                                value="cash"
                                checked={paymentMethod === "cash"}
                                onChange={() => setPaymentMethod("cash")}
                            />
                            เงินสด
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="transfer"
                                checked={paymentMethod === "transfer"}
                                onChange={() => setPaymentMethod("transfer")}
                            />
                            โอนเงิน
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="credit_card"
                                checked={paymentMethod === "credit_card"}
                                onChange={() => setPaymentMethod("credit_card")}
                            />
                            บัตรเครดิต
                        </label>
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

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className={styles.confirmModal}>
                    <div className={styles.confirmContent}>
                        <h3>ยืนยันการชำระเงิน</h3>
                        <p>
                            คุณต้องการชำระเงินจำนวน {formatCurrency(bill.totalAmount)} บาท
                            ด้วย{paymentMethod === "cash" ? "เงินสด" : paymentMethod === "transfer" ? "การโอนเงิน" : "บัตรเครดิต"} ใช่หรือไม่?
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
        </div>
    );
};

export default Billpayment;