import React, { useState, useEffect, useRef } from "react";
import { getBill, checkout, updateOrderDetailStatus, getCancelReasons } from "../api";
import Addfooditem from "./Addfooditem";
import styles from "../styles/billpayment.module.css";
import QRCode from "qrcode";
import generatePayload from "promptpay-qr";

const Billpayment = ({ orderId, tableNumber, onClose, onSuccess }) => {
    const [bill, setBill] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddFood, setShowAddFood] = useState(false);
    const [processingItems, setProcessingItems] = useState(0);
    const [completedItems, setCompletedItems] = useState(0);
    const [processingTotal, setProcessingTotal] = useState(0);
    const [completedTotal, setCompletedTotal] = useState(0);
    const [qrCodeURL, setQrCodeURL] = useState(null);
    const [promptPayNumber, setPromptPayNumber] = useState("0123456789");
    const qrCanvasRef = useRef(null);
    const [cancelReasons, setCancelReasons] = useState([]);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedCancelReasonId, setSelectedCancelReasonId] = useState(null);
    const [itemToCancel, setItemToCancel] = useState(null);
    const [showPrintReceipt, setShowPrintReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

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

            // สร้าง QR Code สำหรับ PromptPay หลังจากได้ข้อมูลบิล
            if (data.totalAmount > 0) {
                await generateQRCodeWithLogo(data.totalAmount);
            }

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

        if (showAddFood || showPrintReceipt) {
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
    }, [showAddFood, showPrintReceipt, styles.billContainer, styles.disabled]);

    useEffect(() => {
        const loadCancelReasons = async () => {
            try {
                const data = await getCancelReasons();
                setCancelReasons(data);
            } catch (err) {
                console.error("Error loading cancel reasons:", err);
            }
        };

        loadCancelReasons();
    }, []);

    const handlePrintReceipt = async () => {
        try {
            // ตรวจสอบรายการที่กำลังทำอยู่
            if (processingItems > 0) {
                if (!window.confirm(`มีรายการอาหารที่ยังอยู่ในสถานะ "กำลังทำ" จำนวน ${processingItems} รายการ (${formatCurrency(processingTotal)} บาท) ระบบจะเปลี่ยนเป็นสถานะ "เสร็จแล้ว" ต้องการดำเนินการต่อหรือไม่?`)) {
                    return;
                }

                // อัพเดทสถานะรายการที่กำลังทำให้เป็นเสร็จสิ้น
                setIsLoading(true);
                for (const item of bill.items) {
                    if (item.status === 'P') {
                        await updateOrderDetailStatus(item.id, 'C');
                    }
                }
                // รีโหลดข้อมูลบิลหลังจากอัพเดทสถานะ
                await fetchBill();
            }

            // สร้าง QR Code ถ้ายังไม่มี
            if (!qrCodeURL && bill.totalAmount > 0) {
                await generateQRCodeWithLogo(bill.totalAmount);
            }

            setIsLoading(true);

            // *** สำคัญ: ทำการ checkout ก่อน ***
            const result = await checkout(orderId, "");

            if (!result.success) {
                throw new Error(result.message || "การชำระเงินไม่สำเร็จ");
            }

            // เพิ่มบรรทัดเหล่านี้: ตั้งค่า receiptData และแสดง Modal
            setReceiptData({
                receiptNumber: orderId,
                orderDate: new Date().toLocaleString('th-TH')
            });
            setShowPrintReceipt(true);

            // จากนั้นค่อยสร้างหน้าแสดงใบเสร็จและปุ่มพิมพ์
            const receiptWindow = window.open('', '_blank');

            // เตรียมข้อมูลรายการสินค้าสำหรับแสดงในใบเสร็จ
            const itemsHtml = bill.items
                .filter(item => item.status !== 'V')
                .map(item => `
                    <tr>
                        <td>${item.productName}</td>
                        <td style="text-align: center">${item.quantity}</td>
                        <td style="text-align: right">${formatCurrency(item.amount)}</td>
                    </tr>
                `).join('');

            // สร้าง HTML สำหรับใบเสร็จที่ง่ายและเสถียร
            receiptWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>ใบเสร็จรับเงิน</title>
                    <style>
                        body {
                            font-family: 'Angsana New', 'TH SarabunPSK', 'Tahoma', sans-serif;
                            padding: 20px;
                            max-width: 400px;
                            margin: 0 auto;
                            line-height: 1.3;
                        }
                        
                        .receipt-header {
                            text-align: center;
                            margin-bottom: 10px;
                        }
                        
                        .receipt-header h2 {
                            margin: 5px 0;
                            font-size: 20px;
                        }
                        
                        .receipt-header p {
                            margin: 3px 0;
                            font-size: 16px;
                        }
                        
                        .divider {
                            border-top: 1px dashed #999;
                            margin: 10px 0;
                        }
                        
                        .receipt-info {
                            margin: 10px 0;
                        }
                        
                        .receipt-info p {
                            margin: 3px 0;
                        }
                        
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 10px 0;
                        }
                        
                        th, td {
                            padding: 5px;
                            text-align: left;
                        }
                        
                        .total-section {
                            font-weight: bold;
                            margin: 10px 0;
                        }
                        
                        .total-row {
                            display: flex;
                            justify-content: space-between;
                        }
                        
                        .qr-section {
                            text-align: center;
                            margin: 15px 0;
                        }
                        
                        .qr-section img {
                            max-width: 150px;
                            margin: 10px auto;
                            display: block;
                        }
                        
                        .footer {
                            text-align: center;
                            margin-top: 15px;
                        }
                        
                        @media print {
                            #print-button {
                                display: none;
                            }
                        }
                        
                        #print-button {
                            display: block;
                            margin: 20px auto;
                            padding: 10px 20px;
                            background-color: #4CAF50;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-header">
                        <h2>ร้านอาหาร Fast Shabu</h2>
                        <p> 122/3 หมู่ 20 ต.นิคม อ.สตึก จ.บุรีรัมย์</p>
                        <p>ร้านเปิดบริการ 11.00-21.30 น.</p> 
                        <p>โทร: 082-2502628</p>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="receipt-info">
                        <p><strong>โต๊ะ:</strong> ${tableNumber || bill.tableNumber}</p>
                        <p><strong>วันที่:</strong> ${new Date().toLocaleString('th-TH')}</p>
                        <p><strong>เลขที่ใบเสร็จ:</strong> ${orderId}</p>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <table>
                        <tr>
                            <th>รายการ</th>
                            <th style="text-align: center">จำนวน</th>
                            <th style="text-align: right">ราคา</th>
                        </tr>
                        ${itemsHtml}
                    </table>
                    
                    <div class="divider"></div>
                    
                    <div class="total-section">
                        <div class="total-row">
                            <span>ยอดรวมทั้งสิ้น:</span>
                            <span>${formatCurrency(bill.totalAmount)} บาท</span>
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="qr-section">
                        <p>ชำระด้วย PromptPay</p>
                        <p>หมายเลข: ${promptPayNumber}</p>
                        <img src="${qrCodeURL}" alt="PromptPay QR Code">
                        <p>จำนวนเงิน: ${formatCurrency(bill.totalAmount)} บาท</p>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div class="footer">
                        <p>ขอบคุณที่ใช้บริการ</p>
                        <p>Fast Shabu - สวรรค์ของคนรักชาบู</p>
                    </div>
                    
                    <button id="print-button" onclick="window.print()">พิมพ์ใบเสร็จ</button>
                    
                    <script>
                        // เพิ่มฟังก์ชันพิมพ์อัตโนมัติเมื่อโหลดเสร็จ หรือให้ผู้ใช้กดปุ่มพิมพ์เอง
                        document.addEventListener('DOMContentLoaded', function() {
                            // ถ้าต้องการพิมพ์อัตโนมัติ ให้เปิดบรรทัดนี้
                            // window.print();
                        });
                    </script>
                </body>
                </html>
            `);

            receiptWindow.document.close();

            // เรียก onSuccess เมื่อชำระเงินสำเร็จ
            if (onSuccess) {
                onSuccess(result);
            }

            setIsLoading(false);
        } catch (err) {
            setError(err.message || "เกิดข้อผิดพลาดในการชำระเงิน");
            setIsLoading(false);
        }
    };

    // ใส่ฟังก์ชันนี้แทนฟังก์ชัน handlePrint เดิมในไฟล์ Billpayment.js
    const handlePrint = () => {
        // เปิดหน้าต่างใหม่เพื่อพิมพ์
        const printWindow = window.open('', '_blank');

        // ดึงเนื้อหาใบเสร็จ
        const receiptContent = document.getElementById('receipt-to-print');

        // สร้าง HTML สำหรับการพิมพ์
        printWindow.document.write(`
            <html>
            <head>
                <title>ใบเสร็จรับเงิน Fast Shabu</title>
                <style>
                    body { 
                        font-family: sans-serif;
                        margin: 0;
                        padding: 20px;
                    }
                    
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    
                    .receipt-header h2 {
                        margin-bottom: 5px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    
                    th, td {
                        padding: 8px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    
                    th {
                        background-color: #f2f2f2;
                    }
                    
                    .text-right {
                        text-align: right;
                    }
                    
                    .text-center {
                        text-align: center;
                    }
                    
                    .total {
                        font-weight: bold;
                    }
                    
                    .qr-container {
                        display: flex;
                        justify-content: space-between;
                        margin: 20px 0;
                        padding: 15px;
                        border: 1px dashed #ccc;
                        border-radius: 8px;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                ${receiptContent ? receiptContent.innerHTML : '<p>ไม่พบข้อมูลใบเสร็จ</p>'}
            </body>
            </html>
        `);

        // ปิด document
        printWindow.document.close();

        // รอให้ทรัพยากรโหลดเสร็จและพิมพ์
        printWindow.onload = function () {
            // ทำการพิมพ์
            printWindow.focus();
            printWindow.print();

            // ผู้ใช้สามารถปิดหน้าต่างได้เอง หรือจะให้ปิดอัตโนมัติหลังพิมพ์ โดยเพิ่มบรรทัดนี้:
            // printWindow.close();
        };
    };

    // ฟังก์ชันลบรายการ
    const handleRemoveItem = (itemId) => {
        // ตั้งค่า itemId ที่จะยกเลิกและแสดง dialog
        setItemToCancel(itemId);
        setSelectedCancelReasonId(null); // รีเซ็ตตัวเลือกทุกครั้ง
        setShowCancelDialog(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedCancelReasonId) {
            alert("กรุณาเลือกเหตุผลในการยกเลิก");
            return;
        }

        try {
            setIsLoading(true);
            await updateOrderDetailStatus(itemToCancel, 'V', selectedCancelReasonId);
            setShowCancelDialog(false);

            // โหลดข้อมูลบิลใหม่
            await fetchBill();
        } catch (err) {
            setError(err.message || "เกิดข้อผิดพลาดในการลบรายการ");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseCancelDialog = () => {
        setShowCancelDialog(false);
        setSelectedCancelReasonId(null);
        setItemToCancel(null);
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

    // ฟังก์ชันปิด modal ใบเสร็จ
    const handleClosePrintReceipt = () => {
        setShowPrintReceipt(false);
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
                                                    disabled={isLoading || showAddFood}
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
                        <div className={styles.actionButtons}>
                            <button
                                className={styles.payButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrintReceipt();
                                }}
                                disabled={isLoading || showAddFood || showPrintReceipt}
                            >
                                พิมพ์ใบเสร็จ
                            </button>
                            <button
                                className={styles.cancelButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClose();
                                }}
                                disabled={showAddFood || showPrintReceipt}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal ใบเสร็จรับเงิน */}
            {showPrintReceipt && (
                <div className={styles.qrCodeModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.qrCodeContent} onClick={handleModalClick} style={{ maxWidth: '600px' }}>
                        <h3>ใบเสร็จรับเงิน</h3>

                        <div className={styles.receiptContent} id="receipt-to-print">
                            <div className={styles.receiptHeader}>
                                <h2>ร้านอาหาร Fast Shabu</h2>
                                <p>122/3 หมู่ 20 ต.นิคม อ.สตึก จ.บุรีรัมย์</p>
                                <p>ร้านเปิดบริการ 11.00-21.30 น.</p>
                                <p>โทร: 082-2502628</p>
                            </div>

                            <div className={styles.receiptInfo}>
                                <p><strong>เลขที่ใบเสร็จ:</strong> {receiptData.receiptNumber}</p>
                                <p><strong>วันที่:</strong> {receiptData.orderDate}</p>
                                <p><strong>โต๊ะ:</strong> {tableNumber || bill.tableNumber}</p>
                            </div>

                            <table className={styles.receiptTable}>
                                <thead>
                                    <tr>
                                        <th>รายการ</th>
                                        <th>จำนวน</th>
                                        <th>ราคา/หน่วย</th>
                                        <th>รวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bill.items.filter(item => item.status !== 'V').map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.productName}</td>
                                            <td className={styles.textCenter}>{item.quantity}</td>
                                            <td className={styles.textRight}>{formatCurrency(item.unitPrice)}</td>
                                            <td className={styles.textRight}>{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th colSpan="3" className={styles.textRight}>ยอดรวมทั้งสิ้น:</th>
                                        <th className={styles.textRight}>{formatCurrency(bill.totalAmount)} บาท</th>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className={styles.qrContainer}>
                                <div className={styles.qrInfo}>
                                    <h3>ชำระด้วย PromptPay</h3>
                                    <p>หมายเลข: {promptPayNumber}</p>
                                    <p>จำนวนเงิน: {formatCurrency(bill.totalAmount)} บาท</p>
                                </div>
                                <div className={styles.qrImage}>
                                    {qrCodeURL && <img src={qrCodeURL} alt="PromptPay QR Code" width="200" />}
                                </div>
                            </div>

                            <div className={styles.receiptFooter}>
                                <p>ขอบคุณที่ใช้บริการ</p>
                                <p>Fast Shabu - สวรรค์ของคนรักชาบู</p>
                            </div>
                        </div>

                        <div className={styles.receiptButtons}>
                            <button
                                className={styles.confirmButton}
                                onClick={handlePrint}
                            >
                                พิมพ์
                            </button>
                            <button
                                className={styles.downloadButton}
                                onClick={handleDownloadQRCode}
                                disabled={!qrCodeURL}
                            >
                                ดาวน์โหลด QR Code
                            </button>
                            <button
                                className={styles.cancelButton}
                                onClick={handleClosePrintReceipt}
                            >
                                ปิด
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

            {/* Modal เลือกเหตุผลในการยกเลิกรายการ */}
            {showCancelDialog && (
                <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
                    <div className={styles.confirmContent} onClick={handleModalClick}>
                        <h3>เหตุผลในการยกเลิกรายการ</h3>
                        <div className={styles.formGroup}>
                            <label>กรุณาเลือกเหตุผล:</label>
                            <select
                                value={selectedCancelReasonId || ''}
                                onChange={(e) => setSelectedCancelReasonId(e.target.value ? Number(e.target.value) : null)}
                                className={styles.formControl}
                            >
                                <option value="">-- กรุณาเลือกเหตุผล --</option>
                                {cancelReasons.map(reason => (
                                    <option key={reason.id} value={reason.id}>
                                        {reason.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.confirmButtons}>
                            <button
                                className={styles.confirmButton}
                                onClick={handleConfirmCancel}
                                disabled={!selectedCancelReasonId || isLoading}
                            >
                                ยืนยันการยกเลิก
                            </button>
                            <button
                                className={styles.cancelButton}
                                onClick={handleCloseCancelDialog}
                                disabled={isLoading}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Billpayment;