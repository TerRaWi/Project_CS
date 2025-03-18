import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getOrdersByTable, getTables } from '../../api';

export default function CustomerMainPage() {
    const router = useRouter();
    const { id } = router.query; // id คือ orderId
    const [order, setOrder] = useState(null);
    const [table, setTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const fetchOrderAndTable = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                // 1. ดึงข้อมูลโต๊ะทั้งหมด
                const tablesData = await getTables();

                // 2. ค้นหาออเดอร์จากทุกโต๊ะ
                let foundOrder = null;
                let foundTable = null;

                for (const tableItem of tablesData) {
                    if (foundOrder) break;

                    const orders = await getOrdersByTable(tableItem.id);
                    const matchedOrder = orders.find(o => o.orderId.toString() === id);

                    if (matchedOrder) {
                        foundOrder = matchedOrder;
                        foundTable = tableItem;
                        break;
                    }
                }

                if (foundOrder && foundTable) {
                    setOrder(foundOrder);
                    setTable(foundTable);
                } else {
                    setError('ไม่พบข้อมูลออเดอร์ที่ต้องการ');
                }
            } catch (err) {
                console.error('Error fetching order data:', err);
                setError('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderAndTable();
    }, [id]);

    // ฟังก์ชันจำลองการส่งคำขอบริการไปยังเซิร์ฟเวอร์
    const requestService = (serviceType) => {
        // ในอนาคตควรส่งคำขอไปยังเซิร์ฟเวอร์ด้วย API
        console.log(`Requesting service: ${serviceType} for table ${table?.table_number}, order ${id}`);
        
        // แสดง notification
        setNotification({
            type: 'success',
            message: `ส่งคำขอ${serviceType}แล้ว กรุณารอสักครู่`
        });
        
        // ซ่อน notification หลังจาก 3 วินาที
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-content-center align-items-center bg-light">
                <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">กำลังโหลด...</span>
                    </div>
                    <p className="mt-2">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex justify-content-center align-items-center bg-light p-3">
                <div className="text-center bg-white p-4 rounded shadow">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
                    <h4 className="mb-3">{error}</h4>
                    <p className="text-muted mb-4">รหัสออเดอร์ไม่ถูกต้องหรือหมดอายุแล้ว</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => router.push('/')}
                    >
                        กลับหน้าหลัก
                    </button>
                </div>
            </div>
        );
    }

    if (!table || !order) {
        return null;
    }

    return (
        <>
            <Head>
                <title>บริการลูกค้า | โต๊ะ {table.table_number}</title>
                <meta name="description" content={`บริการลูกค้าออนไลน์สำหรับโต๊ะ ${table.table_number}`} />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
            </Head>

            <div className="customer-main-page min-vh-100 bg-light">
                {/* Header */}
                <header className="bg-primary text-white text-center p-3 sticky-top shadow-sm">
                    <h1 className="h4 mb-0">โต๊ะ {table.table_number}</h1>
                </header>

                {/* Main Content */}
                <main className="container p-3">
                    {/* ส่วนแสดงข้อมูลโต๊ะ */}
                    <div className="card mb-4 shadow-sm">
                        <div className="card-body text-center">
                            <div className="mb-2">
                                <span className="badge rounded-pill bg-success px-3 py-2">
                                    <i className="bi bi-check-circle me-1"></i> กำลังให้บริการ
                                </span>
                            </div>
                            <h5 className="card-title">ยินดีต้อนรับ</h5>
                            <p className="text-muted mb-0">เลือกบริการที่ต้องการด้านล่าง</p>
                        </div>
                    </div>

                    {/* ส่วนปุ่มสั่งอาหาร */}
                    <div className="card mb-4 border-primary shadow-sm">
                        <div className="card-body text-center p-4">
                            <div className="mb-3">
                                <i className="bi bi-cart-plus text-primary" style={{ fontSize: "3rem" }}></i>
                            </div>
                            <h5 className="card-title">สั่งอาหาร</h5>
                            <p className="card-text text-muted mb-3">
                                เลือกเมนูอาหารที่ต้องการสั่งเพิ่ม
                            </p>
                            <Link href={`/order/${id}`} legacyBehavior>
                                <a className="btn btn-primary btn-lg w-100 py-3">
                                    <i className="bi bi-menu-button-wide me-2"></i>
                                    ดูเมนูและสั่งอาหาร
                                </a>
                            </Link>
                        </div>
                    </div>

                    {/* ส่วนปุ่มบริการต่างๆ */}
                    <div className="row g-3 mb-4">
                        <div className="col-6">
                            <div 
                                className="card h-100 shadow-sm service-card"
                                onClick={() => requestService("เรียกพนักงาน")}
                            >
                                <div className="card-body text-center p-3">
                                    <div className="icon-wrapper mb-2">
                                        <i className="bi bi-bell-fill text-warning" style={{ fontSize: "2rem" }}></i>
                                    </div>
                                    <h5 className="card-title fs-6">เรียกพนักงาน</h5>
                                </div>
                            </div>
                        </div>

                        <div className="col-6">
                            <div 
                                className="card h-100 shadow-sm service-card"
                                onClick={() => requestService("เติมน้ำซุป/น้ำจิ้ม")}
                            >
                                <div className="card-body text-center p-3">
                                    <div className="icon-wrapper mb-2">
                                        <i className="bi bi-cup-hot-fill text-danger" style={{ fontSize: "2rem" }}></i>
                                    </div>
                                    <h5 className="card-title fs-6">เติมน้ำซุป/น้ำจิ้ม</h5>
                                </div>
                            </div>
                        </div>

                        <div className="col-6">
                            <div 
                                className="card h-100 shadow-sm service-card"
                                onClick={() => requestService("ขอช้อนส้อมเพิ่ม")}
                            >
                                <div className="card-body text-center p-3">
                                    <div className="icon-wrapper mb-2">
                                        <i className="bi bi-tools text-secondary" style={{ fontSize: "2rem" }}></i>
                                    </div>
                                    <h5 className="card-title fs-6">ขอช้อนส้อมเพิ่ม</h5>
                                </div>
                            </div>
                        </div>

                        <div className="col-6">
                            <div 
                                className="card h-100 shadow-sm service-card"
                                onClick={() => requestService("เรียกชำระเงิน")}
                            >
                                <div className="card-body text-center p-3">
                                    <div className="icon-wrapper mb-2">
                                        <i className="bi bi-cash-coin text-success" style={{ fontSize: "2rem" }}></i>
                                    </div>
                                    <h5 className="card-title fs-6">เรียกชำระเงิน</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-light py-3 text-center text-muted mt-auto">
                    <small>ขอบคุณที่มาใช้บริการ</small>
                </footer>

                {/* Notification Toast */}
                {notification && (
                    <div 
                        className={`position-fixed bottom-0 start-50 translate-middle-x mb-4 p-3 rounded shadow ${
                            notification.type === 'success' ? 'bg-success' : 'bg-danger'
                        } text-white`}
                        style={{ zIndex: 1050, minWidth: '250px' }}
                    >
                        <div className="d-flex align-items-center">
                            {notification.type === 'success' ? (
                                <i className="bi bi-check-circle me-2"></i>
                            ) : (
                                <i className="bi bi-exclamation-circle me-2"></i>
                            )}
                            <div>{notification.message}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* เพิ่ม CSS แบบ inline */}
            <style jsx>{`
                .service-card {
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .service-card:hover, .service-card:active {
                    transform: translateY(-5px);
                }
                .icon-wrapper {
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>
        </>
    );
}