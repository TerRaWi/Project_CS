import React from 'react';
import Head from 'next/head';
import styles from '../styles/category.module.css';
import Managecategory from '../components/Managecategory';

const Category = () => {
    return (
        <div className={styles.container}>
            <Head>
                <title>จัดการหมวดหมู่ - ระบบร้านอาหาร</title>
                <meta name="description" content="จัดการหมวดหมู่สำหรับระบบร้านอาหาร" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className={styles.header}>
                <h1>จัดการหมวดหมู่</h1>
            </div>

            <div className={styles.content}>
                <Managecategory />
            </div>
        </div>
    );
};

export default Category;