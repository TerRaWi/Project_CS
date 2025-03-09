import React, { useState, useEffect, useCallback } from 'react';
import { getAllActiveOrders, getTables, updateOrderDetailStatus } from '../api';
import styles from "../styles/orders.module.css";
import Cancelreason from '../components/Cancelreason';

const Orders = () => {
  const [tables, setTables] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' หรือ 'oldest'
  const [selectedTable, setSelectedTable] = useState(null);
  // เพิ่มstate เพื่อควบคุมการแสดงผลทั้งหมด
  const [showAllOrders, setShowAllOrders] = useState(true);
  
  // เพิ่ม state สำหรับการจัดการ modal ยกเลิกรายการอาหาร
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState(null);

  // ใช้ useEffect เพื่อเรียก fetchData เมื่อ sortOrder เปลี่ยน
  useEffect(() => {
    fetchData();
  }, [sortOrder]); // เพิ่ม sortOrder เป็น dependency

  // โหลดข้อมูลครั้งแรกเมื่อ component ถูกโหลด
  useEffect(() => {
    fetchData();
    // ลบการตั้งเวลาดึงข้อมูลทุก 30 วินาที
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // ดึงข้อมูลโต๊ะทั้งหมด
      const tablesData = await getTables();
      setTables(tablesData);

      // ดึงข้อมูลออเดอร์ทั้งหมดที่กำลังทำงานอยู่ (Active)
      const activeOrders = await getAllActiveOrders();
      console.log('ข้อมูลออเดอร์จาก API:', activeOrders);

      // จัดกลุ่มออเดอร์ตามโต๊ะและเก็บเวลาล่าสุดของแต่ละโต๊ะ
      const ordersByTable = {};
      
      activeOrders.forEach(order => {
        // แปลงวันที่ของออเดอร์เป็น Date object
        const orderDate = new Date(order.date);
        
        // ค้นหาเวลาล่าสุดของรายการในออเดอร์
        let latestItemTime = orderDate;
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            const itemTime = new Date(item.orderTime);
            if (itemTime > latestItemTime) {
              latestItemTime = itemTime;
            }
          });
        }
        
        if (!ordersByTable[order.tableId]) {
          ordersByTable[order.tableId] = {
            tableId: order.tableId,
            tableNumber: order.tableNumber,
            orders: [order],
            latestOrderTime: latestItemTime,
            latestTimestamp: latestItemTime.getTime()
          };
        } else {
          ordersByTable[order.tableId].orders.push(order);
          // อัพเดทเวลาล่าสุดถ้าออเดอร์นี้ใหม่กว่า
          if (latestItemTime.getTime() > ordersByTable[order.tableId].latestTimestamp) {
            ordersByTable[order.tableId].latestOrderTime = latestItemTime;
            ordersByTable[order.tableId].latestTimestamp = latestItemTime.getTime();
          }
        }
      });

      // แปลงเป็นอาร์เรย์และเรียงลำดับด้วย timestamp
      const allOrdersArray = Object.values(ordersByTable);
      console.log('ข้อมูลหลังจากจัดกลุ่ม ก่อนเรียง:', allOrdersArray);

      // เรียงลำดับตามเวลาล่าสุด
      if (sortOrder === 'newest') {
        allOrdersArray.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
      } else {
        allOrdersArray.sort((a, b) => a.latestTimestamp - b.latestTimestamp);
      }

      console.log('ข้อมูลหลังจากเรียงลำดับ:', allOrdersArray);
      setAllOrders(allOrdersArray);
      
      // ถ้ายังไม่ได้เลือกโต๊ะให้เลือกโต๊ะแรก (ถ้ามี)
      if (!selectedTable && allOrdersArray.length > 0) {
        setSelectedTable(allOrdersArray[0].tableId);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  }, [sortOrder, selectedTable]);

  const handleSortChange = (e) => {
    // เปลี่ยนค่า sortOrder แต่ไม่ต้องเรียก fetchData เพราะ useEffect จะจัดการให้
    const newSortOrder = e.target.value;
    setSortOrder(newSortOrder);
    // ไม่ต้องเรียก fetchData() ที่นี่อีกเพราะ useEffect จะทำงานเมื่อ sortOrder เปลี่ยนแปลง
  };

  const handleStatusChange = (detailId, newStatus) => {
    // ถ้าเป็นการยกเลิก (status = V) ให้แสดง modal เลือกเหตุผล
    if (newStatus === 'V') {
      setSelectedDetailId(detailId);
      setShowCancelModal(true);
      return;
    }
    
    // ถ้าไม่ใช่การยกเลิก ให้อัพเดทสถานะตามปกติ
    handleUpdateStatus(detailId, newStatus);
  };

  // ฟังก์ชันสำหรับจัดการการอัพเดทสถานะทั่วไป
  const handleUpdateStatus = async (detailId, newStatus, cancelReasonId = null) => {
    try {
      await updateOrderDetailStatus(detailId, newStatus, cancelReasonId);
      fetchData();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัพเดตสถานะ');
    }
  };

  // ฟังก์ชันสำหรับจัดการการยกเลิกรายการอาหารพร้อมเหตุผล
  const handleCancelWithReason = async (detailId, newStatus, cancelReasonId) => {
    try {
      await updateOrderDetailStatus(detailId, newStatus, cancelReasonId);
      
      // ปิด modal
      setShowCancelModal(false);
      setSelectedDetailId(null);
      
      // โหลดข้อมูลใหม่
      fetchData();
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleTableSelect = (tableId) => {
    setSelectedTable(tableId);
    setShowAllOrders(false); // เมื่อเลือกโต๊ะเฉพาะ ปิดการแสดงทั้งหมด
  };

  // ฟังก์ชันใหม่สำหรับกดปุ่มแสดงออเดอร์ทั้งหมด
  const handleShowAllOrders = () => {
    setShowAllOrders(true);
    setSelectedTable(null);
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

    // เรียงตามเวลาล่าสุด หรือเก่าสุด ตาม sortOrder
    return Object.values(groupedItems).sort((a, b) => {
      // นำ timestamp มาเปรียบเทียบ
      const timeA = a.time.getTime();
      const timeB = b.time.getTime();
      
      if (sortOrder === 'newest') {
        return timeB - timeA; // ล่าสุดก่อน
      } else {
        return timeA - timeB; // เก่าสุดก่อน
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

  // ตัวแปรเพื่อตรวจสอบว่ามีออเดอร์ให้แสดงหรือไม่
  const hasOrders = allOrders.length > 0;

  return (
    <div className={styles.ordersContainer}>
      <h1 className={styles.pageTitle}>จัดการออเดอร์</h1>

      <div className={styles.contentWrapper}>
        <div className={styles.tablesList}>
          <h2 className={styles.sectionTitle}>สถานะโต๊ะอาหาร</h2>

          {/* เพิ่มปุ่มแสดงออเดอร์ทั้งหมด */}
          <div
            className={`${styles.tableStatusItem} ${showAllOrders ? styles.activeTable : ''}`}
            onClick={handleShowAllOrders}
            style={{
              cursor: 'pointer',
              backgroundColor: showAllOrders ? '#e3f2fd' : '#f8f8f8',
              marginBottom: '10px',
              borderLeft: showAllOrders ? '4px solid #2196F3' : '4px solid #ddd'
            }}
          >
            <span className={styles.tableNumber}>แสดงออเดอร์ทั้งหมด</span>
          </div>

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
                    backgroundColor: selectedTable === table.id ? '#e3f2fd' : '#f8f8f8',
                    borderLeft: selectedTable === table.id ? '4px solid #2196F3' : '4px solid #ddd'
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
            <h2 className={styles.sectionTitle}>
              {showAllOrders
                ? 'ออเดอร์ทั้งหมด'
                : `ออเดอร์โต๊ะ ${selectedTableGroup?.tableNumber || ''}`
              }
            </h2>

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
              
              {/* เพิ่มปุ่มรีเฟรชกลับมา เนื่องจากเราไม่มีการรีเฟรชอัตโนมัติแล้ว */}
              <button
                className={styles.refreshButton}
                onClick={fetchData}
              >
                รีเฟรช
              </button>
            </div>
          </div>

          {!hasOrders ? (
            <div className={styles.noOrders}>ไม่พบออเดอร์ที่กำลังทำอยู่</div>
          ) : (
            <div className={styles.ordersListContainer}>
              {/* แสดงออเดอร์ทั้งหมดเมื่อ showAllOrders เป็น true */}
              {showAllOrders ? (
                // แสดงออเดอร์ทุกโต๊ะ
                allOrders.map(tableGroup => (
                  <div key={tableGroup.tableId} className={styles.selectedTableOrders} style={{ marginBottom: '20px' }}>
                    <div className={styles.tableHeader}>
                      <h3 className={styles.tableTitle}>
                        โต๊ะ {tableGroup.tableNumber}
                        <span className={styles.orderCount}>{tableGroup.orders.length} ออเดอร์</span>
                      </h3>
                    </div>

                    {tableGroup.orders.map((order, orderIndex) => {
                      // จัดกลุ่มรายการอาหารตามเวลาที่สั่ง
                      const orderedGroups = groupOrderItemsByTime(order.items);

                      return (
                        <div key={order.orderId} className={styles.orderContainer}>
                          <div className={styles.orderHeader}>
                            <div className={styles.orderTitle}>
                              โต๊ะ {tableGroup.tableNumber}
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
                ))
              ) : (
                // แสดงเฉพาะโต๊ะที่เลือก
                !selectedTableGroup ? (
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
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal สำหรับเลือกเหตุผลการยกเลิก */}
      <Cancelreason
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelWithReason}
        detailId={selectedDetailId}
      />
    </div>
  );
};

export default Orders;