import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getCustomerOrder, requestServiceByToken, getCustomerServiceRequests } from '../../api';
import ServiceRequestStatusBadge from '../../components/ServiceRequestStatusBadge';

// ดึงสถานะคำขอใหม่ทุก ๆ 10 วินาที ให้ลูกค้าเห็นว่าพนักงานรับเรื่องแล้วหรือยัง
const REQUEST_REFRESH_INTERVAL = 10000;

export default function CustomerMainPage() {
    const router = useRouter();
    const { token } = router.query; // token คือรหัสสุ่มใน QR ของออเดอร์
    const [order, setOrder] = useState(null);
    const [table, setTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const [serviceRequests, setServiceRequests] = useState([]);
    const [sendingService, setSendingService] = useState(null);

    useEffect(() => {
        const fetchOrderAndTable = async () => {
            if (!token) return;

            try {
                setLoading(true);
                setError(null);

                // ดึงข้อมูลโต๊ะและออเดอร์จากรหัสใน QR (ใช้ได้เฉพาะออเดอร์ที่ยังไม่ชำระเงิน)
                const data = await getCustomerOrder(token);
                setOrder({ orderId: data.orderId, startTime: data.startTime });
                setTable({ id: data.tableId, table_number: data.tableNumber });
            } catch (err) {
                console.error('Error fetching order data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderAndTable();
    }, [token]);

    // โหลดสถานะคำขอบริการของโต๊ะนี้
    const fetchServiceRequests = async () => {
        try {
            const data = await getCustomerServiceRequests(token);
            setServiceRequests(data.requests);
        } catch (err) {
            // ถ้า QR หมดอายุระหว่างเปิดหน้า (คิดเงินแล้ว) ให้แสดงหน้าแจ้งเตือนแทน
            console.error('Error fetching service requests:', err);
            setError(err.message);
        }
    };

    useEffect(() => {
        if (!token || !order) return;

        fetchServiceRequests();
        const interval = setInterval(fetchServiceRequests, REQUEST_REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [token, order]);

    // แสดง notification แล้วซ่อนหลังจาก 3 วินาที
    const showNotification = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    // ส่งคำขอบริการไปยังพนักงาน (แสดงในหน้าแจ้งเตือนของพนักงาน)
    const requestService = async (serviceType) => {
        if (sendingService) return;

        try {
            setSendingService(serviceType);
            const result = await requestServiceByToken(token, serviceType);
            showNotification('success', result.message);
            await fetchServiceRequests();
        } catch (err) {
            console.error('Error requesting service:', err);
            showNotification('error', err.message);
        } finally {
            setSendingService(null);
        }
    };

    const formatRequestTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
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
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light p-3">
                <div className="text-center bg-white p-4 rounded shadow">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
                    <h4 className="mb-3">ไม่สามารถเปิดหน้าสั่งอาหารได้</h4>
                    <p className="text-muted mb-0">{error}</p>
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
                            <Link href={`/order/${token}`} legacyBehavior>
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
                                className={`card h-100 shadow-sm service-card ${sendingService ? 'opacity-50' : ''}`}
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
                                className={`card h-100 shadow-sm service-card ${sendingService ? 'opacity-50' : ''}`}
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
                                className={`card h-100 shadow-sm service-card ${sendingService ? 'opacity-50' : ''}`}
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
                                className={`card h-100 shadow-sm service-card ${sendingService ? 'opacity-50' : ''}`}
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

                    {/* สถานะคำขอของโต๊ะนี้ */}
                    {serviceRequests.length > 0 && (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-white fw-bold">
                                <i className="bi bi-clock-history me-2"></i>
                                คำขอของคุณ
                            </div>
                            <ul className="list-group list-group-flush">
                                {serviceRequests.map(request => (
                                    <li key={request.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <div>{request.service_type}</div>
                                            <small className="text-muted">{formatRequestTime(request.request_time)} น.</small>
                                        </div>
                                        <ServiceRequestStatusBadge status={request.status} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
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