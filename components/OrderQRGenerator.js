import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // ใช้ QRCodeSVG แทน QRCode
import html2canvas from 'html2canvas';

const OrderQRGenerator = ({ orderId, tableNumber, urlType = 'customer' }) => {
    const [size, setSize] = useState(180);
    const qrRef = useRef(null);

    // สร้าง URL สำหรับการสั่งอาหาร
    // urlType ใช้สำหรับกำหนดว่าจะชี้ไปที่ URL ไหน (customer หรือ order)
    const getQrUrl = () => {
        if (typeof window === 'undefined') {
            return `/${urlType}/${orderId}`;
        }

        // สร้าง URL แบบเต็มรูปแบบ
        return `${window.location.origin}/${urlType}/${orderId}`;
    };

    const orderUrl = getQrUrl();

    // ดาวน์โหลด QR Code เป็นรูปภาพ
    const downloadQRCode = () => {
        if (!qrRef.current) return;

        html2canvas(qrRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${urlType}-qr-table-${tableNumber}.png`;
            link.href = imgData;
            link.click();
        });
    };

    // พิมพ์ QR Code
    const printQRCode = () => {
        if (!qrRef.current) return;

        html2canvas(qrRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const printWindow = window.open('', '_blank');

            if (!printWindow) {
                alert('กรุณาอนุญาตให้เปิดหน้าต่างป๊อปอัพเพื่อพิมพ์ QR Code');
                return;
            }

            const titleText = urlType === 'customer'
                ? 'หน้าควบคุมสำหรับลูกค้า'
                : 'สั่งอาหาร';

            const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code สำหรับโต๊ะ ${tableNumber}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
                font-family: Arial, sans-serif;
              }
              .print-container {
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .qr-image {
                max-width: 250px;
                border: 1px solid #eee;
                padding: 10px;
                margin: 10px 0;
              }
              h2 {
                margin-bottom: 5px;
                color: #333;
              }
              p {
                margin-top: 5px;
                margin-bottom: 20px;
                color: #555;
                font-weight: bold;
                font-size: 16px;
              }
              .url-text {
                margin-top: 15px;
                font-size: 12px;
                word-break: break-all;
                max-width: 280px;
                color: #777;
                padding: 5px;
                background: #f8f9fa;
                border-radius: 4px;
              }
              @media print {
                .no-print {
                  display: none;
                }
                .print-container {
                  border: none;
                  box-shadow: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <h2>สแกนเพื่อ${titleText}</h2>
              <p>โต๊ะ ${tableNumber}</p>
              <img src="${imgData}" class="qr-image" alt="QR Code" />
              <div class="url-text">${orderUrl}</div>
              <button class="no-print" style="margin-top: 30px; padding: 10px 20px; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.print(); window.close();">พิมพ์</button>
            </div>
            <script>
              // อัตโนมัติเปิดหน้าพิมพ์
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

            printWindow.document.open();
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        });
    };

    // คัดลอกลิงก์
    const copyToClipboard = () => {
        navigator.clipboard.writeText(orderUrl).then(
            () => {
                // สร้าง toast แจ้งเตือนแบบง่าย
                const toast = document.createElement('div');
                toast.textContent = 'คัดลอกลิงก์แล้ว';
                toast.style.position = 'fixed';
                toast.style.bottom = '20px';
                toast.style.left = '50%';
                toast.style.transform = 'translateX(-50%)';
                toast.style.backgroundColor = '#28a745';
                toast.style.color = 'white';
                toast.style.padding = '10px 20px';
                toast.style.borderRadius = '4px';
                toast.style.zIndex = '2000';
                document.body.appendChild(toast);

                // ลบ toast หลังจาก 2 วินาที
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 2000);
            },
            () => {
                alert('ไม่สามารถคัดลอกลิงก์ได้');
            }
        );
    };

    const headerTitle = urlType === 'customer'
        ? 'QR Code สำหรับหน้าควบคุมลูกค้า'
        : 'QR Code สำหรับสั่งอาหาร';

    const scanText = urlType === 'customer'
        ? 'สแกนเพื่อเข้าหน้าควบคุม'
        : 'สแกนเพื่อสั่งอาหาร';

    return (
        <div>
            <div className="text-center mb-3">
                <div
                    ref={qrRef}
                    className="qr-code-container bg-white p-3 shadow-sm rounded-3 mb-3 mx-auto"
                    style={{ maxWidth: '280px' }}
                >
                    <div className="fw-bold text-primary mb-2">โต๊ะ {tableNumber}</div>
                    <QRCodeSVG
                        value={orderUrl}
                        size={size}
                        level="H"
                        includeMargin={true}
                        className="mx-auto d-block"
                    />
                    <div className="small text-muted mt-2">{scanText}</div>
                </div>
            </div>

            <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setSize(Math.max(120, size - 30))}
                    title="ย่อขนาด"
                >
                    <i className="bi bi-dash-lg"></i>
                </button>
                <span className="text-muted small">{size}px</span>
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setSize(Math.min(300, size + 30))}
                    title="ขยายขนาด"
                >
                    <i className="bi bi-plus-lg"></i>
                </button>
            </div>

            <div className="d-flex justify-content-center gap-2 mb-3">
                <button
                    className="btn btn-success btn-sm"
                    onClick={downloadQRCode}
                >
                    <i className="bi bi-download me-1"></i>
                    ดาวน์โหลด
                </button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={printQRCode}
                >
                    <i className="bi bi-printer me-1"></i>
                    พิมพ์
                </button>
            </div>

            <div className="input-group input-group-sm mt-3">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    value={orderUrl}
                    readOnly
                />
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={copyToClipboard}
                >
                    <i className="bi bi-clipboard"></i>
                </button>
            </div>
            <div className="form-text text-center">ลิงก์สำหรับ{urlType === 'customer' ? 'หน้าควบคุม' : 'การสั่งอาหาร'}</div>
        </div>
    );
};

export default OrderQRGenerator;