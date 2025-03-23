import React, { useState, useEffect, useRef } from 'react';
import { getAllPayments, getBill, getReceipt } from '../api';
import { Modal, Button, Table, Badge, Spinner } from 'react-bootstrap';
import { useReactToPrint } from 'react-to-print';
// เพิ่มการ import libraries สำหรับ QR Code
import QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';

// ฟังก์ชั่นสำหรับแปลงรูปแบบวันที่
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('th-TH', options);
};

// ฟังก์ชั่นสำหรับแปลงรูปแบบเงิน
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2
    }).format(amount || 0);
};

// ฟังก์ชันสำหรับรับวันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
const getCurrentDate = () => {
    const today = new Date();
    // ตั้งค่าเวลาเป็น 23:59:59 เพื่อให้แน่ใจว่าจะรวมทั้งวัน
    today.setHours(23, 59, 59, 999);
    return today.toISOString().split('T')[0];
};

const ReceiptForPrint = React.forwardRef((props, ref) => {
    const { receipt, qrCodeURL } = props;

    if (!receipt) return null;

    return (
        <div ref={ref} className="p-3" style={{ fontFamily: 'Sarabun, sans-serif', maxWidth: '400px', margin: '0 auto' }}>
            <div className="text-center mb-3">
                <h4 className="mb-1">ร้านอาหาร Fast Shabu</h4>
                <p className="mb-1">122/3 หมู่ 20 ต.นิคม อ.สตึก จ.บุรีรัมย์</p>
                <p className="mb-1">ร้านเปิดบริการ 11.00-21.30 น.</p>
                <p className="mb-1">โทร: 082-2502628</p>
            </div>

            <hr style={{ borderTop: '1px dashed #999', margin: '10px 0' }} />

            <div className="mb-3">
                <p className="mb-1"><strong>โต๊ะ:</strong> {receipt.tableNumber}</p>
                <p className="mb-1"><strong>วันที่:</strong> {formatDate(receipt.payment_date)}</p>
                <p className="mb-1"><strong>เลขที่ใบเสร็จ:</strong> #{receipt.order_id}</p>
            </div>

            <hr style={{ borderTop: '1px dashed #999', margin: '10px 0' }} />

            <table className="w-100 mb-3" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>รายการ</th>
                        <th className="text-center">จำนวน</th>
                        <th className="text-end">ราคา</th>
                    </tr>
                </thead>
                <tbody>
                    {receipt.items && receipt.items.filter(item => item.status !== 'V').map((item, index) => (
                        <tr key={index}>
                            <td>{item.productName}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-end">{formatCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <hr style={{ borderTop: '1px dashed #999', margin: '10px 0' }} />

            <div className="d-flex justify-content-between fw-bold mb-3">
                <span>ยอดรวมทั้งสิ้น:</span>
                <span>{formatCurrency(receipt.amount)} บาท</span>
            </div>

            <hr style={{ borderTop: '1px dashed #999', margin: '10px 0' }} />

            <div className="text-center mb-3">
                <p className="mb-1">ชำระด้วย PromptPay</p>
                <p className="mb-1">หมายเลข: 0123456789</p>
                {/* แสดง QR Code ที่สร้างขึ้น */}
                <div className="my-3" style={{ width: '150px', height: '150px', margin: '0 auto' }}>
                    {qrCodeURL ? (
                        <img src={qrCodeURL} alt="QR Code" style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="text-muted">QR Code</span>
                        </div>
                    )}
                </div>
            </div>

            <hr style={{ borderTop: '1px dashed #999', margin: '10px 0' }} />

            <div className="text-center">
                <p className="mb-1">ขอบคุณที่ใช้บริการ</p>
            </div>
        </div>
    );
});

const BillHistory = () => {
    // ประกาศตัวแปรสำหรับเก็บวันที่ปัจจุบัน
    const currentDate = getCurrentDate();

    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBill, setSelectedBill] = useState(null);
    const [billDetails, setBillDetails] = useState(null);
    const [showBillModal, setShowBillModal] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [receiptToPrint, setReceiptToPrint] = useState(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: currentDate
    });
    const [searchTerm, setSearchTerm] = useState('');
    // เพิ่ม state สำหรับเก็บ QR Code URL
    const [qrCodeURL, setQrCodeURL] = useState(null);
    // เพิ่มหมายเลข PromptPay
    const [promptPayNumber, setPromptPayNumber] = useState("0123456789");

    // Ref สำหรับการพิมพ์
    const printComponentRef = useRef();

    // ฟังก์ชันสร้าง QR Code
    const generateQRCode = async (amount) => {
        try {
            // แปลงค่า amount ให้เป็นตัวเลขอย่างแน่นอน
            const numericAmount = parseFloat(amount) || 0;

            console.log('ยอดเงินที่จะสร้าง QR Code:', numericAmount);

            // สร้าง payload สำหรับ PromptPay โดยส่งค่า amount เป็นตัวเลขที่แปลงแล้ว
            const payload = generatePayload(promptPayNumber, { amount: numericAmount });

            // สร้าง QR Code
            const qrCodeImageUrl = await QRCode.toDataURL(payload, {
                width: 260,
                margin: 2,
                errorCorrectionLevel: 'H'
            });

            setQrCodeURL(qrCodeImageUrl);
            return qrCodeImageUrl;
        } catch (err) {
            console.error('เกิดข้อผิดพลาดในการสร้าง QR Code:', err);
            console.error('รายละเอียดข้อผิดพลาด:', err.stack);
            setError('ไม่สามารถสร้าง QR Code ได้');
            return null;
        }
    };

    // ใช้ useReactToPrint แทน ReactToPrint พร้อมเพิ่มการแจ้งเตือน
    const handlePrint = useReactToPrint({
        content: () => printComponentRef.current,
        onBeforeGetContent: () => {
            alert("กำลังเตรียมข้อมูลสำหรับการพิมพ์... หากไม่มีหน้าต่างพิมพ์ปรากฏ โปรดตรวจสอบการตั้งค่า Pop-up blocker");
            return Promise.resolve();
        },
        onAfterPrint: () => {
            alert("พิมพ์เสร็จสิ้น");
            console.log('พิมพ์สำเร็จ');
        },
        // เพิ่มตัวเลือกการพิมพ์
        pageStyle: `
            @page {
                size: A4;
                margin: 10mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `
    });

    // โหลดข้อมูลการชำระเงินทั้งหมด
    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            try {
                console.log('Fetching all payments...');
                const data = await getAllPayments();
                console.log('Payments data:', data);

                // กรองเฉพาะรายการที่ชำระเงินสำเร็จ (status = S)
                const successfulPayments = data ? data.filter(payment => payment.status === 'S') : [];
                setPayments(successfulPayments);

                setError(null);
            } catch (err) {
                console.error('เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน:', err);
                setError('ไม่สามารถโหลดข้อมูลบิลได้ โปรดลองอีกครั้งในภายหลัง');
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    // ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงวันที่
    const handleDateChange = (e) => {
        const { name, value } = e.target;

        if (name === 'start') {
            // ถ้าเปลี่ยนวันเริ่มต้น
            // 1. ตรวจสอบว่าวันที่ไม่เกินวันปัจจุบัน
            // 2. ตรวจสอบว่าวันที่ไม่เกินวันสิ้นสุด
            const newStartDate = value;
            if (newStartDate > currentDate) {
                alert('ไม่สามารถเลือกวันในอนาคตได้');
                return;
            }

            if (newStartDate > dateRange.end) {
                alert('วันเริ่มต้นต้องไม่มากกว่าวันสิ้นสุด');
                return;
            }

            setDateRange({
                ...dateRange,
                start: newStartDate
            });
        } else if (name === 'end') {
            // ถ้าเปลี่ยนวันสิ้นสุด
            // 1. ตรวจสอบว่าวันที่ไม่เกินวันปัจจุบัน
            // 2. ตรวจสอบว่าวันที่ไม่น้อยกว่าวันเริ่มต้น
            const newEndDate = value;
            // ปรับให้สามารถเลือกวันที่ปัจจุบันได้
            if (newEndDate > currentDate) {
                alert('ไม่สามารถเลือกวันในอนาคตได้');
                return;
            }

            if (newEndDate < dateRange.start) {
                alert('วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น');
                return;
            }

            setDateRange({
                ...dateRange,
                end: newEndDate
            });
        }
    };

    // กรองข้อมูลตามช่วงวันที่และคำค้นหา
    const filteredPayments = payments.filter(payment => {
        // กรองตามวันที่
        const paymentDate = new Date(payment.payment_date);
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0); // ตั้งเวลาเป็น 00:00:00

        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // ตั้งเวลาเป็น 23:59:59.999

        const dateMatch = paymentDate >= startDate && paymentDate <= endDate;

        // กรองตามคำค้นหา
        const searchMatch =
            searchTerm === '' ||
            String(payment.order_id).includes(searchTerm) ||
            String(payment.table_number).includes(searchTerm);

        return dateMatch && searchMatch;
    });

    // แสดงรายละเอียดบิล
    const viewBillDetails = async (payment) => {
        setSelectedBill(payment);
        setLoading(true);

        try {
            const billData = await getBill(payment.order_id);
            setBillDetails(billData);
            setShowBillModal(true);
        } catch (err) {
            console.error('เกิดข้อผิดพลาดในการดึงรายละเอียดบิล:', err);
            setError('ไม่สามารถดึงรายละเอียดบิลได้');
        } finally {
            setLoading(false);
        }
    };

    // ปิดโมดัลรายละเอียดบิล
    const handleCloseBillModal = () => {
        setShowBillModal(false);
        setBillDetails(null);
    };

    // ปิดโมดัลตัวอย่างการพิมพ์
    const handleClosePrintPreview = () => {
        setShowPrintPreview(false);
    };

    // แสดงตัวอย่างการพิมพ์ใบเสร็จ
    const showReceiptPreview = async (payment) => {
        setLoading(true);
        try {
            // ในกรณีจริง คุณควรเรียก API เพื่อดึงข้อมูลใบเสร็จที่สมบูรณ์
            // const receiptData = await getReceipt(payment.id);

            // แต่สำหรับตัวอย่าง เราจะใช้ข้อมูลที่มีอยู่แล้ว
            const billData = await getBill(payment.order_id);

            const receiptData = {
                id: payment.order_id,
                order_id: payment.order_id,
                tableNumber: billData.tableNumber,
                payment_date: payment.payment_date,
                payment_method: payment.payment_method,
                amount: payment.amount,
                items: billData.items
            };

            // สร้าง QR Code สำหรับยอดเงินนี้
            // ตรวจสอบและแปลงค่ายอดเงินให้เป็นตัวเลขก่อนส่งไปสร้าง QR Code
            if (payment.amount) {
                // แน่ใจว่าเป็นตัวเลขที่ถูกต้อง
                const numericAmount = parseFloat(payment.amount);
                if (!isNaN(numericAmount)) {
                    await generateQRCode(numericAmount);
                } else {
                    console.error('ยอดเงินไม่ถูกต้อง:', payment.amount);
                }
            } else {
                console.error('ไม่พบข้อมูลยอดเงิน');
            }

            setReceiptToPrint(receiptData);
            setShowPrintPreview(true);
        } catch (err) {
            console.error('เกิดข้อผิดพลาดในการเตรียมข้อมูลใบเสร็จ:', err);
            setError('ไม่สามารถแสดงตัวอย่างใบเสร็จได้');
        } finally {
            setLoading(false);
        }
    };

    if (loading && payments.length === 0) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (error && payments.length === 0) {
        return (
            <div className="alert alert-danger my-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">
                        <i className="bi bi-receipt me-2 text-primary"></i>
                        ประวัติบิล
                    </h5>
                </div>
            </div>
            <div className="card-body">
                {/* ตัวกรองและค้นหา */}
                <div className="row mb-3">
                    <div className="col-md-4">
                        <label className="form-label">ตั้งแต่วันที่</label>
                        <input
                            type="date"
                            className="form-control"
                            name="start"
                            value={dateRange.start}
                            onChange={handleDateChange}
                            max={currentDate} // เพิ่ม attribute max เพื่อจำกัดวันที่ไม่เกินวันปัจจุบัน
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">ถึงวันที่</label>
                        <input
                            type="date"
                            className="form-control"
                            name="end"
                            value={dateRange.end}
                            onChange={handleDateChange}
                            min={dateRange.start} // เพิ่ม attribute min เพื่อจำกัดวันที่ไม่น้อยกว่าวันเริ่มต้น
                            max={currentDate} // เพิ่ม attribute max เพื่อจำกัดวันที่ไม่เกินวันปัจจุบัน
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">ค้นหา (เลขออเดอร์/โต๊ะ)</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="ค้นหา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* ตารางแสดงรายการบิล */}
                <div className="table-responsive">
                    <Table hover className="align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>เลขออเดอร์</th>
                                <th>โต๊ะ</th>
                                <th>วันที่-เวลา</th>
                                <th>จำนวนเงิน</th>
                                <th>สถานะ</th>
                                <th>การชำระเงิน</th>
                                <th>การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.length > 0 ? (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>#{payment.order_id}</td>
                                        <td>{payment.table_number}</td>
                                        <td>{formatDate(payment.payment_date)}</td>
                                        <td>{formatCurrency(payment.amount)}</td>
                                        <td>
                                            <Badge bg="success">ชำระแล้ว</Badge>
                                        </td>
                                        <td>{payment.payment_method}</td>
                                        <td>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => viewBillDetails(payment)}
                                                title="ดูรายละเอียด"
                                                className="w-100"
                                            >
                                                ดูรายละเอียด
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-4">
                                        <i className="bi bi-inbox fs-4 d-block mb-2 text-muted"></i>
                                        ไม่พบข้อมูลบิลที่ตรงกับเงื่อนไขการค้นหา
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>

                {/* โมดัลแสดงรายละเอียดบิล */}
                <Modal show={showBillModal} onHide={handleCloseBillModal} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            รายละเอียดบิล #{selectedBill?.order_id}
                            <span className="ms-2">
                                <Badge bg="success">ชำระแล้ว</Badge>
                            </span>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {loading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">กำลังโหลดข้อมูล...</p>
                            </div>
                        ) : billDetails ? (
                            <div>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <p><strong>โต๊ะ:</strong> {billDetails.tableNumber}</p>
                                        <p><strong>วันที่-เวลาเริ่ม:</strong> {formatDate(billDetails.startTime)}</p>
                                        <p><strong>วันที่-เวลาชำระ:</strong> {selectedBill && formatDate(selectedBill.payment_date)}</p>
                                    </div>
                                    <div className="col-md-6 text-md-end">
                                        <p><strong>วิธีการชำระเงิน:</strong> {selectedBill?.payment_method}</p>
                                        <p><strong>ยอดรวมทั้งสิ้น:</strong> <span className="fs-4 text-primary">{formatCurrency(billDetails.totalAmount)}</span></p>
                                    </div>
                                </div>

                                <hr />

                                <h6 className="mb-3">รายการอาหาร</h6>
                                <Table>
                                    <thead className="table-light">
                                        <tr>
                                            <th>รายการ</th>
                                            <th className="text-center">จำนวน</th>
                                            <th className="text-end">ราคาต่อหน่วย</th>
                                            <th className="text-end">รวม</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billDetails.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.productName}</td>
                                                <td className="text-center">{item.quantity}</td>
                                                <td className="text-end">{formatCurrency(item.unitPrice)}</td>
                                                <td className="text-end">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                            </tr>
                                        ))}
                                        <tr className="table-light">
                                            <td colSpan="3" className="text-end"><strong>รวมทั้งสิ้น</strong></td>
                                            <td className="text-end"><strong>{formatCurrency(billDetails.totalAmount)}</strong></td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        ) : (
                            <div className="alert alert-warning">
                                ไม่พบข้อมูลรายละเอียดบิล
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseBillModal}>
                            ปิด
                        </Button>
                        <Button
                            variant="success"
                            onClick={() => {
                                handleCloseBillModal();
                                showReceiptPreview(selectedBill);
                            }}
                        >
                            <i className="bi bi-printer me-1"></i>
                            พิมพ์ใบเสร็จ
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* โมดัลแสดงตัวอย่างการพิมพ์ */}
                <Modal show={showPrintPreview} onHide={handleClosePrintPreview} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>ตัวอย่างใบเสร็จ</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {loading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">กำลังเตรียมข้อมูล...</p>
                            </div>
                        ) : (
                            <div className="border p-2" style={{ minHeight: '500px' }}>
                                <ReceiptForPrint ref={printComponentRef} receipt={receiptToPrint} qrCodeURL={qrCodeURL} />
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClosePrintPreview}>
                            ปิด
                        </Button>
                        <Button
                            variant="success"
                            onClick={() => {
                                // ใช้วิธีการพิมพ์แบบพื้นฐานของเบราว์เซอร์
                                const printContent = document.createElement('div');
                                printContent.innerHTML = printComponentRef.current.innerHTML;

                                const printWindow = window.open('', '_blank');
                                printWindow.document.write(`
                                    <html>
                                        <head>
                                            <title>พิมพ์ใบเสร็จ #${receiptToPrint?.order_id || ''}</title>
                                            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
                                            <style>
                                                body { font-family: 'Sarabun', sans-serif; padding: 20px; }
                                                @media print {
                                                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                                }
                                            </style>
                                        </head>
                                        <body>
                                            ${printContent.innerHTML}
                                            <script>
                                                // พิมพ์อัตโนมัติเมื่อโหลดเสร็จ
                                                window.onload = function() {
                                                    setTimeout(function() {
                                                        window.print();
                                                        setTimeout(function() { window.close(); }, 500);
                                                    }, 500);
                                                };
                                            </script>
                                        </body>
                                    </html>
                                `);
                                printWindow.document.close();
                            }}
                        >
                            <i className="bi bi-printer me-1"></i>
                            พิมพ์
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default BillHistory;