import React, { useState, useEffect } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../api';
// ไม่จำเป็นต้องนำเข้า CSS Module อีกต่อไป
// import styles from '../styles/ManageCategory.module.css';

// หมายเหตุ: ต้องตรวจสอบให้แน่ใจว่าได้ติดตั้ง Bootstrap ใน project ของคุณแล้ว
// คุณสามารถติดตั้งได้โดยใช้: npm install bootstrap
// และนำเข้าในไฟล์หลักของคุณ: import 'bootstrap/dist/css/bootstrap.min.css';

const Managecategory = () => {
    // States สำหรับเก็บข้อมูลและการทำงาน
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // States สำหรับการเพิ่มหมวดหมู่ใหม่
    const [newCategoryName, setNewCategoryName] = useState('');

    // States สำหรับการแก้ไขหมวดหมู่
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');

    // State สำหรับการเปิด/ปิด modal การยืนยันลบ
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCategoryId, setDeletingCategoryId] = useState(null);

    // ดึงข้อมูลหมวดหมู่ทั้งหมด
    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const data = await getCategories();
            setCategories(data);
            setError(null);
        } catch (err) {
            setError('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้: ' + err.message);
            console.error('Error fetching categories:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // โหลดข้อมูลเมื่อ component ถูกโหลด
    useEffect(() => {
        fetchCategories();
    }, []);

    // เพิ่มหมวดหมู่ใหม่
    const handleAddCategory = async (e) => {
        e.preventDefault();

        if (!newCategoryName.trim()) {
            alert('กรุณากรอกชื่อหมวดหมู่');
            return;
        }

        try {
            setIsLoading(true);
            await addCategory(newCategoryName);
            setNewCategoryName('');
            fetchCategories();
        } catch (err) {
            setError('ไม่สามารถเพิ่มหมวดหมู่ได้: ' + err.message);
            console.error('Error adding category:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // เริ่มการแก้ไขหมวดหมู่
    const startEditing = (category) => {
        setEditingCategoryId(category.id);
        setEditCategoryName(category.name);
    };

    // ยกเลิกการแก้ไข
    const cancelEditing = () => {
        setEditingCategoryId(null);
        setEditCategoryName('');
    };

    // บันทึกการแก้ไขหมวดหมู่
    const handleUpdateCategory = async (e) => {
        e.preventDefault();

        if (!editCategoryName.trim()) {
            alert('กรุณากรอกชื่อหมวดหมู่');
            return;
        }

        try {
            setIsLoading(true);
            await updateCategory(editingCategoryId, editCategoryName);
            setEditingCategoryId(null);
            fetchCategories();
        } catch (err) {
            setError('ไม่สามารถแก้ไขหมวดหมู่ได้: ' + err.message);
            console.error('Error updating category:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // เริ่มกระบวนการลบหมวดหมู่
    const confirmDelete = (categoryId) => {
        setDeletingCategoryId(categoryId);
        setShowDeleteModal(true);
    };

    // ยกเลิกการลบ
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeletingCategoryId(null);
    };

    // ทำการลบหมวดหมู่
    const handleDeleteCategory = async () => {
        try {
            setIsLoading(true);
            await deleteCategory(deletingCategoryId);
            setShowDeleteModal(false);
            fetchCategories();
        } catch (err) {
            setError('ไม่สามารถลบหมวดหมู่ได้: ' + err.message);
            console.error('Error deleting category:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // แสดงข้อความกำลังโหลด
    if (isLoading && categories.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center p-4">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
                </div>
                <span className="ms-2">กำลังโหลดข้อมูล...</span>
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* แสดงข้อความเตือน */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* ฟอร์มเพิ่มหมวดหมู่ใหม่ */}
            <div className="card mb-4 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title mb-3">เพิ่มหมวดหมู่ใหม่</h2>
                    <form onSubmit={handleAddCategory} className="row g-3">
                        <div className="col-md-8">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="ชื่อหมวดหมู่"
                                className="form-control"
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <button type="submit" className="btn btn-success w-100" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        <span className="ms-2">กำลังเพิ่ม...</span>
                                    </>
                                ) : (
                                    'เพิ่มหมวดหมู่'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ตารางแสดงหมวดหมู่ */}
            <div className="card shadow-sm">
                <div className="card-body">
                    <h2 className="card-title mb-3">รายการหมวดหมู่ทั้งหมด</h2>
                    {categories.length === 0 ? (
                        <p className="text-muted">ไม่พบหมวดหมู่</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>ชื่อหมวดหมู่</th>
                                        <th>การจัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category) => (
                                        <tr key={category.id}>
                                            <td>
                                                {editingCategoryId === category.id ? (
                                                    <input
                                                        type="text"
                                                        value={editCategoryName}
                                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                                        className="form-control"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    category.name
                                                )}
                                            </td>
                                            <td>
                                                {editingCategoryId === category.id ? (
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            onClick={handleUpdateCategory}
                                                            className="btn btn-success btn-sm"
                                                            disabled={isLoading}
                                                        >
                                                            {isLoading ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                                    <span className="ms-1">บันทึก</span>
                                                                </>
                                                            ) : (
                                                                'บันทึก'
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            ยกเลิก
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            onClick={() => startEditing(category)}
                                                            className="btn btn-primary btn-sm"
                                                        >
                                                            แก้ไข
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(category.id)}
                                                            className="btn btn-danger btn-sm"
                                                        >
                                                            ลบ
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal ยืนยันการลบ - ใช้ Bootstrap Modal */}
            {showDeleteModal && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">ยืนยันการลบ</h5>
                                    <button type="button" className="btn-close" onClick={cancelDelete} aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <p>คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?</p>
                                    <p className="text-danger fw-bold">
                                        คำเตือน: การลบหมวดหมู่อาจส่งผลต่อสินค้าที่ใช้หมวดหมู่นี้อยู่
                                    </p>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        onClick={handleDeleteCategory}
                                        className="btn btn-danger"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                <span className="ms-1">กำลังลบ...</span>
                                            </>
                                        ) : (
                                            'ยืนยันการลบ'
                                        )}
                                    </button>
                                    <button
                                        onClick={cancelDelete}
                                        className="btn btn-secondary"
                                    >
                                        ยกเลิก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Managecategory;  