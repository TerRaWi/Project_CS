import Sidebar from './Sidebar';
import styles from '../styles/Layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        {children} 
      </main>
    </div>
  );
};

export default Layout;
// 7 import Sidebar มาใส่
//9 หน้าของ Page นั้นๆ