/** @type {import('next').NextConfig} */

// ที่อยู่ของ backend (Express) ตั้งใน .env.local ได้ ถ้าไม่ตั้งจะใช้เครื่องตัวเอง
const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

const nextConfig = {
  // ส่งต่อ /api และ /uploads ไปที่ backend
  // มือถือลูกค้าที่สแกน QR จะได้ติดต่อแค่ที่อยู่ของหน้าเว็บที่เดียว ไม่ต้องเข้าถึงพอร์ตของ backend โดยตรง
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
