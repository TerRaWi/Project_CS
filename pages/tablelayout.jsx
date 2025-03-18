import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from 'react-bootstrap';
import { getTables, deleteTable } from "../api";
import Addtable from "../components/Addtable";
import Deltable from "../components/Deltable";

const TableLayout = () => {
  const [tables, setTables] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const fetchTables = async () => {
    try {
      const data = await getTables();
      const sortedTables = data.sort(
        (a, b) => parseInt(a.table_number) - parseInt(b.table_number)
      );
      setTables(sortedTables);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleTableAdded = async () => {
    await fetchTables();
    setShowAddModal(false);
  };

  const handleDeleteTable = async (tableNumber) => {
    if (!window.confirm(`ยืนยันการลบโต๊ะเบอร์ ${tableNumber}?`)) {
      return;
    }

    try {
      await deleteTable(tableNumber);
      await fetchTables();
      setIsDeleteMode(false);
    } catch (error) {
      console.error("Error deleting table:", error);
      alert(error.response?.data?.error || "เกิดข้อผิดพลาดในการลบโต๊ะ");
    }
  };

  const getTableStatusClass = (status) => {
    switch (status) {
      case "ว่าง":
        return "table-available";
      case "ไม่ว่าง":
        return "table-occupied";
      default:
        return "";
    }
  };

  return (
    <Container className="py-4 position-relative">
      <h1 className="bg-warning text-white p-2 rounded d-inline-block">จัดการผังโต๊ะ</h1>

      <div className="position-absolute" style={{ right: '110px', top: '20px', zIndex: 1000 }}>
        <Button
          variant="link"
          className="p-0 border-0"
          onClick={() => {
            setShowAddModal(true);
            setIsDeleteMode(false);
          }}
        >
          <img src="/images/+.png" alt="ปุ่มเพิ่มโต๊ะ" width="50" height="50" />
        </Button>
      </div>

      <div className="position-absolute" style={{ right: '30px', top: '20px', zIndex: 1000 }}>
        <Deltable
          tables={tables}
          isDeleteMode={isDeleteMode}
          onTableDelete={fetchTables}
          onDeleteModeToggle={setIsDeleteMode}
        />
      </div>

      <Row className="mt-5 mx-auto" style={{ maxWidth: '1000px' }}>
        {tables.map((table) => (
          <Col xs={6} sm={4} md={3} key={table.table_number} className="mb-4 d-flex justify-content-center">
            <div
              className={`position-relative ${getTableStatusClass(table.status_name)} ${isDeleteMode ? 'delete-mode' : ''}`}
              style={{ width: '120px', height: '120px', cursor: isDeleteMode ? 'pointer' : 'default', margin: '30px' }}
              onClick={() => isDeleteMode && handleDeleteTable(table.table_number)}
            >
              <div className="position-relative w-100 h-100">
                {/* โต๊ะตรงกลาง */}
                <div className="position-absolute top-50 start-50 translate-middle d-flex align-items-center justify-content-center"
                  style={{
                    width: '80px', 
                    height: '80px',
                    border: `2px solid ${isDeleteMode ? '#ff4444' : table.status_name === 'ว่าง' ? '#4CAF50' : '#f44336'}`,
                    borderRadius: '8px',
                    backgroundColor: isDeleteMode ? '#ffebeb' : 'white'
                  }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                    {table.table_number}
                  </span>
                </div>
                
                {/* เก้าอี้บน */}
                <div className="position-absolute start-50 translate-middle-x"
                  style={{ 
                    top: 0,
                    width: '30px', 
                    height: '20px',
                    border: '2px solid #666',
                    borderRadius: '10px',
                    backgroundColor: 'white'
                  }}></div>
                
                {/* เก้าอี้ล่าง */}
                <div className="position-absolute start-50 translate-middle-x"
                  style={{ 
                    bottom: 0,
                    width: '30px', 
                    height: '20px',
                    border: '2px solid #666',
                    borderRadius: '10px',
                    backgroundColor: 'white'
                  }}></div>
                
                {/* เก้าอี้ซ้าย */}
                <div className="position-absolute top-50 translate-middle-y"
                  style={{ 
                    left: 0,
                    width: '20px', 
                    height: '30px',
                    border: '2px solid #666',
                    borderRadius: '10px',
                    backgroundColor: 'white'
                  }}></div>
                
                {/* เก้าอี้ขวา */}
                <div className="position-absolute top-50 translate-middle-y"
                  style={{ 
                    right: 0,
                    width: '20px', 
                    height: '30px',
                    border: '2px solid #666',
                    borderRadius: '10px',
                    backgroundColor: 'white'
                  }}></div>

                {isDeleteMode && (
                  <div className="position-absolute bg-danger text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ 
                      top: '-10px', 
                      right: '-10px',
                      width: '24px', 
                      height: '24px',
                      fontSize: '18px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}>
                    ×
                  </div>
                )}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Addtable
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTableAdded={handleTableAdded}
      />
    </Container>
  );
};

export default TableLayout;