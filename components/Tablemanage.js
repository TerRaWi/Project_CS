import React, { useState, useEffect } from "react";
import { getTables, getOrdersByTable, cancelTable, mergeTable, moveTable } from "../api";
// No need to import CSS module anymore

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
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">จัดการโต๊ะ {table.table_number}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                    </div>

                    <div className="modal-body">
                        <ul className="nav nav-tabs mb-4">
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === "move" ? "active" : ""}`}
                                    onClick={() => handleTabChange("move")}
                                >
                                    {tabIcons.move} ย้ายโต๊ะ
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === "merge" ? "active" : ""}`}
                                    onClick={() => handleTabChange("merge")}
                                >
                                    {tabIcons.merge} รวมโต๊ะ
                                </button>
                            </li>
                            <li className="nav-item">
                                <button 
                                    className={`nav-link ${activeTab === "cancel" ? "active" : ""}`}
                                    onClick={() => handleTabChange("cancel")}
                                >
                                    {tabIcons.cancel} ยกเลิกโต๊ะ
                                </button>
                            </li>
                        </ul>

                        {isLoading && !confirmationOpen ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
                                </div>
                                <p className="mt-2">กำลังโหลดข้อมูล...</p>
                            </div>
                        ) : error ? (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        ) : (
                            <>
                                {activeTab === "move" && (
                                    <div className="mb-4">
                                        <h6 className="border-start border-4 border-primary ps-2 mb-3">เลือกโต๊ะที่ต้องการย้ายไป (โต๊ะว่าง)</h6>
                                        {availableTables.length === 0 ? (
                                            <p>ไม่พบโต๊ะว่าง</p>
                                        ) : (
                                            <div className="row row-cols-2 row-cols-md-4 g-3">
                                                {availableTables.map((t) => (
                                                    <div key={t.id} className="col">
                                                        <div 
                                                            className={`card text-center p-3 h-100 ${selectedTargetTable?.id === t.id ? "bg-primary text-white" : ""}`}
                                                            onClick={() => handleSelectTable(t)}
                                                            style={{ cursor: "pointer", transition: "all 0.2s" }}
                                                        >
                                                            <div className="card-body">
                                                                <p className="card-text mb-0">โต๊ะ {t.table_number}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "merge" && (
                                    <div className="mb-4">
                                        <h6 className="border-start border-4 border-primary ps-2 mb-3">เลือกโต๊ะที่ต้องการรวม (โต๊ะไม่ว่าง)</h6>
                                        {occupiedTables.length === 0 ? (
                                            <p>ไม่พบโต๊ะที่ไม่ว่าง</p>
                                        ) : (
                                            <div className="row row-cols-2 row-cols-md-4 g-3">
                                                {occupiedTables.map((t) => (
                                                    <div key={t.id} className="col">
                                                        <div 
                                                            className={`card text-center p-3 h-100 ${selectedTargetTable?.id === t.id ? "bg-primary text-white" : ""}`}
                                                            onClick={() => handleSelectTable(t)}
                                                            style={{ cursor: "pointer", transition: "all 0.2s" }}
                                                        >
                                                            <div className="card-body">
                                                                <p className="card-text mb-0">โต๊ะ {t.table_number}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "cancel" && (
                                    <div className="mb-4">
                                        <h6 className="border-start border-4 border-primary ps-2 mb-3">ยกเลิกโต๊ะ</h6>
                                        <div className="alert alert-warning">
                                            <p className="mb-0">การยกเลิกโต๊ะจะทำให้รายการอาหารทั้งหมดถูกยกเลิก</p>
                                        </div>
                                    </div>
                                )}

                                {!confirmationOpen ? (
                                    <div className="d-flex justify-content-end gap-2 mt-4">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={onClose}
                                        >
                                            ยกเลิก
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleShowConfirmation}
                                            disabled={(activeTab !== "cancel" && !selectedTargetTable) || isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    กำลังดำเนินการ...
                                                </>
                                            ) : "ดำเนินการต่อ"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="card border-0 bg-light mt-4">
                                        <div className="card-body">
                                            <h5 className="card-title text-primary mb-3">ยืนยันการดำเนินการ</h5>
                                            
                                            <div className="alert alert-info border-start border-4">
                                                <p className="mb-0">เวลาปัจจุบัน: {formatDateTime()}</p>
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
                                            
                                            <div className="d-flex justify-content-end gap-2 mt-3">
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => setConfirmationOpen(false)}
                                                    disabled={isLoading}
                                                >
                                                    ยกเลิก
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleConfirm}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                            กำลังดำเนินการ...
                                                        </>
                                                    ) : "ยืนยัน"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tablemanage;