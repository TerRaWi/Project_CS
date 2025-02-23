import React, { useState, useEffect } from 'react';
import { getOrdersByTable } from '../api';
import styles from '../styles/ordermenu.module.css';
import { Clock } from 'lucide-react';

const OrderView = ({ tableId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!tableId) {
          setOrders([]);
          return;
        }
        const data = await getOrdersByTable(tableId);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'ไม่สามารถโหลดข้อมูลออเดอร์ได้');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [tableId]);

  const toggleGroup = (orderId, groupTime) => {
    setExpandedGroups(prev => ({
      ...prev,
      [`${orderId}-${groupTime}`]: !prev[`${orderId}-${groupTime}`]
    }));
  };

  if (loading) {
    return <div className={styles.loading}>กำลังโหลด...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!orders || orders.length === 0) {
    return <div className={styles.emptyState}>ยังไม่มีประวัติการสั่งอาหาร</div>;
  }

  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  return (
    <div className={styles.historyCard}>
      {sortedOrders.map((order) => {
        const groupedItems = order.items.reduce((acc, item) => {
          const timeKey = item.orderTime;
          if (!acc[timeKey]) {
            acc[timeKey] = [];
          }
          acc[timeKey].push(item);
          return acc;
        }, {});

        const sortedGroups = Object.entries(groupedItems)
          .sort(([a], [b]) => new Date(a) - new Date(b))
          .map(([time, items], index) => ({
            time,
            orderNumber: index + 1,
            items
          }));

        return (
          <div key={order.orderId} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <h3>ออเดอร์ #{order.orderId}</h3>
              <div className={`${styles.statusBadge} ${
                order.status === 'A' ? styles.statusActive : styles.statusComplete
              }`}>
                {order.status === 'A' ? 'กำลังจัดเตรียม' : 'เสร็จสิ้น'}
              </div>
            </div>

            {sortedGroups.map((group) => {
              const groupId = `${order.orderId}-${group.time}`;
              const isExpanded = expandedGroups[groupId];
              const groupTotal = group.items.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
              );

              return (
                <div key={group.time} className={styles.orderGroup}>
                  <button
                    onClick={() => toggleGroup(order.orderId, group.time)}
                    className={styles.groupHeader}
                  >
                    <div className={styles.groupInfo}>
                      <span>ครั้งที่ {group.orderNumber}</span>
                      <div className={styles.orderTime}>
                        <Clock className={styles.clockIcon} />
                        {new Date(group.time).toLocaleTimeString('th-TH')}
                      </div>
                    </div>
                    <span className={styles.expandIcon}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className={styles.orderContent}>
                      <table className={styles.orderTable}>
                        <thead>
                          <tr>
                            <th>รายการ</th>
                            <th className={styles.textRight}>จำนวน</th>
                            <th className={styles.textRight}>ราคา</th>
                            <th className={styles.textRight}>รวม</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.productName}</td>
                              <td className={styles.textRight}>{item.quantity}</td>
                              <td className={styles.textRight}>฿{item.price.toFixed(2)}</td>
                              <td className={styles.textRight}>
                                ฿{(item.price * item.quantity).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                          <tr className={styles.totalRow}>
                            <td colSpan="3" className={styles.textRight}>
                              รวมครั้งที่ {group.orderNumber}:
                            </td>
                            <td className={styles.textRight}>
                              ฿{groupTotal.toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            <div className={styles.orderTotal}>
              รวมทั้งหมด: ฿
              {order.items.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
              ).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderView;