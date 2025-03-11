import React, { useState, useEffect, useRef } from "react";
import { getBill, checkout, updateOrderDetailStatus } from "../api";
import Addfooditem from "./Addfooditem";
import styles from "../styles/billpayment.module.css";
import QRCode from "qrcode";
import generatePayload from "promptpay-qr";

const Billpayment = ({ orderId, tableNumber, onClose, onSuccess }) => {
    const [bill, setBill] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [showConfirm, setShowConfirm] = useState(false);
    const [showAddFood, setShowAddFood] = useState(false);
    const [processingItems, setProcessingItems] = useState(0);
    const [completedItems, setCompletedItems] = useState(0);
    const [processingTotal, setProcessingTotal] = useState(0);
    const [completedTotal, setCompletedTotal] = useState(0);
    const [qrCodeURL, setQrCodeURL] = useState(null);
    const [showQRCode, setShowQRCode] = useState(false);
    const [promptPayNumber, setPromptPayNumber] = useState("0123456789");
    const qrCanvasRef = useRef(null);

    // ดึงข้อมูลบิล
    const fetchBill = async () => {
        try {
            setIsLoading(true);
            const data = await getBill(orderId);
            setBill(data);

            // คำนวณจำนวนรายการและยอดเงินตามสถานะ
            let pItems = 0;
            let cItems = 0;
            let pTotal = 0;
            let cTotal = 0;

            data.items.forEach(item => {
                if (item.status === 'P') {
                    pItems++;
                    pTotal += item.amount;
                } else if (item.status === 'C') {
                    cItems++;
                    cTotal += item.amount;
                }
            });

            setProcessingItems(pItems);
            setCompletedItems(cItems);
            setProcessingTotal(pTotal);
            setCompletedTotal(cTotal);

            setError(null);
        } catch (err) {
            setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลบิล");
        } finally {
            setIsLoading(false);
        }
    };

    // สร้าง QR Code สำหรับ PromptPay พร้อมโลโก้
    const generateQRCodeWithLogo = async (amount) => {
        try {
            // 1. สร้าง payload สำหรับ PromptPay
            const payload = generatePayload(promptPayNumber, { amount: amount });

            // 2. สร้าง QR Code ปกติ
            const qrCodeDataURL = await QRCode.toDataURL(payload, {
                width: 400,
                margin: 4,
                errorCorrectionLevel: 'H' // ต้องใช้ระดับแก้ไขความผิดพลาดสูง เพื่อให้สามารถอ่านได้แม้มีโลโก้
            });

            // 3. สร้าง canvas เพื่อวาดภาพ QR Code และโลโก้
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const qrSize = 400;
            canvas.width = qrSize;
            canvas.height = qrSize;

            // 4. โหลดรูปภาพ QR Code
            const qrImage = new Image();
            qrImage.src = qrCodeDataURL;

            // รอให้ QR Code โหลดเสร็จ
            await new Promise(resolve => {
                qrImage.onload = resolve;
            });

            // 5. วาด QR Code ลงบน canvas
            ctx.drawImage(qrImage, 0, 0, qrSize, qrSize);

            // 6. โหลดรูปภาพโลโก้
            const logoImage = new Image();
            logoImage.src = '/images/logo.jpg';

            // รอให้โลโก้โหลดเสร็จ
            await new Promise((resolve, reject) => {
                logoImage.onload = resolve;
                // กรณีโหลดไม่สำเร็จ ให้ใช้ QR Code ปกติแทน
                logoImage.onerror = () => {
                    console.error('ไม่สามารถโหลดโลโก้ได้ ใช้ QR Code ปกติแทน');
                    resolve();
                };
            });

            // 7. ถ้าโลโก้โหลดสำเร็จ ให้วาดโลโก้ลงบน QR Code
            if (logoImage.complete && logoImage.naturalHeight !== 0) {
                // คำนวณขนาดและตำแหน่งของโลโก้ (ประมาณ 20% ของ QR Code)
                const logoSize = qrSize * 0.2;
                const logoPosition = (qrSize - logoSize) / 2;

                // วาดพื้นหลังสีขาวสำหรับโลโก้
                ctx.fillStyle = 'white';
                ctx.fillRect(logoPosition, logoPosition, logoSize, logoSize);

                // วาดโลโก้ลงบน canvas
                ctx.drawImage(logoImage, logoPosition, logoPosition, logoSize, logoSize);
            }

            // 8. แปลง canvas เป็น data URL
            const finalQRCode = canvas.toDataURL();
            setQrCodeURL(finalQRCode);
            setShowQRCode(true);
        } catch (err) {
            console.error("Error generating QR code with logo:", err);
            setError("เกิดข้อผิดพลาดในการสร้าง QR Code");
        }
    };

    // ปรับปรุง useEffect เพื่อจัดการ overflow ของ body
    useEffect(() => {
        // บันทึกค่า overflow และ position เดิมของ body
        const originalStyle = {
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            width: document.body.style.width,
            height: document.body.style.height,
            top: document.body.style.top
        };

        // ปิดการเลื่อนของ body เมื่อ modal เปิด
        document.body.style.overflow = 'hidden';

        // คืนค่าเดิมเมื่อ component unmount
        return () => {
            document.body.style.overflow = originalStyle.overflow;
            document.body.style.position = originalStyle.position;
            document.body.style.width = originalStyle.width;
            document.body.style.height = originalStyle.height;
            document.body.style.top = originalStyle.top;

            // Restore scroll position ถ้ามี
            if (originalStyle.top) {
                window.scrollTo(0, parseInt(originalStyle.top || '0') * -1);
            }
        };
    }, []);

    // ดึงข้อมูลบิลเมื่อ component ถูกโหลดหรือ orderId เปลี่ยน
    useEffect(() => {
        fetchBill();
    }, [orderId]);

    // ตรวจสอบการเปลี่ยนแปลงสถานะของ modal และจัดการ overflow ตามความเหมาะสม
    useEffect(() => {
        const billContainer = document.querySelector(`.${styles.billContainer}`);

        if (showAddFood || showConfirm || showQRCode) {
            // ถ้ามี modal ใดๆ เปิดอยู่ ให้หยุดการทำงานของ billContainer
            if (billContainer) {
                billContainer.style.overflow = 'hidden';
                billContainer.style.pointerEvents = 'none';
                billContainer.classList.add(styles.disabled);
            }
        } else {
            // ถ้าไม่มี modal เปิดอยู่ ให้ใช้งาน billContainer ได้ตามปกติ
            if (billContainer) {
                billContainer.style.overflow = 'auto';
                billContainer.style.pointerEvents = 'auto';
                billContainer.classList.remove(styles.disabled);
            }
        }
    }, [showAddFood, showConfirm, showQRCode, styles.billContainer, styles.disabled]);

    // ฟังก์ชันเริ่มกระบวนการชำระเงินเมื่อกดปุ่ม "ชำระเงิน"
    const handleStartPayment = async () => {
        // ตรวจสอบว่ามีรายการที่กำลังทำอยู่หรือไม่
        if (processingItems > 0) {
            if (!window.confirm(`มีรายการอาหารที่ยังอยู่ในสถานะ "กำลังทำ" จำนวน ${processingItems} รายการ (${formatCurrency(processingTotal)} บาท) ระบบจะเปลี่ยนเป็นสถานะ "เสร็จแล้ว"  ต้องการดำเนินการต่อหรือไม่?`)) {
                return;
            }

            // อัพเดทสถานะรายการที่กำลังทำให้เป็นเสร็จสิ้น
            try {
                setIsLoading(true);
                // ทำการอัพเดทสถานะทีละรายการ
                for (const item of bill.items) {
                    if (item.status === 'P') {
                        await updateOrderDetailStatus(item.id, 'C');
                    }
                }
                // รีโหลดข้อมูลบิลหลังจากอัพเดทสถานะ
                await fetchBill();
                setIsLoading(false);
            } catch (err) {
                setError(err.message || "เกิดข้อผิดพลาดในการอัพเดทสถานะรายการ");
                setIsLoading(false);
                handleCloseConfirm();
                return;
            }
        }

        // เปิดหน้าจอ QR Code ถ้าผู้ใช้เลือกชำระด้วย PromptPay
        if (paymentMethod === "promptpay") {
            setShowConfirm(false);
            await generateQRCodeWithLogo(bill.totalAmount); // เรียกใช้ฟังก์ชันสร้าง QR Code พร้อมโลโก้
        } else {
            // ถ้าเป็นวิธีการชำระเงินอื่น ให้ดำเนินการตามปกติ
            handleCheckout();
        }
    };

    // ฟังก์ชันชำระเงิน (หลังจากตรวจสอบรายการที่กำลังทำแล้ว)
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
            handleCloseConfirm();
            setShowQRCode(false);
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

    // ฟังก์ชันสำหรับจัดการเมื่อเพิ่มรายการอาหารสำเร็จ
    const handleItemAdded = async () => {
        await fetchBill(); // โหลดข้อมูลบิลใหม่
    };

    // ฟังก์ชันเปิด modal เพิ่มรายการอาหาร
    const handleOpenAddFood = () => {
        setShowAddFood(true);
    };

    // ฟังก์ชันปิด modal เพิ่มรายการอาหาร
    const handleCloseAddFood = () => {
        setShowAddFood(false);
    };

    // ฟังก์ชันเปิด modal ยืนยันการชำระเงิน
    const handleOpenConfirm = () => {
        setShowConfirm(true);

        // หยุดการเลื่อนของ billContainer
        const billContainer = document.querySelector(`.${styles.billContainer}`);
        if (billContainer) {
            billContainer.style.overflow = 'hidden';
            billContainer.style.pointerEvents = 'none';
            billContainer.classList.add(styles.disabled);
        }
    };

    // ฟังก์ชันปิด modal ยืนยันการชำระเงิน
    const handleCloseConfirm = () => {
        setShowConfirm(false);

        // คืนค่าการเลื่อนของ billContainer ถ้าไม่มี modal อื่นเปิดอยู่
        if (!showAddFood && !showQRCode) {
            const billContainer = document.querySelector(`.${styles.billContainer}`);
            if (billContainer) {
                billContainer.style.overflow = 'auto';
                billContainer.style.pointerEvents = 'auto';
                billContainer.classList.remove(styles.disabled);
            }
        }
    };

    // ฟังก์ชันปิด modal QR Code
    const handleCloseQRCode = () => {
        setShowQRCode(false);

        // คืนค่าการเลื่อนของ billContainer ถ้าไม่มี modal อื่นเปิดอยู่
        if (!showAddFood && !showConfirm) {
            const billContainer = document.querySelector(`.${styles.billContainer}`);
            if (billContainer) {
                billContainer.style.overflow = 'auto';
                billContainer.style.pointerEvents = 'auto';
                billContainer.classList.remove(styles.disabled);
            }
        }
    };

    // ฟังก์ชันสำหรับดาวน์โหลด QR Code
    const handleDownloadQRCode = () => {
        if (qrCodeURL) {
            const link = document.createElement('a');
            link.href = qrCodeURL;
            link.download = `fast-shabu-promptpay-${bill.totalAmount}-thb.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // ฟังก์ชันยืนยันการชำระเงินด้วย PromptPay
    const handlePromptPayConfirm = async () => {
        try {
            setIsLoading(true);
            const result = await checkout(orderId, 'promptpay');
            setShowQRCode(false);
            if (result.success) {
                if (onSuccess) {
                    onSuccess(result);
                }
            }
        } catch (err) {
            setError(err.message || "เกิดข้อผิดพลาดในการชำระเงิน");
        } finally {
            setIsLoading(false);
        }
    };

    // ฟังก์ชันป้องกันการ propagate ของ event
    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    // ฟังก์ชันการปิดโมดัลหลัก (Billpayment)
    const handleClose = () => {
        document.body.style.overflow = 'auto';
        onClose();
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

    // ฟังก์ชันแสดงสถานะรายการ
    const renderStatus = (status) => {
        switch (status) {
            case 'P':
                return <span className={styles.statusProcessing}>กำลังทำ</span>;
            case 'C':
                return <span className={styles.statusCompleted}>เสร็จแล้ว</span>;
            case 'V':
                return <span className={styles.statusVoid}>ยกเลิก</span>;
            default:
                return <span>{status}</span>;
        }
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
            <div className={styles.modalOverlay} onClick={handleClose}></div>
            <div className={styles.billContainer}>
                <div className={styles.header}>
                    <h2>ใบเสร็จรับเงิน</h2>
                    <button className={styles.closeButton} onClick={handleClose}>
                        X
                    </button>
                </div>

                <div className={styles.billContent}>
                    <div className={styles.billInfo}>
                        <p>โต๊ะ: {tableNumber || bill.tableNumber}</p>
                        <p>วันที่: {formatDateTime(bill.startTime)}</p>
                        <p>เลขที่ใบเสร็จ: {orderId}</p>
                    </div>

                    {/* สรุปสถานะรายการ */}
                    {bill.status !== "C" && (
                        <div className={styles.statusSummary}>
                            <div className={styles.statusItem}>
                                <strong>รายการทั้งหมด:</strong> {bill.items.length} รายการ ({formatCurrency(bill.totalAmount)} บาท)
                            </div>
                            {completedItems > 0 && (
                                <div className={styles.statusItem}>
                                    <strong>เสร็จแล้ว:</strong> {completedItems} รายการ ({formatCurrency(completedTotal)} บาท)
                                </div>
                            )}
                            {processingItems > 0 && (
                                <div className={styles.statusItem}>
                                    <strong>กำลังทำ:</strong> {processingItems} รายการ ({formatCurrency(processingTotal)} บาท)
                                </div>
                            )}
                        </div>
                    )}

                    {/* ปุ่มเพิ่มรายการ */}
                    {bill.status !== "C" && (
                        <div className={styles.addItemSection}>
                            <button
                                className={styles.addButton}
                                onClick={handleOpenAddFood}
                                disabled={showAddFood}
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
                                    <th>สถานะ</th>
                                    {bill.status !== "C" && <th>จัดการ</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {bill.items.map((item) => (
                                    <tr key={item.id} className={item.status === 'P' ? styles.processingRow : ''}>
                                        <td>{item.productName}</td>
                                        <td className={styles.textCenter}>{item.quantity}</td>
                                        <td className={styles.textRight}>{formatCurrency(item.unitPrice)}</td>
                                        <td className={styles.textRight}>{formatCurrency(item.amount)}</td>
                                        <td className={styles.textCenter}>{renderStatus(item.status)}</td>
                                        {bill.status !== "C" && (
                                            <td className={styles.textCenter}>
                                                <button
                                                    className={styles.removeButton}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveItem(item.id);
                                                    }}
                                                    disabled={isLoading || showAddFood || showConfirm}
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

                    {processingItems > 0 && bill.status !== "C" && (
                        <div className={styles.warningMessage}>
                            <p>⚠️ มีรายการอาหารที่ยังอยู่ในสถานะ "กำลังทำ" กรุณาตรวจสอบก่อนชำระเงิน</p>
                        </div>
                    )}

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
                                        disabled={showAddFood || showConfirm || showQRCode}
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
                                        disabled={showAddFood || showConfirm || showQRCode}
                                    />
                                    <label htmlFor="transfer">โอนเงิน</label>
                                </div>
                                <div className={styles.paymentMethodItem}>
                                    <input
                                        id="promptpay"
                                        type="radio"
                                        value="promptpay"
                                        checked={paymentMethod === "promptpay"}
                                        onChange={() => setPaymentMethod("promptpay")}
                                        disabled={showAddFood || showConfirm || showQRCode}
                                    />
                                    <label htmlFor="promptpay">พร้อมเพย์ QR</label>
                                </div>
                            </div>

                            <div className={styles.actionButtons}>
                                <button
                                    className={styles.payButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenConfirm();
                                    }}
                                    disabled={isLoading || showAddFood || showConfirm || showQRCode}
                                >
                                    ชำระเงิน
                                </button>
                                <button
                                    className={styles.cancelButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClose();
                                    }}
                                    disabled={showAddFood || showConfirm || showQRCode}
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal ยืนยันการชำระเงิน */}
            {showConfirm && (
                <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.confirmContent} onClick={handleModalClick}>
                        <h3>ยืนยันการชำระเงิน</h3>
                        {processingItems > 0 && (
                            <div className={styles.confirmWarning}>
                                <p>⚠️ มีรายการอาหารที่ยังอยู่ในสถานะ "กำลังทำ" จำนวน {processingItems} รายการ</p>
                                <p className={styles.smallNote}>รายการเหล่านี้จะถูกเปลี่ยนเป็นสถานะ "เสร็จแล้ว" </p>
                            </div>
                        )}
                        <p>
                            คุณต้องการชำระเงินจำนวน <strong>{formatCurrency(bill.totalAmount)} บาท</strong>
                            <br />ด้วย<strong>
                                {paymentMethod === "cash" ? "เงินสด" :
                                    paymentMethod === "transfer" ? "การโอนเงิน" :
                                        "พร้อมเพย์"}</strong> ใช่หรือไม่?
                        </p>
                        <div className={styles.confirmButtons}>
                            <button
                                className={styles.confirmButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartPayment(); // เปลี่ยนเป็นเรียกใช้ handleStartPayment แทน
                                }}
                                disabled={isLoading}
                            >
                                ยืนยัน
                            </button>
                            <button
                                className={styles.cancelButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseConfirm();
                                }}
                                disabled={isLoading}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal แสดง QR Code สำหรับ PromptPay */}
            {showQRCode && (
                <div className={styles.qrCodeModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.qrCodeContent} onClick={handleModalClick}>
                        <h3>QR Code พร้อมเพย์</h3>
                        <p>จำนวนเงิน: <strong>{formatCurrency(bill.totalAmount)} บาท</strong></p>
                        <p>PromptPay: {promptPayNumber}</p>
                        <div className={styles.qrCodeContainer}>
                            {qrCodeURL && (
                                <img
                                    src={qrCodeURL}
                                    alt="PromptPay QR Code"
                                    className={styles.qrCodeImage}
                                />
                            )}
                        </div>
                        <div className={styles.qrCodeButtons}>
                            <button
                                className={styles.downloadButton}
                                onClick={handleDownloadQRCode}
                                disabled={!qrCodeURL}
                            >
                                ดาวน์โหลด QR Code
                            </button>
                            <button
                                className={styles.confirmButton}
                                onClick={handlePromptPayConfirm}
                                disabled={isLoading}
                            >
                                ชำระเงินเรียบร้อย
                            </button>
                            <button
                                className={styles.cancelButton}
                                onClick={handleCloseQRCode}
                                disabled={isLoading}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* เรียกใช้ Addfooditem component */}
            {showAddFood && (
                <Addfooditem
                    orderId={orderId}
                    onClose={handleCloseAddFood}
                    onItemAdded={handleItemAdded}
                />
            )}
        </>
    );
};

export default Billpayment;