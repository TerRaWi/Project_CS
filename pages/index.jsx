import React, { useState, useEffect } from 'react';
import { getTables, getAllActiveOrders } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function chunk(array, size) {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
}


const Home = () => {
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newOrders, setNewOrders] = useState([]);
  const [stats, setStats] = useState({
    totalTables: 0,
    occupiedTables: 0,
    availableTables: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalActiveOrders: 0,
    pendingItems: 0
  });

  // ใช้ useEffect เพื่อโหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // ดึงข้อมูลโต๊ะอาหารทั้งหมด
        const tablesData = await getTables();
        setTables(tablesData);

        // ดึงข้อมูลออเดอร์ที่กำลังทำงานอยู่
        const orders = await getAllActiveOrders();
        setActiveOrders(orders);

        // คำนวณจำนวนโต๊ะที่ไม่ว่าง
        const occupiedTables = tablesData.filter(table => table.status_id === 2).length;

        // คำนวณจำนวนรายการอาหารที่รอดำเนินการ
        let pendingItems = 0;
        let totalRevenue = 0;
        let totalCustomers = 0;

        // คำนวณจำนวนรายการที่รอดำเนินการและรายได้ทั้งหมด
        orders.forEach(order => {
          order.items.forEach(item => {
            if (item.status === 'P') {
              pendingItems++;
            }
            totalRevenue += item.price * item.quantity;
          });
        });

        // ค้นหาออเดอร์ใหม่ (ที่สั่งภายใน 5 นาทีล่าสุด)
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        const recentOrders = orders.filter(order => {
          const hasRecentItems = order.items.some(item => {
            const orderTime = new Date(item.orderTime);
            return orderTime > fiveMinutesAgo && item.status === 'P';
          });
          return hasRecentItems;
        });

        setNewOrders(recentOrders);

        // อัพเดท stats
        setStats({
          totalTables: tablesData.length,
          occupiedTables,
          availableTables: tablesData.length - occupiedTables,
          totalCustomers,
          totalRevenue,
          totalActiveOrders: orders.length,
          pendingItems
        });

        setLoading(false);
      } catch (err) {
        setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        setLoading(false);
      }
    };

    fetchData();

    // ตั้งเวลาให้ดึงข้อมูลทุก 30 วินาที
    const interval = setInterval(fetchData, 30000);

    // Clear interval เมื่อ component unmount
    return () => clearInterval(interval);
  }, []);

  // ข้อมูลสำหรับกราฟสถานะโต๊ะ
  const tableStatusData = [
    { name: 'โต๊ะที่ว่าง', value: stats.availableTables },
    { name: 'โต๊ะที่กำลังใช้งาน', value: stats.occupiedTables }
  ];

  // สีสำหรับกราฟ
  const COLORS = ['#4CAF50', '#F44336'];

  // ฟังก์ชันฟอร์แมตเงิน
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading && tables.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
        </div>
        <span className="ms-3">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h1 className="display-5 mb-4">หน้าหลักtest</h1>

      {/* แถวแรก - ข้อมูลสรุป */}
      <div className="row mb-4">
        {/* โต๊ะทั้งหมด */}
        <div className="col-md-4">
          <div className="card shadow-sm bg-light">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">โต๊ะทั้งหมด</h6>
                  <h2 className="mb-0">{stats.totalTables}</h2>
                </div>
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-table text-white" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* โต๊ะที่กำลังใช้งาน */}
        <div className="col-md-4">
          <div className="card shadow-sm bg-danger text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-white-50">โต๊ะที่กำลังใช้งาน</h6>
                  <h2 className="mb-0">{stats.occupiedTables}</h2>
                </div>
                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-person text-danger" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* รายการอาหารที่รอดำเนินการ */}
        <div className="col-md-4">
          <div className="card shadow-sm bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-white-50">รายการที่รอดำเนินการ</h6>
                  <h2 className="mb-0">{stats.pendingItems}</h2>
                </div>
                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-hourglass-split text-info" style={{ fontSize: '24px' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* แถวที่สอง - กราฟและแจ้งเตือน */}
      <div className="row mb-4">
        {/* กราฟสถานะโต๊ะ */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">สถานะโต๊ะ</h5>
            </div>
            <div className="card-body" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart width={400} height={300}>
                  <Pie
                    data={tableStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {tableStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'จำนวนโต๊ะ']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card-footer bg-white">
              <div className="d-flex justify-content-between">
                <div>
                  <span className="badge bg-success me-1">■</span>
                  <span>ว่าง: {stats.availableTables} โต๊ะ</span>
                </div>
                <div>
                  <span className="badge bg-danger me-1">■</span>
                  <span>ไม่ว่าง: {stats.occupiedTables} โต๊ะ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* แจ้งเตือนออเดอร์ใหม่ */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-bell text-warning me-2"></i>
                แจ้งเตือนออเดอร์ใหม่
              </h5>
              <button className="btn btn-sm btn-primary" onClick={() => window.location.href = '/orders'}>
                <i className="bi bi-arrow-right"></i> ไปที่หน้าจัดการออเดอร์
              </button>
            </div>
            <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {newOrders.length === 0 ? (
                <div className="text-center text-muted p-5">
                  <i className="bi bi-check-circle" style={{ fontSize: '2rem' }}></i>
                  <p className="mt-2">ไม่มีออเดอร์ใหม่ในขณะนี้</p>
                </div>
              ) : (
                <div className="list-group">
                  {newOrders.map((order) => {
                    // ค้นหารายการอาหารที่สั่งใหม่
                    const now = new Date();
                    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

                    const newItems = order.items.filter(item => {
                      const orderTime = new Date(item.orderTime);
                      return orderTime > fiveMinutesAgo && item.status === 'P';
                    });

                    return (
                      <div key={order.orderId} className="list-group-item list-group-item-action">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-1">
                            <span className="badge bg-danger me-2">ใหม่</span>
                            โต๊ะ {order.tableNumber}
                          </h6>
                          <small className="text-muted">ออเดอร์ #{order.orderId}</small>
                        </div>
                        <p className="mb-1">
                          <strong>รายการใหม่:</strong> {newItems.length} รายการ
                        </p>
                        <small>
                          {newItems.map((item, index) => (
                            <span key={item.orderDetailId}>
                              {item.productName} x{item.quantity}
                              {index < newItems.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </small>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* แถวที่สาม - รายการโต๊ะ */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">โต๊ะทั้งหมด</h5>
              <button className="btn btn-sm btn-primary" onClick={() => window.location.href = '/tables'}>
                <i className="bi bi-arrow-right"></i> ไปที่หน้าจัดการโต๊ะ
              </button>
            </div>
            <div className="card-body">
              {/* แบ่งโต๊ะออกเป็นชุด ชุดละ 4 โต๊ะ */}
              {chunk(tables, 4).map((tableGroup, groupIndex) => (
                <div key={`group-${groupIndex}`} className="row mb-4">
                  {/* แต่ละชุดแบ่งเป็น 2 หลัก แต่ละหลักมี 2 โต๊ะ */}
                  <div className="col-md-6">
                    {tableGroup.slice(0, 2).map((table) => (
                      <div key={table.id} className="card mb-3">
                        <div className={`card-header ${table.status_id === 2 ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>โต๊ะ {table.table_number}</span>
                            <span className="badge bg-light text-dark">
                              {table.status_id === 2 ? 'ไม่ว่าง' : 'ว่าง'}
                            </span>
                          </div>
                        </div>
                        {table.status_id === 2 && (
                          <div className="card-body p-2">
                            {activeOrders.filter(order => order.tableId === table.id).map(order => (
                              <div key={order.orderId} className="small">
                                <div className="fw-bold">ออเดอร์ #{order.orderId}</div>
                                <div>จำนวนรายการ: {order.items.length}</div>
                                <div>
                                  รายการที่รอ: {order.items.filter(item => item.status === 'P').length}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="col-md-6">
                    {tableGroup.slice(2, 4).map((table) => (
                      table && (
                        <div key={table.id} className="card mb-3">
                          <div className={`card-header ${table.status_id === 2 ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                            <div className="d-flex justify-content-between align-items-center">
                              <span>โต๊ะ {table.table_number}</span>
                              <span className="badge bg-light text-dark">
                                {table.status_id === 2 ? 'ไม่ว่าง' : 'ว่าง'}
                              </span>
                            </div>
                          </div>
                          {table.status_id === 2 && (
                            <div className="card-body p-2">
                              {activeOrders.filter(order => order.tableId === table.id).map(order => (
                                <div key={order.orderId} className="small">
                                  <div className="fw-bold">ออเดอร์ #{order.orderId}</div>
                                  <div>จำนวนรายการ: {order.items.length}</div>
                                  <div>
                                    รายการที่รอ: {order.items.filter(item => item.status === 'P').length}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* แถวที่สี่ - รายได้รวมและข้อมูลสรุปเพิ่มเติม */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">รายได้วันนี้</h5>
            </div>
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <h1 className="display-4 text-success mb-3">
                {formatCurrency(stats.totalRevenue)}
              </h1>
              <p className="text-muted mb-0">จากออเดอร์ที่ยังทำงานอยู่</p>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h5 className="mb-0">ข้อมูลเพิ่มเติม</h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <span><i className="bi bi-clock-history text-primary me-2"></i> เวลาปัจจุบัน</span>
                    <strong>{new Date().toLocaleTimeString('th-TH')}</strong>
                  </div>
                </div>

                <div className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <span><i className="bi bi-percent text-success me-2"></i> อัตราการใช้โต๊ะ</span>
                    <strong>{stats.totalTables > 0 ? ((stats.occupiedTables / stats.totalTables) * 100).toFixed(1) : 0}%</strong>
                  </div>
                </div>

                <div className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <span><i className="bi bi-stopwatch text-warning me-2"></i> ออเดอร์รอดำเนินการ</span>
                    <strong>{stats.pendingItems} รายการ</strong>
                  </div>
                </div>

                <div className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <span><i className="bi bi-bell text-danger me-2"></i> ออเดอร์ใหม่</span>
                    <strong>{newOrders.length} ออเดอร์</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer bg-white text-center">
              <span>อัพเดทล่าสุด: {new Date().toLocaleString('th-TH')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;