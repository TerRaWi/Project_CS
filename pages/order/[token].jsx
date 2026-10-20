import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { getCustomerOrder } from '../../api';

// ใช้ dynamic import เพื่อป้องกันปัญหา SSR กับคอมโพเนนต์ที่ใช้ window หรือ document
const Ordermenu = dynamic(() => import('../../components/Ordermenu'), {
    ssr: false,
});

// หน้าสั่งอาหารของลูกค้า (เปิดจากหน้า /customer/[token] หลังสแกน QR)
export default function OrderByTokenPage() {
    const router = useRouter();
    const { token } = router.query; // token คือรหัสสุ่มใน QR ของออเดอร์
    const [table, setTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderAndTable = async () => {
            // ตรวจสอบว่ามี token ที่ส่งมาหรือไม่
            if (!token) return;

            try {
                setLoading(true);
                setError(null);

                // ดึงข้อมูลโต๊ะจากรหัสใน QR (ใช้ได้เฉพาะออเดอร์ที่ยังไม่ชำระเงิน)
                const data = await getCustomerOrder(token);
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

    if (loading) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center bg-light" style={{ height: '100vh' }}>
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
            <div className="container-fluid d-flex justify-content-center align-items-center bg-light p-3" style={{ minHeight: '100vh' }}>
                <div className="text-center bg-white p-4 rounded shadow">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
                    <h4 className="mb-3">ไม่สามารถเปิดหน้าสั่งอาหารได้</h4>
                    <p className="text-muted mb-0">{error}</p>
                </div>
            </div>
        );
    }

    // ถ้าพบข้อมูลโต๊ะ แสดงหน้าสั่งอาหาร
    if (table) {
        return (
            <>
                <Head>
                    <title>สั่งอาหาร | โต๊ะ {table.table_number}</title>
                    <meta name="description" content={`สั่งอาหารออนไลน์สำหรับโต๊ะ ${table.table_number}`} />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                </Head>

                <div className="direct-order-container">
                    <Ordermenu
                        table={table}
                        customerToken={token}
                        onClose={() => router.push(`/customer/${token}`)}
                    />
                </div>
            </>
        );
    }

    // Fallback ในกรณีที่ข้อมูลยังไม่พร้อม
    return null;
}
