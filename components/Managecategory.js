import React, { useState, useEffect } from 'react';
import styles from '../styles/ManageCategory.module.css';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../api';

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
        return <div className={styles.loading}>กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className={styles.container}>
            {/* แสดงข้อความเตือน */}
            {error && <div className={styles.error}>{error}</div>}

            {/* ฟอร์มเพิ่มหมวดหมู่ใหม่ */}
            <div className={styles.addCategoryForm}>
                <h2>เพิ่มหมวดหมู่ใหม่</h2>
                <form onSubmit={handleAddCategory}>
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="ชื่อหมวดหมู่"
                        className={styles.input}
                        required
                    />
                    <button type="submit" className={styles.addButton} disabled={isLoading}>
                        {isLoading ? 'กำลังเพิ่ม...' : 'เพิ่มหมวดหมู่'}
                    </button>
                </form>
            </div>

            {/* ตารางแสดงหมวดหมู่ */}
            <div className={styles.categoriesTable}>
                <h2>รายการหมวดหมู่ทั้งหมด</h2>
                {categories.length === 0 ? (
                    <p>ไม่พบหมวดหมู่</p>
                ) : (
                    <table>
                        <thead>
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
                                                className={styles.editInput}
                                                autoFocus
                                            />
                                        ) : (
                                            category.name
                                        )}
                                    </td>
                                    <td>
                                        {editingCategoryId === category.id ? (
                                            <div className={styles.editActions}>
                                                <button
                                                    onClick={handleUpdateCategory}
                                                    className={styles.saveButton}
                                                    disabled={isLoading}
                                                >
                                                    บันทึก
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className={styles.cancelButton}
                                                >
                                                    ยกเลิก
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={styles.actions}>
                                                <button
                                                    onClick={() => startEditing(category)}
                                                    className={styles.editButton}
                                                >
                                                    แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(category.id)}
                                                    className={styles.deleteButton}
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
                )}
            </div>

            {/* Modal ยืนยันการลบ */}
            {showDeleteModal && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal}>
                        <h2>ยืนยันการลบ</h2>
                        <p>คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?</p>
                        <p className={styles.warning}>
                            คำเตือน: การลบหมวดหมู่อาจส่งผลต่อสินค้าที่ใช้หมวดหมู่นี้อยู่
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                onClick={handleDeleteCategory}
                                className={styles.confirmDeleteButton}
                                disabled={isLoading}
                            >
                                {isLoading ? 'กำลังลบ...' : 'ยืนยันการลบ'}
                            </button>
                            <button
                                onClick={cancelDelete}
                                className={styles.cancelDeleteButton}
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Managecategory;