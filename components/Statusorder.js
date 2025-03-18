import React, { useState, useEffect } from 'react';
import { updateOrderDetailStatus, getOrdersByTable, getCancelReasons } from '../api';
import Cancelreason from './Cancelreason';
import 'bootstrap/dist/css/bootstrap.min.css';

const Statusorder = ({ orderId, tableId, tableNumber, onStatusUpdate }) => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [allOrderInstances, setAllOrderInstances] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId);
  const [orderTime, setOrderTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // เพิ่ม state สำหรับการจัดการ modal ยกเลิกรายการอาหาร
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState(null);

  useEffect(() => {
    fetchAllOrdersForTable();
  }, [tableId]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  const fetchAllOrdersForTable = async () => {
    try {
      setLoading(true);
      const orders = await getOrdersByTable(tableId);
      
      if (orders && orders.length > 0) {
        // Sort orders by date (newest first)
        const sortedOrders = [...orders].sort((a, b) => {
          // เปรียบเทียบวันที่ของออเดอร์ก่อน
          const dateComparison = new Date(b.date) - new Date(a.date);
          
          // ถ้าวันที่เท่ากัน ให้พิจารณาเวลาในรายการอาหารที่ใหม่ที่สุดของแต่ละออเดอร์
          if (dateComparison === 0 && a.items && b.items) {
            // หาเวลาล่าสุดในรายการของแต่ละออเดอร์
            const latestTimeA = a.items.reduce((latest, item) => {
              const itemTime = new Date(item.orderTime).getTime();
              return itemTime > latest ? itemTime : latest;
            }, 0);
            
            const latestTimeB = b.items.reduce((latest, item) => {
              const itemTime = new Date(item.orderTime).getTime();
              return itemTime > latest ? itemTime : latest;
            }, 0);
            
            return latestTimeB - latestTimeA;
          }
          
          return dateComparison;
        });
        
        setAllOrderInstances(sortedOrders);
        
        // If no order is selected yet, select the first one
        if (!selectedOrderId && sortedOrders.length > 0) {
          setSelectedOrderId(sortedOrders[0].orderId);
        }
      } else {
        setAllOrderInstances([]);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderIdToFetch) => {
    try {
      setLoading(true);
      const orders = await getOrdersByTable(tableId);
      
      // ค้นหา order ที่ตรงกับ orderId ที่เลือก
      const currentOrder = orders.find(order => order.orderId === orderIdToFetch);
      
      if (currentOrder) {
        // Sort items by order time - newest first
        const sortedItems = [...currentOrder.items].sort((a, b) => 
          new Date(b.orderTime) - new Date(a.orderTime)
        );
        
        setOrderDetails(sortedItems);
        setOrderTime(new Date(currentOrder.date));
      } else {
        setOrderDetails([]);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setLoading(false);
    }
  };

  const handleStatusChange = async (detailId, newStatus) => {
    // ถ้าเป็นการยกเลิก (status = V) ให้แสดง modal เลือกเหตุผล
    if (newStatus === 'V') {
      setSelectedDetailId(detailId);
      setShowCancelModal(true);
      return;
    }
    
    // ถ้าไม่ใช่การยกเลิก ให้อัพเดทสถานะตามปกติ
    try {
      await updateOrderDetailStatus(detailId, newStatus);
      
      // อัปเดตสถานะในหน้าจอ
      fetchOrderDetails(selectedOrderId);
      
      // เรียก callback function เพื่อแจ้งให้ parent component ทราบ
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // ฟังก์ชันสำหรับจัดการการยกเลิกรายการอาหารพร้อมเหตุผล
  const handleCancelWithReason = async (detailId, newStatus, cancelReasonId) => {
    try {
      await updateOrderDetailStatus(detailId, newStatus, cancelReasonId);
      
      // ปิด modal
      setShowCancelModal(false);
      setSelectedDetailId(null);
      
      // อัปเดตสถานะในหน้าจอ
      fetchOrderDetails(selectedOrderId);
      
      // เรียก callback function เพื่อแจ้งให้ parent component ทราบ
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleOrderInstanceChange = (newOrderId) => {
    setSelectedOrderId(parseInt(newOrderId));
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
  const formatDateTime = (date) => {
    if (!date) return '';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('th-TH', options);
  };

  // จัดรูปแบบเวลาอย่างเดียว
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { 
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    
    return date.toLocaleTimeString('th-TH', options);
  };

  if (loading && allOrderInstances.length === 0) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (allOrderInstances.length === 0) {
    return (
      <div className="text-center text-muted my-5 font-italic">
        ไม่พบรายการอาหาร
      </div>
    );
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="mb-3">
          <h3 className="card-title mb-0">ออเดอร์ #{selectedOrderId}</h3>
          <div className="d-flex gap-3 text-muted small mt-1">
            <p className="mb-0">โต๊ะ: {tableNumber}</p>
            {orderTime && <p className="mb-0">เวลา: {formatDateTime(orderTime)}</p>}
          </div>
        </div>
        
        {allOrderInstances.length > 1 && (
          <div className="bg-light p-3 rounded mb-3">
            <div className="row align-items-center">
              <label htmlFor="orderInstance" className="col-sm-3 col-form-label">ครั้งที่สั่ง:</label>
              <div className="col-sm-9">
                <select 
                  id="orderInstance" 
                  value={selectedOrderId}
                  onChange={(e) => handleOrderInstanceChange(parseInt(e.target.value))}
                  className="form-select"
                >
                  {allOrderInstances.map((order, index) => (
                    <option key={order.orderId} value={order.orderId}>
                      ครั้งที่ {allOrderInstances.length - index}: {formatDateTime(new Date(order.date))}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center my-4">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
              <span className="visually-hidden">กำลังโหลด...</span>
            </div>
            กำลังโหลดรายการ...
          </div>
        ) : (
          <>
            <div className="mb-4">
              {orderDetails.length === 0 ? (
                <div className="text-center text-muted my-4 font-italic">
                  ไม่พบรายการอาหารในออเดอร์นี้
                </div>
              ) : (
                <div className="list-group">
                  {orderDetails.map((item, index) => (
                    <div key={index} className="list-group-item py-3">
                      <div className="row">
                        <div className="col-md-7">
                          <div className="d-flex flex-column">
                            <span className="fw-medium">{item.productName}</span>
                            <div className="d-flex gap-3 small text-muted mt-1">
                              <span>x{item.quantity}</span>
                              <span>{item.price.toFixed(2)} บาท</span>
                            </div>
                            <small className="text-muted mt-1">เวลาสั่ง: {formatTime(item.orderTime)}</small>
                          </div>
                        </div>
                        
                        <div className="col-md-5">
                          <div className="d-flex flex-column align-items-end">
                            <span className={`badge rounded-pill ${getStatusClass(item.status || 'A')} mb-2`}>
                              {getStatusLabel(item.status || 'A')}
                            </span>
                            
                            <div className="btn-group">
                              <button 
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleStatusChange(item.orderDetailId, 'C')}
                                disabled={item.status === 'C' || item.status === 'V'}
                              >
                                เสร็จสิ้น
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleStatusChange(item.orderDetailId, 'V')}
                                disabled={item.status === 'C' || item.status === 'V'}
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-top pt-3">
              <div className="text-end fw-bold">
                รวมทั้งหมด: {orderDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} บาท
              </div>
            </div>
          </>
        )}

        {/* Modal สำหรับเลือกเหตุผลการยกเลิก */}
        <Cancelreason
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelWithReason}
          detailId={selectedDetailId}
        />
      </div>
    </div>
  );
};

export default Statusorder;