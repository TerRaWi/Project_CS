// Sidebar หน้าต่างหลักด้านซ้าย
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaHome, FaClipboardList, FaBell, FaChartLine, FaCog } from 'react-icons/fa';
import { MdOutlineTableRestaurant } from "react-icons/md";
import 'bootstrap/dist/css/bootstrap.min.css';
import { getServiceRequests } from '../api';

// ตรวจคำขอบริการใหม่จากลูกค้าทุก ๆ 5 วินาที
const SERVICE_REQUEST_CHECK_INTERVAL = 5000;

// เสียงเตือนสั้น ๆ เมื่อมีคำขอใหม่ (เบราว์เซอร์อาจไม่ให้เล่นเสียงจนกว่าจะคลิกหน้าเว็บสักครั้ง)
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.2;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.3);
    oscillator.onended = () => context.close();
  } catch (err) {
    console.error('ไม่สามารถเล่นเสียงแจ้งเตือนได้:', err);
  }
};

const Sidebar = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const previousCountRef = useRef(null);

  useEffect(() => {
    const checkServiceRequests = async () => {
      try {
        const requests = await getServiceRequests(['pending']);
        const count = requests.length;

        // มีคำขอใหม่เพิ่มขึ้นจากรอบก่อน (ไม่เล่นเสียงตอนเปิดหน้าครั้งแรก)
        if (previousCountRef.current !== null && count > previousCountRef.current) {
          playNotificationSound();
        }

        previousCountRef.current = count;
        setPendingCount(count);
      } catch (err) {
        console.error('Error checking service requests:', err);
      }
    };

    checkServiceRequests();
    const interval = setInterval(checkServiceRequests, SERVICE_REQUEST_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

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
            {/* จำนวนคำขอที่รอรับเรื่อง แสดงที่มุมไอคอนกระดิ่ง */}
            <span className="position-relative d-inline-flex">
              <FaBell />
              {pendingCount > 0 && (
                <span
                  className="position-absolute badge rounded-pill bg-danger"
                  style={{ top: '-9px', left: '8px', fontSize: '0.6rem' }}
                >
                  {pendingCount}
                </span>
              )}
            </span>
            แจ้งเตือน
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