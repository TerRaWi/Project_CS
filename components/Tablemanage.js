import React, { useState, useEffect } from "react";
import styles from "../styles/tablemanage.module.css";
import { getTables, getOrdersByTable, cancelTable, mergeTable, moveTable } from "../api";

const Tablemanage = ({ table, onClose, onSuccess, onTableUpdate }) => {
    const [availableTables, setAvailableTables] = useState([]);
    const [occupiedTables, setOccupiedTables] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("move"); // "move", "merge", "cancel"
    const [selectedTargetTable, setSelectedTargetTable] = useState(null);
    const [confirmationOpen, setConfirmationOpen] = useState(false);

    // ดึงข้อมูลโต๊ะทั้งหมด
    useEffect(() => {
        const fetchTables = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const allTables = await getTables();

                // แยกโต๊ะที่ว่างและไม่ว่าง
                const available = [];
                const occupied = [];

                for (const t of allTables) {
                    // ไม่รวมโต๊ะปัจจุบัน
                    if (t.id === table.id) continue;

                    if (t.status_id === 1) { // โต๊ะว่าง
                        available.push(t);
                    } else if (t.status_id === 2) { // โต๊ะไม่ว่าง
                        occupied.push(t);
                    }
                }

                setAvailableTables(available);
                setOccupiedTables(occupied);
            } catch (err) {
                console.error("Error fetching tables:", err);
                setError("ไม่สามารถดึงข้อมูลโต๊ะได้");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTables();
    }, [table]);

    // จัดการเลือกแท็บ
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedTargetTable(null);
        setConfirmationOpen(false);
    };

    // จัดการเลือกโต๊ะเป้าหมาย
    const handleSelectTable = (targetTable) => {
        setSelectedTargetTable(targetTable);
    };

    // แสดงหน้าต่างยืนยัน
    const handleShowConfirmation = () => {
        if (!selectedTargetTable && activeTab !== "cancel") {
            alert("กรุณาเลือกโต๊ะเป้าหมาย");
            return;
        }
        setConfirmationOpen(true);
    };

    // จัดการการยกเลิกโต๊ะ
    const handleCancelTable = async () => {
        try {
            setIsLoading(true);
            const result = await cancelTable(table.id);
            
            // เรียกใช้ onTableUpdate สำหรับอัพเดตข้อมูลโต๊ะทันที
            if (onTableUpdate) {
                onTableUpdate();
            }

            if (onSuccess) {
                onSuccess({
                    action: 'cancel',
                    tableId: table.id,
                    result: result,
                    timestamp: new Date().toISOString() // เพิ่มเวลาปัจจุบัน
                });
            }
            onClose();
        } catch (err) {
            console.error("Error canceling table:", err);
            setError("ไม่สามารถยกเลิกโต๊ะได้");
        } finally {
            setIsLoading(false);
        }
    };

    // จัดการการย้ายโต๊ะ
    const handleMoveTable = async () => {
        try {
            setIsLoading(true);
            const result = await moveTable(table.id, selectedTargetTable.id);
            
            // เรียกใช้ onTableUpdate สำหรับอัพเดตข้อมูลโต๊ะทันที
            if (onTableUpdate) {
                onTableUpdate();
            }

            if (onSuccess) {
                onSuccess({
                    action: 'move',
                    sourceTableId: table.id,
                    targetTableId: selectedTargetTable.id,
                    result: result,
                    timestamp: new Date().toISOString() // เพิ่มเวลาปัจจุบัน
                });
            }
            onClose();
        } catch (err) {
            console.error("Error moving table:", err);
            setError("ไม่สามารถย้ายโต๊ะได้");
        } finally {
            setIsLoading(false);
        }
    };

    // จัดการการรวมโต๊ะ
    const handleMergeTable = async () => {
        try {
            setIsLoading(true);
            const result = await mergeTable(table.id, selectedTargetTable.id);
            
            // เรียกใช้ onTableUpdate สำหรับอัพเดตข้อมูลโต๊ะทันที
            if (onTableUpdate) {
                onTableUpdate();
            }

            if (onSuccess) {
                onSuccess({
                    action: 'merge',
                    sourceTableId: table.id,
                    targetTableId: selectedTargetTable.id,
                    result: result,
                    timestamp: new Date().toISOString() // เพิ่มเวลาปัจจุบัน
                });
            }
            onClose();
        } catch (err) {
            console.error("Error merging tables:", err);
            setError("ไม่สามารถรวมโต๊ะได้");
        } finally {
            setIsLoading(false);
        }
    };

    // จัดการการกดปุ่มยืนยัน
    const handleConfirm = () => {
        switch (activeTab) {
            case "move":
                handleMoveTable();
                break;
            case "merge":
                handleMergeTable();
                break;
            case "cancel":
                handleCancelTable();
                break;
            default:
                break;
        }
    };

    // ฟังก์ชันสำหรับจัดรูปแบบวันที่และเวลา
    const formatDateTime = () => {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        return now.toLocaleDateString('th-TH', options);
    };

    // ไอคอนสำหรับแต่ละแท็บ
    const tabIcons = {
        move: "↗️",
        merge: "🔄",
        cancel: "❌"
    };

    return (
        <div className={styles.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modalContent}>
                <div className={styles.header}>
                    <h2>จัดการโต๊ะ {table.table_number}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabButton} ${activeTab === "move" ? styles.active : ""}`}
                        onClick={() => handleTabChange("move")}
                    >
                        {tabIcons.move} ย้ายโต๊ะ
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === "merge" ? styles.active : ""}`}
                        onClick={() => handleTabChange("merge")}
                    >
                        {tabIcons.merge} รวมโต๊ะ
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === "cancel" ? styles.active : ""}`}
                        onClick={() => handleTabChange("cancel")}
                    >
                        {tabIcons.cancel} ยกเลิกโต๊ะ
                    </button>
                </div>

                {isLoading && !confirmationOpen ? (
                    <div className={styles.loading}>กำลังโหลดข้อมูล...</div>
                ) : error ? (
                    <div className={styles.error}>{error}</div>
                ) : (
                    <>
                        {activeTab === "move" && (
                            <div className={styles.tableList}>
                                <h3>เลือกโต๊ะที่ต้องการย้ายไป (โต๊ะว่าง)</h3>
                                {availableTables.length === 0 ? (
                                    <p>ไม่พบโต๊ะว่าง</p>
                                ) : (
                                    <div className={styles.tables}>
                                        {availableTables.map((t) => (
                                            <div
                                                key={t.id}
                                                className={`${styles.tableItem} ${selectedTargetTable?.id === t.id ? styles.selected : ""}`}
                                                onClick={() => handleSelectTable(t)}
                                            >
                                                โต๊ะ {t.table_number}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "merge" && (
                            <div className={styles.tableList}>
                                <h3>เลือกโต๊ะที่ต้องการรวม (โต๊ะไม่ว่าง)</h3>
                                {occupiedTables.length === 0 ? (
                                    <p>ไม่พบโต๊ะที่ไม่ว่าง</p>
                                ) : (
                                    <div className={styles.tables}>
                                        {occupiedTables.map((t) => (
                                            <div
                                                key={t.id}
                                                className={`${styles.tableItem} ${selectedTargetTable?.id === t.id ? styles.selected : ""}`}
                                                onClick={() => handleSelectTable(t)}
                                            >
                                                โต๊ะ {t.table_number}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "cancel" && (
                            <div className={styles.cancelForm}>
                                <h3>ยกเลิกโต๊ะ</h3>
                                <p>การยกเลิกโต๊ะจะทำให้รายการอาหารทั้งหมดถูกยกเลิก</p>
                            </div>
                        )}

                        {!confirmationOpen ? (
                            <div className={styles.actions}>
                                <button
                                    className={styles.confirmButton}
                                    onClick={handleShowConfirmation}
                                    disabled={(activeTab !== "cancel" && !selectedTargetTable) || isLoading}
                                >
                                    {isLoading ? "กำลังดำเนินการ..." : "ดำเนินการต่อ"}
                                </button>
                                <button
                                    className={styles.cancelButton}
                                    onClick={onClose}
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        ) : (
                            <div className={styles.confirmation}>
                                <h3>ยืนยันการดำเนินการ</h3>
                                <div className={styles.timestamp}>
                                    <p>เวลาปัจจุบัน: {formatDateTime()}</p>
                                </div>
                                {activeTab === "move" && (
                                    <p>ยืนยันการย้ายจากโต๊ะ {table.table_number} ไปยังโต๊ะ {selectedTargetTable.table_number}?</p>
                                )}
                                {activeTab === "merge" && (
                                    <p>ยืนยันการรวมโต๊ะ {table.table_number} กับโต๊ะ {selectedTargetTable.table_number}?</p>
                                )}
                                {activeTab === "cancel" && (
                                    <p>ยืนยันการยกเลิกโต๊ะ {table.table_number}?</p>
                                )}
                                <div className={styles.actions}>
                                    <button
                                        className={`${styles.confirmButton} ${isLoading ? styles.loading : ""}`}
                                        onClick={handleConfirm}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "กำลังดำเนินการ..." : "ยืนยัน"}
                                    </button>
                                    <button
                                        className={styles.cancelButton}
                                        onClick={() => setConfirmationOpen(false)}
                                        disabled={isLoading}
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Tablemanage;