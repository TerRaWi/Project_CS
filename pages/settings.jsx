// ตั้งค่า
import React from 'react';
import Link from 'next/link';
// เพิ่ม import bootstrap CSS (คุณอาจต้องติดตั้ง Bootstrap ก่อนด้วย npm install bootstrap)
// import 'bootstrap/dist/css/bootstrap.min.css';

const Setting = () => {
  return (
    <div className="container mt-4">
      <h1 className="mb-4">ตั้งค่า</h1>
      <div className="d-flex flex-wrap gap-3">
        <Link href="/tablelayout" className="btn btn-warning text-white">
          จัดการผังโต๊ะ
        </Link>
        <Link href="/product" className="btn btn-warning text-white">
          จัดการเมนู
        </Link>
        <Link href="/category" className="btn btn-warning text-white">
          จัดการหมวดหมู่
        </Link>
      </div>
    </div>
  );
};

export default Setting;