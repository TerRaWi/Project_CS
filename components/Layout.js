import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';

const Layout = ({ children }) => {
  return (
    <>
      {/* เพิ่ม global style ที่นี่เพื่อแก้ปัญหาขอบสีเทา */}
      <style jsx global>{`
        body, html {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        /* ลบขอบและ padding ของ container-fluid */
        .container-fluid {
          padding-left: 0;
          padding-right: 0;
          margin-left: 0;
          margin-right: 0;
          overflow-x: hidden;
        }
        
        /* ลบ margin ของ row */
        .row {
          margin-left: 0;
          margin-right: 0;
        }
        
        /* ลบ padding ของคอลัมน์ */
        [class*="col-"] {
          padding-left: 0;
          padding-right: 0;
        }
        
        /* เพิ่มเพื่อแก้ปัญหาความสูงของ sidebar */
        .sidebar-column {
          padding: 0;
          margin: 0;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          width: 150px; /* กำหนดความกว้างที่ตรงกับ Sidebar.js */
          z-index: 1030;
        }
        
        /* ปรับ main content ให้เข้ากับ sidebar */
        .main-content {
          margin-left: 150px; /* ให้ตรงกับความกว้างของ sidebar */
          padding: 20px;
          width: calc(100% - 150px);
        }
      `}</style>

      {/* แก้ไขโครงสร้าง layout */}
      <div className="sidebar-column">
        <Sidebar />
      </div>
      
      <main className="main-content">
        {children}
      </main>
    </>
  );
};

export default Layout;