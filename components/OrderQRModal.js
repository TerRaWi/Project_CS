import React from 'react';
import OrderQRGenerator from './OrderQRGenerator';

// หน้าต่างแสดง QR Code ให้ลูกค้าสแกนสั่งอาหาร (ใช้ทั้งตอนเปิดโต๊ะเสร็จ และปุ่ม QR Code ในหน้าโต๊ะ)
const OrderQRModal = ({ accessToken, tableNumber, title = 'QR Code สำหรับลูกค้าสั่งอาหาร', message, onClose }) => {
    return (
        <div className="qr-code-modal">
            <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ zIndex: 1050, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="bg-white rounded-3 shadow overflow-auto" style={{ maxWidth: '500px', width: '90%', maxHeight: '95vh' }}>
                    <div className="modal-header d-flex justify-content-between bg-primary text-white p-3 rounded-top-3">
                        <h5 className="modal-title mb-0">{title}</h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onClose}
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="modal-body p-4">
                        {message && <p className="text-center text-muted">{message}</p>}
                        <OrderQRGenerator
                            accessToken={accessToken}
                            tableNumber={tableNumber}
                        />
                    </div>
                    <div className="modal-footer bg-light p-3 rounded-bottom-3">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            ปิด
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderQRModal;
