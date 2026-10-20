import React from 'react';

// ป้ายสถานะของคำขอบริการ (ใช้ทั้งหน้าลูกค้าและหน้าแจ้งเตือนของพนักงาน)
export const SERVICE_REQUEST_STATUS = {
    pending: { label: 'รอพนักงานรับเรื่อง', className: 'bg-warning text-dark' },
    'in-progress': { label: 'พนักงานรับเรื่องแล้ว', className: 'bg-primary' },
    completed: { label: 'เสร็จแล้ว', className: 'bg-success' },
    canceled: { label: 'ยกเลิก', className: 'bg-secondary' }
};

const ServiceRequestStatusBadge = ({ status }) => {
    const info = SERVICE_REQUEST_STATUS[status] || { label: status, className: 'bg-secondary' };
    return <span className={`badge ${info.className}`}>{info.label}</span>;
};

export default ServiceRequestStatusBadge;
