import React from 'react';
import Link from 'next/link';
import styles from '../styles/settings.module.css';


const Setting = () => {
  return (
    <div>
      <h1>ตั้งค่า</h1>
      <Link href="/tablelayout" className={styles['manage-tables-button']}>
        จัดการผังโต๊ะ
      </Link>
      <Link href="/product" className={styles['manage-menu-button']}>
      จัดการเมนู
      </Link>
    </div>
  );
};

export default Setting;
