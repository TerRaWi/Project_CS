import React, { useState, useEffect, useRef } from "react";
import { getBill, checkout, updateOrderDetailStatus, getCancelReasons } from "../api";
import Addfooditem from "./Addfooditem";
import QRCode from "qrcode";
import generatePayload from "promptpay-qr";
// นำเข้า Bootstrap (ถ้าคุณใช้ Bootstrap 5 และยังไม่ได้นำเข้าที่ไหนในแอพพลิเคชัน)
// import 'bootstrap/dist/css/bootstrap.min.css';

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
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
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
                    
                    <button id="print-button" class="btn btn-success" onclick="window.print()">พิมพ์ใบเสร็จ</button>
                    
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
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
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
                    
                    @media print {
                        .btn {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                ${receiptContent ? receiptContent.innerHTML : '<p>ไม่พบข้อมูลใบเสร็จ</p>'}
                <div class="text-center mt-4">
                    <button class="btn btn-primary" onclick="window.print()">พิมพ์</button>
                    <button class="btn btn-secondary ms-2" onclick="window.close()">ปิด</button>
                </div>
            </body>
            </html>
        `);

        // ปิด document
        printWindow.document.close();

        // รอให้ทรัพยากรโหลดเสร็จและพิมพ์
        printWindow.onload = function () {
            // ทำการพิมพ์
            printWindow.focus();
            // printWindow.print(); // ถ้าต้องการให้พิมพ์ทันที
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
                return <span className="badge bg-warning text-dark">กำลังทำ</span>;
            case 'C':
                return <span className="badge bg-success">เสร็จแล้ว</span>;
            case 'V':
                return <span className="badge bg-danger">ยกเลิก</span>;
            default:
                return <span>{status}</span>;
        }
    };

    if (isLoading && !bill) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{height: "300px"}}>
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger m-4 text-center" role="alert">
                {error}
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="alert alert-warning m-4 text-center" role="alert">
                ไม่พบข้อมูลบิล
            </div>
        );
    }

    return (
        <>
            {/* Modal Backdrop */}
            <div className="modal-backdrop show" onClick={handleClose}></div>
            
            {/* Bill Container */}
            <div className="modal d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
                    <div className="modal-content">
                        {/* Header */}
                        <div className="modal-header bg-warning text-white">
                            <h5 className="modal-title w-100 text-center">ใบเสร็จรับเงิน</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={handleClose}></button>
                        </div>
                        
                        {/* Body */}
                        <div className="modal-body">
                            {/* Bill Info */}
                            <div className="card mb-4 border-start border-success border-4">
                                <div className="card-body bg-light">
                                    <p className="mb-1"><strong>โต๊ะ:</strong> {tableNumber || bill.tableNumber}</p>
                                    <p className="mb-1"><strong>วันที่:</strong> {formatDateTime(bill.startTime)}</p>
                                    <p className="mb-1"><strong>เลขที่ใบเสร็จ:</strong> {orderId}</p>
                                </div>
                            </div>

 {/* Status Summary */}
{bill.status !== "C" && (
    <div className="alert alert-secondary mb-3">
        <div className="d-flex flex-wrap">
            <div className="me-3">
                <strong>รายการทั้งหมด:</strong> {bill.items.length} รายการ ({formatCurrency(bill.totalAmount)} บาท)
            </div>
            {completedItems > 0 && (
                <div className="me-3">
                    <strong>เสร็จแล้ว:</strong> {completedItems} รายการ ({formatCurrency(completedTotal)} บาท)
                </div>
            )}
            {processingItems > 0 && (
                <div>
                    <strong>กำลังทำ:</strong> {processingItems} รายการ ({formatCurrency(processingTotal)} บาท)
                </div>
            )}
        </div>
    </div>
)}

{/* Add Item Button */}
{bill.status !== "C" && (
    <div className="text-end mb-3">
        <button 
            className="btn btn-success" 
            onClick={handleOpenAddFood}
            disabled={showAddFood}
        >
            <i className="bi bi-plus-circle me-1"></i> เพิ่มรายการ
        </button>
    </div>
)}

{/* Items Table */}
<div className="table-responsive shadow-sm rounded mb-4">
    <table className="table table-hover mb-0">
        <thead className="table-warning">
            <tr>
                <th>รายการ</th>
                <th className="text-center">จำนวน</th>
                <th className="text-end">ราคา/หน่วย</th>
                <th className="text-end">รวม</th>
                <th className="text-center">สถานะ</th>
                {bill.status !== "C" && <th className="text-center">จัดการ</th>}
            </tr>
        </thead>
        <tbody>
            {bill.items.map((item) => (
                <tr key={item.id} className={item.status === 'P' ? 'table-warning bg-opacity-25' : ''}>
                    <td>{item.productName}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-end">{formatCurrency(item.amount)}</td>
                    <td className="text-center">{renderStatus(item.status)}</td>
                    {bill.status !== "C" && (
                        <td className="text-center">
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveItem(item.id);
                                }}
                                disabled={isLoading || showAddFood}
                            >
                                <i className="bi bi-trash me-1"></i> ลบ
                            </button>
                        </td>
                    )}
                </tr>
            ))}
        </tbody>
    </table>
</div>

{/* Summary */}
<div className="card bg-light mb-4 shadow-sm">
    <div className="card-body">
        <div className="d-flex justify-content-between align-items-center border-top border-success border-2 pt-3 mt-2">
            <h5 className="mb-0">ยอดรวมทั้งสิ้น:</h5>
            <h5 className="mb-0 text-success">{formatCurrency(bill.totalAmount)} บาท</h5>
        </div>
    </div>
</div>

{/* Processing Warning */}
{processingItems > 0 && bill.status !== "C" && (
    <div className="alert alert-warning mb-4">
        <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <p className="mb-0">มีรายการอาหารที่ยังอยู่ในสถานะ "กำลังทำ" กรุณาตรวจสอบก่อนชำระเงิน</p>
        </div>
    </div>
)}

{/* Action Buttons */}
{bill.status !== "C" && (
    <div className="d-flex justify-content-center gap-3 mt-4">
        <button
            className="btn btn-success px-4 py-2"
            onClick={(e) => {
                e.stopPropagation();
                handlePrintReceipt();
            }}
            disabled={isLoading || showAddFood || showPrintReceipt}
        >
            <i className="bi bi-printer me-2"></i> พิมพ์ใบเสร็จ
        </button>
        <button
            className="btn btn-danger px-4 py-2"
            onClick={(e) => {
                e.stopPropagation();
                handleClose();
            }}
            disabled={showAddFood || showPrintReceipt}
        >
            <i className="bi bi-x-circle me-2"></i> ยกเลิก
        </button>
    </div>
)}

{/* Print Receipt Modal */}
{showPrintReceipt && (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
                <div className="modal-header bg-success text-white">
                    <h5 className="modal-title">ใบเสร็จรับเงิน</h5>
                    <button type="button" className="btn-close" onClick={handleClosePrintReceipt}></button>
                </div>
                <div className="modal-body">
                    <div id="receipt-to-print">
                        <div className="text-center mb-3">
                            <h4>ร้านอาหาร Fast Shabu</h4>
                            <p className="mb-1">122/3 หมู่ 20 ต.นิคม อ.สตึก จ.บุรีรัมย์</p>
                            <p className="mb-1">ร้านเปิดบริการ 11.00-21.30 น.</p>
                            <p className="mb-1">โทร: 082-2502628</p>
                        </div>
                        
                        <hr className="border-dashed my-3" />
                        
                        <div className="bg-light p-3 rounded mb-3">
                            <div className="row">
                                <div className="col-md-4 mb-2"><strong>เลขที่ใบเสร็จ:</strong> {receiptData.receiptNumber}</div>
                                <div className="col-md-4 mb-2"><strong>วันที่:</strong> {receiptData.orderDate}</div>
                                <div className="col-md-4 mb-2"><strong>โต๊ะ:</strong> {tableNumber || bill.tableNumber}</div>
                            </div>
                        </div>
                        
                        <div className="table-responsive mb-3">
                            <table className="table table-sm">
                                <thead className="table-light">
                                    <tr>
                                        <th>รายการ</th>
                                        <th className="text-center">จำนวน</th>
                                        <th className="text-end">ราคา/หน่วย</th>
                                        <th className="text-end">รวม</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bill.items.filter(item => item.status !== 'V').map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.productName}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                                            <td className="text-end">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="table-light">
                                        <th colSpan="3" className="text-end">ยอดรวมทั้งสิ้น:</th>
                                        <th className="text-end">{formatCurrency(bill.totalAmount)} บาท</th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        <div className="card border-dashed mb-3">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5 className="text-center mb-3">ชำระด้วย PromptPay</h5>
                                        <p className="text-center mb-1">หมายเลข: {promptPayNumber}</p>
                                        <p className="text-center">จำนวนเงิน: {formatCurrency(bill.totalAmount)} บาท</p>
                                    </div>
                                    <div className="col-md-6 text-center">
                                        {qrCodeURL && <img src={qrCodeURL} alt="PromptPay QR Code" className="img-fluid" style={{ maxWidth: "200px" }} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center mt-4">
                            <p className="mb-1">ขอบคุณที่ใช้บริการ</p>
                            <p>Fast Shabu - สวรรค์ของคนรักชาบู</p>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={handlePrint}>
                        <i className="bi bi-printer me-2"></i> พิมพ์
                    </button>
                    <button className="btn btn-warning" onClick={handleDownloadQRCode} disabled={!qrCodeURL}>
                        <i className="bi bi-download me-2"></i> ดาวน์โหลด QR Code
                    </button>
                    <button className="btn btn-secondary" onClick={handleClosePrintReceipt}>
                        <i className="bi bi-x-circle me-2"></i> ปิด
                    </button>
                </div>
            </div>
        </div>
    </div>
)}

{/* Cancel Reason Modal */}
{showCancelDialog && (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title">เหตุผลในการยกเลิกรายการ</h5>
                    <button type="button" className="btn-close" onClick={handleCloseCancelDialog}></button>
                </div>
                <div className="modal-body">
                    <div className="mb-3">
                        <label htmlFor="cancelReason" className="form-label">กรุณาเลือกเหตุผล:</label>
                        <select 
                            id="cancelReason"
                            className="form-select" 
                            value={selectedCancelReasonId || ''}
                            onChange={(e) => setSelectedCancelReasonId(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">-- กรุณาเลือกเหตุผล --</option>
                            {cancelReasons.map(reason => (
                                <option key={reason.id} value={reason.id}>
                                    {reason.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button 
                        className="btn btn-danger" 
                        onClick={handleConfirmCancel}
                        disabled={!selectedCancelReasonId || isLoading}
                    >
                        ยืนยันการยกเลิก
                    </button>
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleCloseCancelDialog}
                        disabled={isLoading}
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        </div>
    </div>
)}

{/* Add Food Item Component */}
{showAddFood && (
    <Addfooditem
        orderId={orderId}
        onClose={handleCloseAddFood}
        onItemAdded={handleItemAdded}
    />
)}
</div> {/* ปิด modal-body */}
                    </div> {/* ปิด modal-content */}
                </div> {/* ปิด modal-dialog */}
            </div> {/* ปิด modal */}
        </>
    );
};

export default Billpayment;