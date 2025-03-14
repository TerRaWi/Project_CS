import Sidebar from './Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';

const Layout = ({ children }) => {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-3 col-lg-2 d-md-block bg-light sidebar">
          <Sidebar />
        </div>
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
// Sidebar อยู่ทางซ้าย
// หน้าของ Page นั้นๆ อยู่ทางขวา