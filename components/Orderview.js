import React, { useState, useEffect } from 'react';
import { getOrdersByTable } from '../api';
import { Clock } from 'lucide-react';

const Orderview = ({ tableId }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});

    useEffect(() => {
        fetchOrders();
    }, [tableId]);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!tableId) {
                setOrders([]);
                return;
            }
            const data = await getOrdersByTable(tableId);

            // กรองเฉพาะออเดอร์ที่มีสถานะ 'A' (กำลังใช้งาน)
            const activeOrders = data.filter(order => order.status === 'A');

            // คำนวณครั้งที่สั่งและจัดกลุ่มตาม order_time
            const processedOrders = activeOrders.map(order => {
                // จัดกลุ่มสินค้าตาม order_time
                const groupedByTime = {};
                order.items.forEach(item => {
                    const timeKey = new Date(item.orderTime).getTime();
                    if (!groupedByTime[timeKey]) {
                        groupedByTime[timeKey] = {
                            time: item.orderTime,
                            items: []
                        };
                    }
                    groupedByTime[timeKey].items.push(item);
                });

                // แปลงเป็น array และเรียงตามเวลา
                const timeGroups = Object.values(groupedByTime)
                    .sort((a, b) => new Date(a.time) - new Date(b.time))
                    .map((group, index) => ({
                        ...group,
                        orderNumber: index + 1
                    }));

                return {
                    ...order,
                    timeGroups
                };
            });

            setOrders(processedOrders);

            // เปิดกลุ่มล่าสุดโดยอัตโนมัติเมื่อโหลดข้อมูล
            if (processedOrders.length > 0 && processedOrders[0].timeGroups.length > 0) {
                const latestOrder = processedOrders[0];
                const latestGroup = latestOrder.timeGroups[latestOrder.timeGroups.length - 1];
                setExpandedGroups(prev => ({
                    ...prev,
                    [`${latestOrder.orderId}-${latestGroup.time}`]: true
                }));
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err.message || 'ไม่สามารถโหลดข้อมูลออเดอร์ได้');
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (orderId, groupTime) => {
        setExpandedGroups(prev => ({
            ...prev,
            [`${orderId}-${groupTime}`]: !prev[`${orderId}-${groupTime}`]
        }));
    };

    // คำนวณยอดรวมที่ไม่รวมรายการที่ถูกยกเลิก
    const calculateTotal = (items) => {
        return items
            .filter(item => item.status !== 'V')
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    // คำนวณยอดรวมทั้งหมดของออเดอร์ที่ไม่รวมรายการที่ถูกยกเลิก
    const calculateOrderTotal = (order) => {
        return order.items
            .filter(item => item.status !== 'V')
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    if (loading) {
        return (
            <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                </div>
                <p className="mt-2">กำลังโหลดประวัติการสั่ง...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger my-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center my-5 text-muted">
                <i className="bi bi-receipt fs-1"></i>
                <p className="mt-3">ยังไม่มีรายการสั่งอาหาร</p>
            </div>
        );
    }

    const sortedOrders = [...orders].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    return (
        <div className="order-history">
            {sortedOrders.map((order) => (
                <div key={order.orderId} className="card mb-4 shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center bg-light">
                        <h5 className="mb-0">ออเดอร์ #{order.orderId}</h5>
                        <span className="badge bg-primary">กำลังใช้งาน</span>
                    </div>

                    {order.timeGroups.map((group) => {
                        const groupId = `${order.orderId}-${group.time}`;
                        const isExpanded = expandedGroups[groupId];
                        const groupTotal = calculateTotal(group.items);

                        return (
                            <div key={group.time} className="border-bottom">
                                <button
                                    onClick={() => toggleGroup(order.orderId, group.time)}
                                    className="btn btn-light w-100 d-flex justify-content-between align-items-center py-3 border-0 rounded-0"
                                >
                                    <div className="d-flex align-items-center">
                                        <span className="me-3">ครั้งที่ {group.orderNumber}</span>
                                        <div className="d-flex align-items-center text-muted">
                                            <Clock size={16} className="me-1" />
                                            {new Date(group.time).toLocaleTimeString('th-TH')}
                                        </div>
                                    </div>
                                    <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                                </button>

                                {isExpanded && (
                                    <div className="p-3">
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>รายการ</th>
                                                        <th className="text-end">จำนวน</th>
                                                        <th className="text-end">ราคา</th>
                                                        <th className="text-end">รวม</th>
                                                        <th className="text-center">สถานะ</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.items.map((item, idx) => (
                                                        <tr key={idx} className={item.status === 'V' ? 'text-muted' : ''}>
                                                            <td className={item.status === 'V' ? 'text-decoration-line-through' : ''}>
                                                                {item.productName}
                                                            </td>
                                                            <td className={`text-end ${item.status === 'V' ? 'text-decoration-line-through' : ''}`}>
                                                                {item.quantity}
                                                            </td>
                                                            <td className={`text-end ${item.status === 'V' ? 'text-decoration-line-through' : ''}`}>
                                                                ฿{item.price.toFixed(2)}
                                                            </td>
                                                            <td className={`text-end ${item.status === 'V' ? 'text-decoration-line-through' : ''}`}>
                                                                ฿{(item.price * item.quantity).toFixed(2)}
                                                            </td>
                                                            <td className="text-center">
                                                                <span className={`badge ${
                                                                    item.status === 'P' ? 'bg-warning text-dark' : 
                                                                    item.status === 'C' ? 'bg-success' : 
                                                                    item.status === 'V' ? 'bg-danger' : 'bg-secondary'
                                                                }`}>
                                                                    {item.status === 'P' ? 'กำลังทำ' :
                                                                     item.status === 'C' ? 'เสร็จสิ้น' :
                                                                     item.status === 'V' ? 'ยกเลิก' : 'ไม่ทราบสถานะ'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="table-light fw-bold">
                                                        <td colSpan="3" className="text-end">
                                                            รวมครั้งที่ {group.orderNumber}:
                                                        </td>
                                                        <td className="text-end">
                                                            ฿{groupTotal.toFixed(2)}
                                                        </td>
                                                        <td>
                                                            {group.items.some(item => item.status === 'V') && (
                                                                <small className="text-muted">(ไม่รวมรายการที่ยกเลิก)</small>
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="card-footer bg-primary bg-opacity-10 d-flex justify-content-between fw-bold py-3">
                        <span>ยอดรวมทั้งหมด:</span>
                        <span>฿{calculateOrderTotal(order).toFixed(2)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Orderview;