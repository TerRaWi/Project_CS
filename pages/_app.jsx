import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

// หน้าสำหรับลูกค้าที่สแกน QR ไม่แสดง Sidebar ของพนักงาน
const CUSTOMER_PAGES = ['/customer/[token]', '/order/[token]'];

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Import Bootstrap JavaScript on the client-side only
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  if (CUSTOMER_PAGES.includes(router.pathname)) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;