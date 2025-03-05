import React, { useState, useEffect } from "react";
import styles from "../styles/tablelayout.module.css";
import { getTables, deleteTable } from "../api";
import Addtable from "../components/Addtable";
import Deltable from "../components/Deltable";

const TableLayout = () => {
  const [tables, setTables] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
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
    setShowAddCard(false);
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
        return styles.tableAvailable;
      case "ไม่ว่าง":
        return styles.tableOccupied;
      default:
        return "";
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles["heading-background"]}>จัดการผังโต๊ะ</h1>

      <div className={styles["button-container"]}>
        <button
          onClick={() => {
            setShowAddCard(true);
            setIsDeleteMode(false);
          }}
          className={styles.imageadd}
        >
          <img src="/images/+.png" alt="ปุ่มเพิ่มโต๊ะ" />
        </button>

        <Deltable
          tables={tables}
          isDeleteMode={isDeleteMode}
          onTableDelete={fetchTables}
          onDeleteModeToggle={setIsDeleteMode}
        />
      </div>

      <div className={styles.tableGrid}>
        {tables.map((table) => (
          <div
            key={table.table_number}
            className={`${styles.table} ${getTableStatusClass(
              table.status_name
            )} ${isDeleteMode ? styles.deleteMode : ""}`}
            onClick={() =>
              isDeleteMode && handleDeleteTable(table.table_number)
            }
          >
            <div className={styles.tableContent}>
              <div className={styles.tableDrawing}>
                {/* โต๊ะตรงกลาง */}
                <div className={styles.tableCenter}>
                  <span className={styles.tableNumber}>
                    {table.table_number}
                  </span>
                </div>
                {/* เก้าอี้ทั้ง 4 ด้าน */}
                <div className={styles.chairTop}></div>
                <div className={styles.chairBottom}></div>
                <div className={styles.chairLeft}></div>
                <div className={styles.chairRight}></div>
              </div>
            </div>
            {isDeleteMode && <div className={styles.deleteIcon}>×</div>}
          </div>
        ))}
      </div>

      {showAddCard && (
        <Addtable
          onClose={() => setShowAddCard(false)}
          onTableAdded={handleTableAdded}
        />
      )}
    </div>
  );
};

export default TableLayout;
