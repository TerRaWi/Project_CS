import Link from 'next/link';
import { FaHome, FaClipboardList, FaBell, FaChartLine, FaCog } from 'react-icons/fa';
import { MdOutlineTableRestaurant } from "react-icons/md";
import styles from '../styles/Sidebar.module.css';

const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      <Link href="/" legacyBehavior><a><FaHome /> หน้าหลัก</a></Link>
      <Link href="/tables" legacyBehavior><a><MdOutlineTableRestaurant /> โต๊ะ</a></Link>
      <Link href="/orders" legacyBehavior><a><FaClipboardList /> ออร์เดอร์</a></Link>
      <Link href="/notifications" legacyBehavior><a><FaBell /> แจ้งเตือน</a></Link>
      <Link href="/reports" legacyBehavior><a><FaChartLine /> รายงาน</a></Link>
      <Link href="/settings" legacyBehavior><a><FaCog /> ตั้งค่า</a></Link>
    </div>
  );
};

export default Sidebar;
