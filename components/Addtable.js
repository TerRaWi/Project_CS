import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { addTable } from '../api';

const Addtable = ({ show = true, onClose, onTableAdded }) => {
  const [tableNumber, setTableNumber] = useState('');
  const [error, setError] = useState(null);

  const handleNumberChange = (e) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= 50)) {
      setTableNumber(value);
    }
  };

  const handleSubmit = async () => {
    if (!tableNumber) {
      setError('กรุณาระบุเบอร์โต๊ะ');
      return;
    }

    try {
      const result = await addTable(tableNumber);
      alert(`เพิ่มโต๊ะเบอร์: ${tableNumber} สำเร็จ`);
      if (onTableAdded) {
        onTableAdded(result);
      }
      onClose();
    } catch (error) {
      console.error('Error adding table:', error);
      if (error.response?.status === 409) {
        setError('เบอร์โต๊ะนี้มีอยู่แล้ว');
      } else {
        setError('เกิดข้อผิดพลาดในการเพิ่มโต๊ะ');
      }
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>เพิ่มโต๊ะใหม่</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>เบอร์โต๊ะ</Form.Label>
            <Form.Control
              type="number"
              value={tableNumber}
              onChange={handleNumberChange}
              placeholder="เบอร์โต๊ะ"
              min="1"
              max="50"
            />
          </Form.Group>
          {error && <Alert variant="danger">{error}</Alert>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button variant="success" onClick={handleSubmit}>
          ตกลง
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Addtable;