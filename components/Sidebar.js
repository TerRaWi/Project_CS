// Sidebar หน้าต่างหลักด้านซ้าย
import Link from 'next/link';
import { FaHome, FaClipboardList, FaBell, FaChartLine, FaCog } from 'react-icons/fa';
import { MdOutlineTableRestaurant } from "react-icons/md";
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        .custom-sidebar {
          width: 150px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          font-size: 15px;
          background-color: #f39c12;
          padding: 20px 15px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          border-right: none;
          box-shadow: none;
          /* เพิ่ม z-index เพื่อให้แน่ใจว่า sidebar อยู่ด้านบนของเนื้อหาอื่น */
          z-index: 1000;
          /* ลบ border ทั้งหมดที่อาจทำให้เกิดเส้นขอบสีเทา */
          border: 0;
          outline: none;
        }
        
        .custom-sidebar a {
          color: #ecf0f1;
          text-decoration: none;
          margin: 10px 0;
          display: flex;
          align-items: center;
        }
        
        .custom-sidebar a:hover {
          color: #e67e22;
        }
        
        .custom-sidebar a svg {
          margin-right: 20px;
        }
        
        /* เพิ่ม CSS เพื่อแก้ไขปัญหา margin ที่อาจทำให้เกิดพื้นที่เกิน */
        .custom-sidebar:before,
        .custom-sidebar:after {
          display: none;
          content: none;
        }
        
        /* เพิ่ม CSS เพื่อรีเซ็ตค่า Bootstrap ที่อาจมีผลกระทบ */
        .row, .container-fluid, .col {
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="custom-sidebar">
        <Link href="/" legacyBehavior>
          <a>
            <FaHome /> หน้าหลัก
          </a>
        </Link>
        <Link href="/tables" legacyBehavior>
          <a>
            <MdOutlineTableRestaurant /> โต๊ะ
          </a>
        </Link>
        <Link href="/orders" legacyBehavior>
          <a>
            <FaClipboardList /> ออร์เดอร์
          </a>
        </Link>
        <Link href="/notifications" legacyBehavior>
          <a>
            <FaBell /> แจ้งเตือน
          </a>
        </Link>
        <Link href="/reports" legacyBehavior>
          <a>
            <FaChartLine /> รายงาน
          </a>
        </Link>
        <Link href="/settings" legacyBehavior>
          <a>
            <FaCog /> ตั้งค่า
          </a>
        </Link>
      </div>
    </>
  );
};

export default Sidebar;