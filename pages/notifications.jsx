//แจ้งเตือน (คำขอบริการจากลูกค้าที่สแกน QR)
import React, { useState, useEffect } from 'react';
import { getServiceRequests, updateServiceRequestStatus } from '../api';
import ServiceRequestStatusBadge from '../components/ServiceRequestStatusBadge';

// ดึงคำขอใหม่ทุก ๆ 5 วินาที
const REFRESH_INTERVAL = 5000;

// จำนวนรายการในประวัติล่าสุด
const HISTORY_LIMIT = 20;

// ไอคอนตามประเภทคำขอ
const SERVICE_ICONS = {
  'เรียกพนักงาน': 'bi-bell-fill text-warning',
  'เติมน้ำซุป/น้ำจิ้ม': 'bi-cup-hot-fill text-danger',
  'ขอช้อนส้อมเพิ่ม': 'bi-tools text-secondary',
  'เรียกชำระเงิน': 'bi-cash-coin text-success'
};

const formatTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// รอมานานเท่าไร เช่น "เมื่อสักครู่", "5 นาทีที่แล้ว"
const formatWaiting = (dateString, now) => {
  const minutes = Math.floor((now - new Date(dateString).getTime()) / 60000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  return `${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาทีที่แล้ว`;
};

const Notifications = () => {
  const [activeRequests, setActiveRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRequests = async () => {
    try {
      const [active, history] = await Promise.all([
        getServiceRequests(['pending', 'in-progress']),
        getServiceRequests(['completed', 'canceled'], HISTORY_LIMIT)
      ]);

      // คำขอที่รอนานที่สุดอยู่บนสุด
      setActiveRequests([...active].sort((a, b) => new Date(a.request_time) - new Date(b.request_time)));
      setHistoryRequests(history);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching service requests:', err);
      setError(err.message || 'ไม่สามารถโหลดคำขอบริการได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (requestId, status) => {
    try {
      setUpdatingId(requestId);
      await updateServiceRequestStatus(requestId, status);
      await fetchRequests();
    } catch (err) {
      console.error('Error updating service request:', err);
      setError(err.message || 'ไม่สามารถอัปเดตสถานะคำขอได้');
    } finally {
      setUpdatingId(null);
    }
  };

  const now = lastUpdated ? lastUpdated.getTime() : Date.now();
  const pendingCount = activeRequests.filter(request => request.status === 'pending').length;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="mb-1">แจ้งเตือน</h1>
          <small className="text-muted">
            คำขอจากลูกค้าที่สแกน QR · อัปเดตอัตโนมัติทุก {REFRESH_INTERVAL / 1000} วินาที
            {lastUpdated && ` · ล่าสุด ${lastUpdated.toLocaleTimeString('th-TH')}`}
          </small>
        </div>
        <button className="btn btn-outline-secondary" onClick={fetchRequests}>
          <i className="bi bi-arrow-clockwise me-1"></i>
          รีเฟรช
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* คำขอที่ยังไม่ปิด */}
      <h5 className="mb-3">
        รอดำเนินการ
        <span className="badge bg-danger ms-2">{pendingCount} รอรับเรื่อง</span>
        <span className="badge bg-primary ms-1">{activeRequests.length - pendingCount} รับเรื่องแล้ว</span>
      </h5>

      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">กำลังโหลด...</span>
          </div>
        </div>
      ) : activeRequests.length === 0 ? (
        <div className="text-center text-muted border rounded bg-light py-5 mb-4">
          <i className="bi bi-check2-circle fs-1"></i>
          <p className="mt-2 mb-0">ไม่มีคำขอที่รอดำเนินการ</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3 mb-4">
          {activeRequests.map(request => (
            <div className="col" key={request.id}>
              <div className={`card h-100 shadow-sm ${request.status === 'pending' ? 'border-warning border-2' : ''}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="text-muted small">โต๊ะ</div>
                      <div className="fs-2 fw-bold lh-1">{request.table_number}</div>
                    </div>
                    <ServiceRequestStatusBadge status={request.status} />
                  </div>
                  <div className="fs-5 mb-1">
                    <i className={`bi ${SERVICE_ICONS[request.service_type] || 'bi-chat-dots'} me-2`}></i>
                    {request.service_type}
                  </div>
                  {request.note && <div className="text-muted text-break mb-1">"{request.note}"</div>}
                  <small className="text-muted">
                    {formatTime(request.request_time)} น. · {formatWaiting(request.request_time, now)}
                  </small>
                </div>
                <div className="card-footer bg-white d-flex gap-2">
                  {request.status === 'pending' && (
                    <button
                      className="btn btn-primary btn-sm flex-grow-1"
                      onClick={() => handleUpdateStatus(request.id, 'in-progress')}
                      disabled={updatingId === request.id}
                    >
                      <i className="bi bi-hand-index me-1"></i>
                      รับเรื่อง
                    </button>
                  )}
                  <button
                    className="btn btn-success btn-sm flex-grow-1"
                    onClick={() => handleUpdateStatus(request.id, 'completed')}
                    disabled={updatingId === request.id}
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    เสร็จแล้ว
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleUpdateStatus(request.id, 'canceled')}
                    disabled={updatingId === request.id}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ประวัติล่าสุด */}
      <h5 className="mb-3">ประวัติล่าสุด</h5>
      {historyRequests.length === 0 ? (
        <p className="text-muted">ยังไม่มีประวัติ</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>โต๊ะ</th>
                <th>คำขอ</th>
                <th>เวลาที่ขอ</th>
                <th>เวลาที่ปิด</th>
                <th className="text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {historyRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.table_number}</td>
                  <td>
                    {request.service_type}
                    {request.note && <small className="text-muted ms-2">"{request.note}"</small>}
                  </td>
                  <td>{formatDateTime(request.request_time)}</td>
                  <td>{formatDateTime(request.complete_time)}</td>
                  <td className="text-center"><ServiceRequestStatusBadge status={request.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Notifications;
