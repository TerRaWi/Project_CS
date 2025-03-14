import React, { useState, useEffect, useCallback } from 'react';
import { getAllActiveOrders, getTables, updateOrderDetailStatus } from '../api';
import Cancelreason from '../components/Cancelreason';
import 'bootstrap/dist/css/bootstrap.min.css';

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
      case 'P': return 'bg-warning text-dark';
      case 'C': return 'bg-success text-white';
      case 'V': return 'bg-danger text-white';
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
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
        </div>
        <span className="ms-3">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        {error}
      </div>
    );
  }

  // กรองเฉพาะโต๊ะที่ไม่ว่าง (มีลูกค้าใช้บริการอยู่)
  const busyTables = tables.filter(table => table.status_id === 2);

  // หาข้อมูลโต๊ะที่เลือก
  const selectedTableGroup = allOrders.find(table => table.tableId === selectedTable);

  // ตัวแปรเพื่อตรวจสอบว่ามีออเดอร์ให้แสดงหรือไม่
  const hasOrders = allOrders.length > 0;

  return (
    <div className="container-fluid py-4">
      <h1 className="display-5 mb-4">จัดการออเดอร์</h1>

      <div className="row">
        {/* Left sidebar - Table List */}
        <div className="col-md-3">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">สถานะโต๊ะอาหาร</h5>
            </div>
            <div className="card-body p-0">
              {/* Show All Orders Button */}
              <div 
                className={`list-group-item list-group-item-action ${showAllOrders ? 'active' : ''}`}
                onClick={handleShowAllOrders}
                style={{cursor: 'pointer'}}
              >
                <span>แสดงออเดอร์ทั้งหมด</span>
              </div>

              {/* Table List */}
              {tables.length === 0 ? (
                <div className="p-3 text-center text-muted">ไม่พบข้อมูลโต๊ะ</div>
              ) : (
                <div className="list-group list-group-flush">
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${selectedTable === table.id && !showAllOrders ? 'active' : ''}`}
                      onClick={() => handleTableSelect(table.id)}
                      style={{cursor: 'pointer'}}
                    >
                      <span>โต๊ะ {table.table_number}</span>
                      <span className={`badge ${table.status_id === 2 ? 'bg-danger' : 'bg-success'}`}>
                        {table.status_id === 2 ? 'ไม่ว่าง' : 'ว่าง'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card-footer bg-white">
              <div className="row text-center">
                <div className="col-4">
                  <div className="fw-bold">{tables.length}</div>
                  <small className="text-muted">ทั้งหมด</small>
                </div>
                <div className="col-4">
                  <div className="fw-bold">{busyTables.length}</div>
                  <small className="text-muted">ไม่ว่าง</small>
                </div>
                <div className="col-4">
                  <div className="fw-bold">{tables.length - busyTables.length}</div>
                  <small className="text-muted">ว่าง</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content - Orders */}
        <div className="col-md-9">
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {showAllOrders
                  ? 'ออเดอร์ทั้งหมด'
                  : `ออเดอร์โต๊ะ ${selectedTableGroup?.tableNumber || ''}`
                }
              </h5>
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <label htmlFor="sortOrder" className="me-2">เรียงตาม: </label>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={handleSortChange}
                    className="form-select form-select-sm"
                  >
                    <option value="newest">ล่าสุดก่อน</option>
                    <option value="oldest">เก่าสุดก่อน</option>
                  </select>
                </div>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={fetchData}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> รีเฟรช
                </button>
              </div>
            </div>
            <div className="card-body">
              {!hasOrders ? (
                <div className="text-center text-muted p-5">
                  ไม่พบออเดอร์ที่กำลังทำอยู่
                </div>
              ) : (
                <div className="orders-container">
                  {/* All Orders Display */}
                  {showAllOrders ? (
                    allOrders.map(tableGroup => (
                      <div key={tableGroup.tableId} className="mb-4">
                        <div className="bg-light p-2 rounded mb-3">
                          <h5 className="d-flex justify-content-between align-items-center mb-0">
                            <span>โต๊ะ {tableGroup.tableNumber}</span>
                            <span className="badge bg-info">{tableGroup.orders.length} ออเดอร์</span>
                          </h5>
                        </div>

                        {tableGroup.orders.map((order) => {
                          const orderedGroups = groupOrderItemsByTime(order.items);

                          return (
                            <div key={order.orderId} className="card mb-3">
                              <div className="card-header bg-primary text-white d-flex justify-content-between">
                                <div>โต๊ะ {tableGroup.tableNumber}</div>
                                <div>ออเดอร์ #{order.orderId}</div>
                              </div>

                              {orderedGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                  <div className="bg-light p-2">
                                    <strong>ครั้งที่ {orderedGroups.length - groupIndex}:</strong> {formatDateTime(group.time)}
                                  </div>

                                  <div className="table-responsive">
                                    <table className="table table-hover">
                                      <thead>
                                        <tr>
                                          <th>รายการ</th>
                                          <th className="text-center">จำนวน</th>
                                          <th className="text-end">ราคา</th>
                                          <th className="text-center">เวลาสั่ง</th>
                                          <th className="text-center">สถานะ</th>
                                          <th className="text-center">การจัดการ</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.items.map((item) => (
                                          <tr
                                            key={item.orderDetailId}
                                            className={item.status === 'P' ? 'table-warning' : ''}
                                          >
                                            <td>{item.productName}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-end">{item.price.toFixed(2)} บาท</td>
                                            <td className="text-center">{formatTime(item.orderTime)}</td>
                                            <td className="text-center">
                                              <span className={`badge ${getStatusClass(item.status)}`}>
                                                {getStatusLabel(item.status)}
                                              </span>
                                            </td>
                                            <td className="text-center">
                                              {item.status === 'P' && (
                                                <div className="btn-group btn-group-sm">
                                                  <button
                                                    className="btn btn-success"
                                                    onClick={() => handleStatusChange(item.orderDetailId, 'C')}
                                                  >
                                                    สำเร็จ
                                                  </button>
                                                  <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleStatusChange(item.orderDetailId, 'V')}
                                                  >
                                                    ยกเลิก
                                                  </button>
                                                </div>
                                              )}
                                              {item.status === 'C' && <span className="text-success">สำเร็จ</span>}
                                              {item.status === 'V' && <span className="text-danger">ยกเลิก</span>}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="d-flex justify-content-end p-2 bg-light">
                                    <strong>รวมครั้งนี้: {group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} บาท</strong>
                                  </div>
                                </div>
                              ))}

                              <div className="card-footer d-flex justify-content-end">
                                <h5 className="mb-0">รวมทั้งหมด: {order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} บาท</h5>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    !selectedTableGroup ? (
                      <div className="text-center text-muted p-5">
                        กรุณาเลือกโต๊ะเพื่อดูออเดอร์
                      </div>
                    ) : (
                      <div>
                        <div className="bg-light p-2 rounded mb-3">
                          <h5 className="d-flex justify-content-between align-items-center mb-0">
                            <span>โต๊ะ {selectedTableGroup.tableNumber}</span>
                            <span className="badge bg-info">{selectedTableGroup.orders.length} ออเดอร์</span>
                          </h5>
                        </div>

                        {selectedTableGroup.orders.map((order) => {
                          const orderedGroups = groupOrderItemsByTime(order.items);

                          return (
                            <div key={order.orderId} className="card mb-3">
                              <div className="card-header bg-primary text-white d-flex justify-content-between">
                                <div>โต๊ะ {selectedTableGroup.tableNumber}</div>
                                <div>ออเดอร์ #{order.orderId}</div>
                              </div>

                              {orderedGroups.map((group, groupIndex) => (
                                <div key={groupIndex} className="mb-3">
                                  <div className="bg-light p-2">
                                    <strong>ครั้งที่ {orderedGroups.length - groupIndex}:</strong> {formatDateTime(group.time)}
                                  </div>

                                  <div className="table-responsive">
                                    <table className="table table-hover">
                                      <thead>
                                        <tr>
                                          <th>รายการ</th>
                                          <th className="text-center">จำนวน</th>
                                          <th className="text-end">ราคา</th>
                                          <th className="text-center">เวลาสั่ง</th>
                                          <th className="text-center">สถานะ</th>
                                          <th className="text-center">การจัดการ</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.items.map((item) => (
                                          <tr
                                            key={item.orderDetailId}
                                            className={item.status === 'P' ? 'table-warning' : ''}
                                          >
                                            <td>{item.productName}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-end">{item.price.toFixed(2)} บาท</td>
                                            <td className="text-center">{formatTime(item.orderTime)}</td>
                                            <td className="text-center">
                                              <span className={`badge ${getStatusClass(item.status)}`}>
                                                {getStatusLabel(item.status)}
                                              </span>
                                            </td>
                                            <td className="text-center">
                                              {item.status === 'P' && (
                                                <div className="btn-group btn-group-sm">
                                                  <button
                                                    className="btn btn-success"
                                                    onClick={() => handleStatusChange(item.orderDetailId, 'C')}
                                                  >
                                                    สำเร็จ
                                                  </button>
                                                  <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleStatusChange(item.orderDetailId, 'V')}
                                                  >
                                                    ยกเลิก
                                                  </button>
                                                </div>
                                              )}
                                              {item.status === 'C' && <span className="text-success">สำเร็จ</span>}
                                              {item.status === 'V' && <span className="text-danger">ยกเลิก</span>}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="d-flex justify-content-end p-2 bg-light">
                                    <strong>รวมครั้งนี้: {group.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} บาท</strong>
                                  </div>
                                </div>
                              ))}

                              <div className="card-footer d-flex justify-content-end">
                                <h5 className="mb-0">รวมทั้งหมด: {order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} บาท</h5>
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
        </div>
      </div>

      {/* Modal for cancellation reasons - This component should be updated to use Bootstrap Modal */}
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