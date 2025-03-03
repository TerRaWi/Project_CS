import React, { useState, useEffect } from 'react';
import { getAllActiveOrders, getTables, updateOrderDetailStatus } from '../api';
import styles from "../styles/orders.module.css";

const Orders = () => {
  const [tables, setTables] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' หรือ 'oldest'
  const [selectedTable, setSelectedTable] = useState(null);
  
  useEffect(() => {
    fetchData();
    
    // ตั้งเวลาดึงข้อมูลใหม่ทุก 30 วินาที
    const intervalId = setInterval(fetchData, 30000);
    
    // ล้าง interval เมื่อ component ถูกถอดออกจาก DOM
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // ดึงข้อมูลโต๊ะทั้งหมด
      const tablesData = await getTables();
      setTables(tablesData);
      
      // ดึงข้อมูลออเดอร์ทั้งหมดที่กำลังทำงานอยู่ (Active)
      const activeOrders = await getAllActiveOrders();
      
      // จัดกลุ่มออเดอร์ตามโต๊ะ
      const ordersByTable = {};
      
      activeOrders.forEach(order => {
        if (!ordersByTable[order.tableId]) {
          ordersByTable[order.tableId] = {
            tableId: order.tableId,
            tableNumber: order.tableNumber,
            orders: [order] // เก็บทั้งออเดอร์
          };
        } else {
          // ตรวจสอบว่าออเดอร์นี้มีอยู่แล้วหรือไม่
          const existingOrder = ordersByTable[order.tableId].orders.find(o => o.orderId === order.orderId);
          
          if (!existingOrder) {
            ordersByTable[order.tableId].orders.push(order);
          }
        }
      });
      
      // เรียงลำดับออเดอร์ในแต่ละโต๊ะตามเวลา
      Object.values(ordersByTable).forEach(tableGroup => {
        tableGroup.orders.sort((a, b) => {
          if (sortOrder === 'newest') {
            return new Date(b.date) - new Date(a.date);
          } else {
            return new Date(a.date) - new Date(b.date);
          }
        });
      });
      
      setAllOrders(Object.values(ordersByTable));
      
      // ถ้ายังไม่ได้เลือกโต๊ะให้เลือกโต๊ะแรก (ถ้ามี)
      if (!selectedTable && Object.values(ordersByTable).length > 0) {
        setSelectedTable(Object.values(ordersByTable)[0].tableId);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  const handleSortChange = (e) => {
    const newSortOrder = e.target.value;
    setSortOrder(newSortOrder);
    fetchData();
  };

  const handleStatusChange = async (detailId, newStatus) => {
    try {
      await updateOrderDetailStatus(detailId, newStatus);
      fetchData();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
    }
  };

  const handleTableSelect = (tableId) => {
    setSelectedTable(tableId);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'A': return 'กำลังทำ';
      case 'P': return 'กำลังดำเนินการ';
      case 'C': return 'สำเร็จ';
      case 'V': return 'ยกเลิก';
      default: return 'ไม่ระบุ';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'A': 
      case 'P': return styles.statusActive;
      case 'C': return styles.statusCompleted;
      case 'V': return styles.statusVoid;
      default: return '';
    }
  };

  // จัดรูปแบบวันที่และเวลา
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const thaiDate = new Date(date.getTime());
    
    const day = thaiDate.getDate();
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const month = months[thaiDate.getMonth()];
    const year = thaiDate.getFullYear() + 543; // แปลงเป็นพ.ศ.
    
    const hours = String(thaiDate.getHours()).padStart(2, '0');
    const minutes = String(thaiDate.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  // จัดรูปแบบเวลาอย่างเดียว
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };

  // จัดกลุ่มรายการอาหารตามเวลาที่สั่ง
  const groupOrderItemsByTime = (items) => {
    const groupedItems = {};
    
    items.forEach(item => {
      const orderTime = new Date(item.orderTime);
      const timeKey = orderTime.toISOString();
      
      if (!groupedItems[timeKey]) {
        groupedItems[timeKey] = {
          time: orderTime,
          items: []
        };
      }
      
      groupedItems[timeKey].items.push(item);
    });
    
    // เรียงตามเวลาล่าสุด
    return Object.values(groupedItems).sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.time - a.time;
      } else {
        return a.time - b.time;
      }
    });
  };

  if (loading && allOrders.length === 0) {
    return <div className={styles.loading}>กำลังโหลดข้อมูล...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  // กรองเฉพาะโต๊ะที่ไม่ว่าง (มีลูกค้าใช้บริการอยู่)
  const busyTables = tables.filter(table => table.status_id === 2);
  
  // หาข้อมูลโต๊ะที่เลือก
  const selectedTableGroup = allOrders.find(table => table.tableId === selectedTable);

  return (
    <div className={styles.ordersContainer}>
      <h1 className={styles.pageTitle}>จัดการออเดอร์</h1>
      
      <div className={styles.contentWrapper}>
        <div className={styles.tablesList}>
          <h2 className={styles.sectionTitle}>สถานะโต๊ะอาหาร</h2>
          {tables.length === 0 ? (
            <div className={styles.noTables}>ไม่พบข้อมูลโต๊ะ</div>
          ) : (
            <div className={styles.tableStatus}>
              {tables.map((table) => (
                <div 
                  key={table.id} 
                  className={styles.tableStatusItem}
                  onClick={() => handleTableSelect(table.id)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedTable === table.id ? '#e3f2fd' : '#f8f8f8'
                  }}
                >
                  <span className={styles.tableNumber}>โต๊ะ {table.table_number}</span>
                  <span className={`${styles.statusBadge} ${table.status_id === 2 ? styles.statusBusy : styles.statusFree}`}>
                    {table.status_id === 2 ? 'ไม่ว่าง' : 'ว่าง'}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div className={styles.tableStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>จำนวนโต๊ะทั้งหมด:</span>
              <span className={styles.statValue}>{tables.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>โต๊ะที่ไม่ว่าง:</span>
              <span className={styles.statValue}>{busyTables.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>โต๊ะว่าง:</span>
              <span className={styles.statValue}>{tables.length - busyTables.length}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.ordersList}>
          <div className={styles.ordersHeader}>
            <h2 className={styles.sectionTitle}>ออเดอร์ทั้งหมด</h2>
            
            <div className={styles.orderControls}>
              <div className={styles.orderTimeSort}>
                <label htmlFor="sortOrder">เรียงตาม: </label>
                <select 
                  id="sortOrder" 
                  value={sortOrder}
                  onChange={handleSortChange}
                  className={styles.sortSelect}
                >
                  <option value="newest">ล่าสุดก่อน</option>
                  <option value="oldest">เก่าสุดก่อน</option>
                </select>
              </div>
              
              <button 
                className={styles.refreshButton}
                onClick={fetchData}
              >
                รีเฟรช
              </button>
            </div>
          </div>
          
          {!selectedTableGroup ? (
            <div className={styles.noOrders}>กรุณาเลือกโต๊ะเพื่อดูออเดอร์</div>
          ) : (
            <div className={styles.selectedTableOrders}>
              <div className={styles.tableHeader}>
                <h3 className={styles.tableTitle}>
                  โต๊ะ {selectedTableGroup.tableNumber}
                  <span className={styles.orderCount}>{selectedTableGroup.orders.length} ออเดอร์</span>
                </h3>
              </div>
              
              {selectedTableGroup.orders.map((order, orderIndex) => {
                // จัดกลุ่มรายการอาหารตามเวลาที่สั่ง
                const orderedGroups = groupOrderItemsByTime(order.items);
                
                return (
                  <div key={order.orderId} className={styles.orderContainer}>
                    <div className={styles.orderHeader}>
                      <div className={styles.orderTitle}>
                        โต๊ะ {selectedTableGroup.tableNumber} <span className={styles.orderBadge}>{selectedTableGroup.orders.length} ออเดอร์</span>
                      </div>
                      <div className={styles.orderBadgeBlue}>
                        ออเดอร์ #{order.orderId}
                      </div>
                    </div>
                    
                    {orderedGroups.map((group, groupIndex) => (
                      <div key={groupIndex} className={styles.orderGroup}>
                        <div className={styles.orderTimeHeader}>
                          ครั้งที่ {orderedGroups.length - groupIndex}: {formatDateTime(group.time)}
                        </div>
                        
                        <table className={styles.itemsTable}>
                          <thead>
                            <tr>
                              <th>รายการ</th>
                              <th>จำนวน</th>
                              <th>ราคา</th>
                              <th>เวลาสั่ง</th>
                              <th>สถานะ</th>
                              <th>การจัดการ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((item) => (
                              <tr 
                                key={item.orderDetailId} 
                                className={item.status === 'P' ? styles.activeItem : ''}
                              >
                                <td>{item.productName}</td>
                                <td className={styles.centered}>{item.quantity}</td>
                                <td className={styles.priceColumn}>{item.price.toFixed(2)} บาท</td>
                                <td className={styles.centered}>{formatTime(item.orderTime)}</td>
                                <td className={styles.centered}>
                                  <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                                    {getStatusLabel(item.status)}
                                  </span>
                                </td>
                                <td className={styles.actionsColumn}>
                                  {item.status === 'P' && (
                                    <div className={styles.actionButtons}>
                                      <button 
                                        className={`${styles.actionButton} ${styles.completeButton}`}
                                        onClick={() => handleStatusChange(item.orderDetailId, 'C')}
                                      >
                                        สำเร็จ
                                      </button>
                                      <button 
                                        className={`${styles.actionButton} ${styles.cancelButton}`}
                                        onClick={() => handleStatusChange(item.orderDetailId, 'V')}
                                      >
                                        ยกเลิก
                                      </button>
                                    </div>
                                  )}
                                  {item.status === 'C' && <span className={styles.statusText}>สำเร็จ</span>}
                                  {item.status === 'V' && <span className={styles.statusText}>ยกเลิก</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        <div className={styles.groupSummary}>
                          <div className={styles.subtotalAmount}>
                            รวมครั้งนี้: {group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} บาท
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className={styles.orderSummary}>
                      <div className={styles.totalAmount}>
                        รวมทั้งหมด: {order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} บาท
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;