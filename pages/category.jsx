import React from 'react';
import Head from 'next/head';
import Managecategory from '../components/Managecategory';

const Category = () => {
    return (
        <div className="container py-4">
            <Head>
                <title>จัดการหมวดหมู่ - ระบบร้านอาหาร</title>
                <meta name="description" content="จัดการหมวดหมู่สำหรับระบบร้านอาหาร" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="row mb-4">
                <div className="col">
                    <h1 className="text-center">จัดการหมวดหมู่</h1>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <Managecategory />
                </div>
            </div>
        </div>
    );
};

export default Category;