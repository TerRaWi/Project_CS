import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { getOrdersByTable, getTables } from '../../api';

// ใช้ dynamic import เพื่อป้องกันปัญหา SSR กับคอมโพเนนต์ที่ใช้ window หรือ document
const Ordermenu = dynamic(() => import('../../components/Ordermenu'), {
    ssr: false,
});

export default function OrderByIdPage() {
    const router = useRouter();
    const { id } = router.query;
    const [order, setOrder] = useState(null);
    const [table, setTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderAndTable = async () => {
            // ตรวจสอบว่ามี ID ที่ส่งมาหรือไม่
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                // สมมติว่า id ที่ส่งมาเป็น orderId
                // ในกรณีจริงอาจต้องเปลี่ยนเป็น API ที่ดึงข้อมูลออเดอร์โดยตรงจาก orderId

                // 1. ดึงข้อมูลโต๊ะทั้งหมดก่อน
                const tablesData = await getTables();

                // 2. ค้นหาออเดอร์จากทุกโต๊ะ (อาจไม่ใช่วิธีที่มีประสิทธิภาพที่สุด แต่ใช้กับ API ที่มีอยู่)
                let foundOrder = null;
                let foundTable = null;

                for (const tableItem of tablesData) {
                    if (foundOrder) break;

                    const orders = await getOrdersByTable(tableItem.id);

                    // ค้นหาออเดอร์ที่ตรงกับ ID
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

    if (loading) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">กำลังโหลด...</span>
                    </div>
                    <p className="mt-2">กำลังโหลดข้อมูลออเดอร์...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="text-center bg-light p-5 rounded shadow">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
                    <h4 className="mb-3">{error}</h4>
                    <p className="text-muted mb-4">รหัสออเดอร์ที่ระบุไม่ถูกต้องหรือหมดอายุแล้ว</p>
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

    // ถ้าพบข้อมูลออเดอร์และโต๊ะ แสดงหน้าสั่งอาหาร
    if (table && order) {
        return (
            <>
                <Head>
                    <title>สั่งอาหาร | โต๊ะ {table.table_number}</title>
                    <meta name="description" content={`สั่งอาหารออนไลน์สำหรับโต๊ะ ${table.table_number}`} />
                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
                </Head>

                <div className="direct-order-container">
                    <Ordermenu
                        table={table}
                        onClose={() => router.push('/')}
                    />
                </div>
            </>
        );
    }

    // Fallback ในกรณีที่ข้อมูลยังไม่พร้อม
    return null;
}