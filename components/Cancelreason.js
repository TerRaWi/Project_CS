import React, { useState, useEffect } from 'react';
import styles from '../styles/cancelreason.module.css';
import { getCancelReasons } from '../api';

const Cancelreason = ({ isOpen, onClose, onConfirm, detailId }) => {
    const [reasons, setReasons] = useState([]);
    const [selectedReason, setSelectedReason] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // ถ้า modal เปิดอยู่ ให้โหลดข้อมูลเหตุผลการยกเลิก
        if (isOpen) {
            fetchCancelReasons();
        }
    }, [isOpen]);

    const fetchCancelReasons = async () => {
        try {
            setLoading(true);
            const data = await getCancelReasons();
            setReasons(data);
            // ตั้งค่าเหตุผลแรกเป็นค่าเริ่มต้น
            if (data.length > 0) {
                setSelectedReason(data[0].id);
            }
        } catch (err) {
            setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลเหตุผลการยกเลิก');
        } finally {
            setLoading(false);
        }
    };

    const handleReasonChange = (e) => {
        setSelectedReason(Number(e.target.value));
    };

    const handleCancel = () => {
        setSelectedReason(null);
        onClose();
    };

    const handleConfirm = () => {
        if (selectedReason) {
            onConfirm(detailId, 'V', selectedReason);
        }
    };

    // เพิ่มเอฟเฟกต์ fade-in เมื่อเปิด modal
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    // เมื่อกดคลิกที่พื้นที่ภายนอก modal ให้ปิด
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // ถ้า modal ไม่ได้เปิดอยู่ ไม่ต้องแสดงอะไร
    if (!isOpen) return null;

    return (
        <div
            className={styles.modalOverlay}
            onClick={handleOverlayClick}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            role="dialog"
        >
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>เลือกเหตุผลการยกเลิก</h3>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="ปิด"
                    >
                        ×
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.loading}>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{
                                    animation: 'spin 1s linear infinite',
                                    marginRight: '8px'
                                }}
                            >
                                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="#ccc"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray="30 10"
                                />
                            </svg>
                            กำลังโหลดข้อมูล...
                        </div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : (
                        <div className={styles.reasonsList}>
                            {reasons.map((reason) => (
                                <div
                                    key={reason.id}
                                    className={`${styles.reasonItem} ${selectedReason === reason.id ? styles.selected : ''}`}
                                    onClick={() => setSelectedReason(reason.id)}
                                >
                                    <input
                                        type="radio"
                                        id={`reason-${reason.id}`}
                                        name="cancelReason"
                                        value={reason.id}
                                        checked={selectedReason === reason.id}
                                        onChange={handleReasonChange}
                                    />
                                    <label htmlFor={`reason-${reason.id}`}>
                                        {reason.name}
                                        {reason.description && (
                                            <span className={styles.reasonDescription}>
                                                ({reason.description})
                                            </span>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.cancelButton}
                        onClick={handleCancel}
                    >
                        ยกเลิก
                    </button>
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={!selectedReason || loading}
                    >
                        ยืนยันการยกเลิกรายการ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cancelreason;