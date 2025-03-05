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

      // คำนวณครั้งที่สั่งและจัดกลุ่มตาม order_time
      const processedOrders = data.map(order => {
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
      {sortedOrders.map((order) => (
        <div key={order.orderId} className={styles.orderCard}>
          <div className={styles.orderHeader}>
            <h3>ออเดอร์ #{order.orderId}</h3>
            <div className={`${styles.statusBadge} ${order.status === 'A' ? styles.statusActive : styles.statusComplete
              }`}>
              {order.status === 'A' ? 'กำลังใช้งาน' : 'เสร็จสิ้น'}
            </div>
          </div>

          {order.timeGroups.map((group) => {
            const groupId = `${order.orderId}-${group.time}`;
            const isExpanded = expandedGroups[groupId];
            const groupTotal = calculateTotal(group.items);

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
                          <th className={styles.textCenter}>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className={item.status === 'V' ? styles.canceledItem : ''}
                          >
                            <td>{item.productName}</td>
                            <td className={styles.textRight}>{item.quantity}</td>
                            <td className={styles.textRight}>฿{item.price.toFixed(2)}</td>
                            <td className={styles.textRight}>
                              ฿{(item.price * item.quantity).toFixed(2)}
                            </td>
                            <td className={styles.textCenter}>
                              <div className={`${styles.itemStatus} ${styles[`status${item.status}`]}`}>
                                {item.status === 'P' ? 'กำลังทำ' :
                                  item.status === 'C' ? 'เสร็จสิ้น' :
                                    item.status === 'V' ? 'ยกเลิก' : 'ไม่ทราบสถานะ'}
                              </div>
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
                          <td>
                            {group.items.some(item => item.status === 'V') && (
                              <span className={styles.totalNote}>(ไม่รวมรายการที่ยกเลิก)</span>
                            )}
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
            <span>ยอดรวมทั้งหมด:</span>
            <span>฿{calculateOrderTotal(order).toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderView;