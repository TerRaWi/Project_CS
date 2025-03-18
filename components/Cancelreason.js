import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { getCancelReasons } from '../api';

const Cancelreason = ({ isOpen, onClose, onConfirm, detailId }) => {
    const [reasons, setReasons] = useState([]);
    const [selectedReason, setSelectedReason] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // เมื่อ modal เปิด ให้โหลดข้อมูลเหตุผลการยกเลิก
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

    return (
        <Modal 
            show={isOpen} 
            onHide={onClose}
            centered
            backdrop="static"
            animation={true}
        >
            <Modal.Header closeButton>
                <Modal.Title>เลือกเหตุผลการยกเลิก</Modal.Title>
            </Modal.Header>

            <Modal.Body className="py-4">
                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="secondary" className="me-2" />
                        <span>กำลังโหลดข้อมูล...</span>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                ) : (
                    <Form>
                        {reasons.map((reason) => (
                            <div 
                                key={reason.id} 
                                className="mb-3 p-3 border rounded"
                                style={{ 
                                    cursor: 'pointer',
                                    backgroundColor: selectedReason === reason.id ? '#ffebee' : '',
                                    borderColor: selectedReason === reason.id ? '#e53935' : '#dee2e6'
                                }}
                                onClick={() => setSelectedReason(reason.id)}
                            >
                                <Form.Check
                                    type="radio"
                                    id={`reason-${reason.id}`}
                                    name="cancelReason"
                                    value={reason.id}
                                    checked={selectedReason === reason.id}
                                    onChange={handleReasonChange}
                                    label={
                                        <>
                                            {reason.name}
                                            {reason.description && (
                                                <small className="d-block text-muted mt-1">
                                                    ({reason.description})
                                                </small>
                                            )}
                                        </>
                                    }
                                />
                            </div>
                        ))}
                    </Form>
                )}
            </Modal.Body>

            <Modal.Footer className="bg-light">
                <Button 
                    variant="light" 
                    onClick={handleCancel}
                    className="border"
                >
                    ยกเลิก
                </Button>
                <Button 
                    variant="danger" 
                    onClick={handleConfirm}
                    disabled={!selectedReason || loading}
                >
                    ยืนยันการยกเลิกรายการ
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default Cancelreason;