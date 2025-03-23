import React, { useState, useEffect } from 'react';
import BillHistory from '../components/BillHistory';
import {
  getCategories,
  getProduct,
  getAllPayments,
  getBill,
  getTables,
  getCancelReasons
} from '../api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';


// สีที่ใช้ในกราฟ
const COLORS = {
  adult: '#3498db',
  teenChild: '#1abc9c',
  youngChild: '#f1c40f',
  barDefault: '#ff8c42',
  line: '#8884d8',
  category1: '#2ecc71',
  category2: '#e74c3c',
  category3: '#9b59b6',
  category4: '#1abc9c'
};

// จัดรูปแบบตัวเลขเป็นเงินบาท
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

// จัดรูปแบบวันที่
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// คอมโพเนนต์หลักของรายงาน
const Reports = () => {
  // State สำหรับเก็บข้อมูล
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedDateRange, setSelectedDateRange] = useState('week');
  const [reportType, setReportType] = useState('sales');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [showBillHistory, setShowBillHistory] = useState(false); // State เพื่อควบคุมการแสดงประวัติบิล

  // ฟังก์ชันสำหรับตั้งค่าวันที่ตามช่วงเวลาที่เลือก
  // ฟังก์ชันสำหรับตั้งค่าวันที่ตามช่วงเวลาที่เลือก
  const handleDateRangeShortcut = (range) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case 'today':
        startDate = new Date();
        endDate = new Date();
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = new Date(today);
        endDate.setDate(today.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = new Date(today);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = new Date(today);
        break;
      default:
        return;
    }

    // ตั้งค่าเวลาให้ครอบคลุมทั้งวัน
    startDate.setHours(0, 0, 0, 0); // เริ่มต้นวันที่ 00:00:00.000
    endDate.setHours(23, 59, 59, 999); // สิ้นสุดวันที่ 23:59:59.999

    setSelectedDateRange(range);
    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const selectedDate = new Date(value);
    
    // ใช้วันที่ปัจจุบันจริงๆ จากระบบ
    const today = new Date();
    today.setHours(23, 59, 59, 999); // ตั้งเวลาเป็น 23:59:59.999
    
    // ตรวจสอบว่าวันที่ที่เลือกอยู่ในอนาคตหรือไม่
    if (selectedDate > today) {
      // แสดงข้อความแจ้งเตือน
      alert('ไม่สามารถเลือกวันที่ในอนาคตได้');
      return; // ไม่อัปเดตสถานะหากมีการเลือกวันที่ในอนาคต
    }
  
    const updatedDateRange = {
      ...dateRange,
      [name]: value
    };
  
    // ตรวจสอบว่าวันที่สิ้นสุดไม่น้อยกว่าวันที่เริ่มต้น
    if (name === 'end' && new Date(value) < new Date(dateRange.start)) {
      // ถ้าวันสิ้นสุดน้อยกว่าวันเริ่มต้น
      updatedDateRange.end = dateRange.start;
      alert('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น');
    } else if (name === 'start' && new Date(value) > new Date(dateRange.end)) {
      // ถ้าวันเริ่มต้นมากกว่าวันสิ้นสุด
      updatedDateRange.end = value;
    }
  
    setSelectedDateRange('custom');
    setDateRange(updatedDateRange);
  };

  // fetch ข้อมูลเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          productsData,
          categoriesData,
          tablesData,
          paymentsData,
          reasonsData
        ] = await Promise.all([
          getProduct(),
          getCategories(),
          getTables(),
          getAllPayments(),
          getCancelReasons()
        ]);

        setProducts(productsData || []);
        setCategories(categoriesData || []);
        setTables(tablesData || []);
        setPayments(paymentsData || []);

        const orderData = [];
        if (paymentsData && paymentsData.length > 0) {
          for (const payment of paymentsData) {
            try {
              const billData = await getBill(payment.order_id);
              if (billData && billData.items) {
                billData.items.forEach(item => {
                  orderData.push({
                    ...item,
                    paymentDate: payment.payment_date,
                    amount: item.quantity * item.unitPrice,
                    tableNumber: billData.tableNumber
                  });
                });
              }
            } catch (error) {
              console.error(`Error fetching bill data for order ${payment.order_id}:`, error);
            }
          }
        }

        setOrderDetails(orderData);
        setError(null);
      } catch (err) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', err);
        setError('ไม่สามารถดึงข้อมูลสำหรับรายงานได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // กรองข้อมูลตามช่วงเวลาที่เลือก
  const filteredPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date);
    const startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0); // ตั้งเวลาเริ่มต้นเป็น 00:00:00.000
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999); // ตั้งเวลาสิ้นสุดเป็น 23:59:59.999
    return paymentDate >= startDate && paymentDate <= endDate;
  });

  const filteredOrderDetails = orderDetails.filter(item => {
    const itemDate = new Date(item.paymentDate);
    const startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0); // ตั้งเวลาเริ่มต้นเป็น 00:00:00.000
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999); // ตั้งเวลาสิ้นสุดเป็น 23:59:59.999
    return itemDate >= startDate && itemDate <= endDate;
  });

  // คำนวณตัวเลขสำคัญ
  const totalSales = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const customerCount = filteredPayments.length;
  const averagePerBill = customerCount > 0 ? totalSales / customerCount : 0;
  const activeTableCount = tables.filter(table => table.status_id === 2).length;

  // สร้างข้อมูลสำหรับกราฟตามวัน
  const getDailySalesData = () => {
    const salesByDay = {};

    // สร้างรายการวันว่างเปล่าสำหรับทุกวันในช่วงที่เลือก
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      const dateStr = day.toISOString().split('T')[0];
      salesByDay[dateStr] = 0; // เริ่มต้นที่ 0 บาทสำหรับทุกวัน
    }

    // เพิ่มข้อมูลจริงเข้าไป
    filteredPayments.forEach(payment => {
      const date = new Date(payment.payment_date).toISOString().split('T')[0];
      if (!salesByDay[date]) {
        salesByDay[date] = 0;
      }
      salesByDay[date] += Number(payment.amount);
    });

    return Object.keys(salesByDay).map(date => ({
      day: date,
      amount: salesByDay[date]
    })).sort((a, b) => new Date(a.day) - new Date(b.day));
  };

  // สร้างข้อมูลสำหรับกราฟตามช่วงเวลา
  const getTimeSlotSalesData = () => {
    const timeSlots = [
      '10:00-12:00', '12:00-14:00', '14:00-16:00',
      '16:00-18:00', '18:00-20:00', '20:00-22:00'
    ];

    const salesByTime = timeSlots.reduce((acc, slot) => {
      acc[slot] = 0;
      return acc;
    }, {});

    filteredPayments.forEach(payment => {
      const paymentTime = new Date(payment.payment_date).getHours();
      let timeSlot = '';
      if (paymentTime >= 10 && paymentTime < 12) timeSlot = '10:00-12:00';
      else if (paymentTime >= 12 && paymentTime < 14) timeSlot = '12:00-14:00';
      else if (paymentTime >= 14 && paymentTime < 16) timeSlot = '14:00-16:00';
      else if (paymentTime >= 16 && paymentTime < 18) timeSlot = '16:00-18:00';
      else if (paymentTime >= 18 && paymentTime < 20) timeSlot = '18:00-20:00';
      else if (paymentTime >= 20 && paymentTime < 22) timeSlot = '20:00-22:00';

      if (timeSlot && salesByTime[timeSlot] !== undefined) {
        salesByTime[timeSlot] += Number(payment.amount);
      }
    });

    return timeSlots.map(time => ({
      time,
      amount: salesByTime[time]
    }));
  };

  // สร้างข้อมูลสำหรับสินค้าขายดี
  const getTopProductsData = () => {
    const salesByProduct = {};

    // กำหนดรายชื่อสินค้าประเภทลูกค้าที่ต้องการกรองออก
    const customerProductNames = ['ผู้ใหญ่', 'เด็กโต', 'เด็กเล็ก', 'หมูเด้งทะมิส', 'หมูพม่ากุ้ม', 'หมูเด้ง', 'เบคอนสไลด์', 'สันคอสไลด์'];

    filteredOrderDetails.forEach(item => {
      // ข้ามรายการที่เป็นประเภทลูกค้า
      if (customerProductNames.includes(item.productName)) {
        return;
      }

      if (!salesByProduct[item.productName]) {
        salesByProduct[item.productName] = {
          quantity: 0,
          amount: 0
        };
      }
      salesByProduct[item.productName].quantity += item.quantity;
      salesByProduct[item.productName].amount += item.amount;
    });

    return Object.keys(salesByProduct)
      .map(name => ({
        name,
        value: salesByProduct[name].quantity,
        amount: salesByProduct[name].amount
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  // สร้างข้อมูลสำหรับยอดขายตามหมวดหมู่
  const getSalesByCategoryData = () => {
    const productCategoryMap = {};
    products.forEach(product => {
      productCategoryMap[product.name] = product.category_id;
    });

    const salesByCategory = {};
    categories.forEach(category => {
      salesByCategory[category.id] = {
        name: category.name,
        amount: 0
      };
    });

    filteredOrderDetails.forEach(item => {
      const categoryId = productCategoryMap[item.productName];
      if (categoryId && salesByCategory[categoryId]) {
        salesByCategory[categoryId].amount += item.amount;
      }
    });

    return Object.values(salesByCategory)
      .sort((a, b) => b.amount - a.amount);
  };

  // สร้างข้อมูลสำหรับสัดส่วนประเภทลูกค้า
  const getCustomerTypeData = () => {
    const customerTypes = {};

    filteredOrderDetails.forEach(item => {
      if (item.productName === 'ผู้ใหญ่' || item.productName === 'เด็กโต' || item.productName === 'เด็กเล็ก') {
        if (!customerTypes[item.productName]) {
          customerTypes[item.productName] = 0;
        }
        customerTypes[item.productName] += item.quantity;
      }
    });

    const total = Object.values(customerTypes).reduce((sum, count) => sum + count, 0);

    return Object.keys(customerTypes).map(type => ({
      name: type,
      value: Math.round((customerTypes[type] / total) * 100)
    }));
  };

  // สร้างข้อมูลสำหรับจำนวนลูกค้าตามวัน
  const getCustomersByDayData = () => {
    const customersByDay = {};
    const customerProductNames = ['ผู้ใหญ่', 'เด็กโต', 'เด็กเล็ก'];

    filteredOrderDetails.forEach(item => {
      // เลือกเฉพาะรายการที่เป็นประเภทลูกค้า
      if (customerProductNames.includes(item.productName)) {
        const date = new Date(item.paymentDate).toISOString().split('T')[0];

        if (!customersByDay[date]) {
          customersByDay[date] = 0;
        }

        // เพิ่มจำนวนตามจำนวนสินค้า (quantity)
        customersByDay[date] += item.quantity;
      }
    });

    return Object.keys(customersByDay).map(date => ({
      day: date,
      customers: customersByDay[date]
    })).sort((a, b) => new Date(a.day) - new Date(b.day));
  };

  // แสดงสถานะกำลังโหลด
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">กำลังโหลดข้อมูล...</span>
        </div>
        <span className="ms-3">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  // แสดงข้อผิดพลาด
  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  // ข้อมูลสำหรับแสดงผล
  const dailySalesData = getDailySalesData();
  const timeSlotSalesData = getTimeSlotSalesData();
  const topProductsData = getTopProductsData();
  const customerTypeData = getCustomerTypeData();
  const customersByDayData = getCustomersByDayData();
  const salesByCategoryData = getSalesByCategoryData();

  return (
    <div className="container-fluid py-4">
      {/* หัวข้อและตัวเลือกรายงาน */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">รายงานร้านค้า</h3>
            </div>
            <div className="card-body">
              {/* ปุ่มเลือกช่วงเวลา */}
              <div className="mb-4">
                <h5 className="text-muted mb-3">เลือกช่วงเวลา</h5>
                <div className="btn-group">
                  <button
                    className={`btn ${selectedDateRange === 'today' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleDateRangeShortcut('today')}
                  >
                    <i className="bi bi-calendar-day me-1"></i> วันนี้
                  </button>
                  <button
                    className={`btn ${selectedDateRange === 'yesterday' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleDateRangeShortcut('yesterday')}
                  >
                    <i className="bi bi-calendar-minus me-1"></i> เมื่อวาน
                  </button>
                  <button
                    className={`btn ${selectedDateRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleDateRangeShortcut('week')}
                  >
                    <i className="bi bi-calendar-week me-1"></i> 7 วันล่าสุด
                  </button>
                  <button
                    className={`btn ${selectedDateRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleDateRangeShortcut('month')}
                  >
                    <i className="bi bi-calendar-month me-1"></i> 30 วันล่าสุด
                  </button>
                </div>
              </div>

              {/* เลือกวันที่ */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="form-floating mb-3">
                    <input
                      type="date"
                      className="form-control"
                      id="start-date"
                      name="start"
                      value={dateRange.start}
                      onChange={handleDateChange}
                    // ลบบรรทัด max ออก
                    />
                    <label htmlFor="start-date">ตั้งแต่วันที่</label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-floating mb-3">
                    <input
                      type="date"
                      className="form-control"
                      id="end-date"
                      name="end"
                      value={dateRange.end}
                      onChange={handleDateChange}
                    // ลบบรรทัด max ออก
                    />
                    <label htmlFor="end-date">ถึงวันที่</label>
                  </div>
                </div>
              </div>

              {/* ปุ่มเลือกประเภทรายงาน */}
              <div className="mb-3">
                <h5 className="text-muted mb-3">ประเภทรายงาน</h5>
                <div className="nav nav-pills">
                  <button
                    className={`nav-link ${reportType === 'sales' ? 'active' : ''}`}
                    onClick={() => {
                      setReportType('sales');
                      setShowBillHistory(false);
                    }}
                  >
                    <i className="bi bi-cash-coin me-1"></i> ยอดขาย
                  </button>
                  <button
                    className={`nav-link ${reportType === 'products' ? 'active' : ''}`}
                    onClick={() => {
                      setReportType('products');
                      setShowBillHistory(false);
                    }}
                  >
                    <i className="bi bi-box-seam me-1"></i> สินค้าขายดี
                  </button>
                  <button
                    className={`nav-link ${reportType === 'customers' ? 'active' : ''}`}
                    onClick={() => {
                      setReportType('customers');
                      setShowBillHistory(false);
                    }}
                  >
                    <i className="bi bi-people me-1"></i> ลูกค้า
                  </button>
                  <button
                    className={`nav-link ${reportType === 'bills' ? 'active' : ''}`}
                    onClick={() => {
                      setReportType('bills');
                      setShowBillHistory(true);
                    }}
                  >
                    <i className="bi bi-receipt me-1"></i> ประวัติบิล
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* การ์ดสรุปข้อมูลสำคัญ แสดงเฉพาะเมื่อไม่ได้อยู่ในหน้าประวัติบิล */}
      {!showBillHistory && (
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                  <i className="bi bi-cash text-primary fs-3"></i>
                </div>
                <h5 className="card-title">ยอดขายรวม</h5>
                <h2 className="fw-bold text-primary">{totalSales.toFixed(2)}</h2>
                <p className="card-text text-muted">
                  {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center">
                <div className="rounded-circle bg-success bg-opacity-10 p-3 d-inline-flex mb-3">
                  <i className="bi bi-people text-success fs-3"></i>
                </div>
                <h5 className="card-title">จำนวนบิล</h5>
                <h2 className="fw-bold text-success">{customerCount} </h2>
                <p className="card-text text-muted">บิลทั้งหมด</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3 d-inline-flex mb-3">
                  <i className="bi bi-receipt text-warning fs-3"></i>
                </div>
                <h5 className="card-title">เฉลี่ยต่อบิล</h5>
                <h2 className="fw-bold text-warning">{averagePerBill.toFixed(2)}</h2>
                <p className="card-text text-muted">ค่าเฉลี่ยต่อบิล</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body text-center">
                <div className="rounded-circle bg-info bg-opacity-10 p-3 d-inline-flex mb-3">
                  <i className="bi bi-table text-info fs-3"></i>
                </div>
                <h5 className="card-title">โต๊ะที่กำลังใช้งาน</h5>
                <h2 className="fw-bold text-info">{activeTableCount}</h2>
                <p className="card-text text-muted">จากทั้งหมด {tables.length} โต๊ะ</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* แสดงประวัติบิล */}
      {showBillHistory && (
        <BillHistory />
      )}

      {/* แสดงรายงานตามประเภทที่เลือก */}
      {reportType === 'sales' && !showBillHistory && (
        <>
          {/* กราฟยอดขายตามวัน */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-graph-up me-2 text-primary"></i>
                    ยอดขายตามวัน
                  </h5>
                </div>
                <div className="card-body">
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={dailySalesData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          tickFormatter={(value) => formatDate(value)}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${formatCurrency(value)}`, 'ยอดขาย']}
                          labelFormatter={(value) => `วันที่: ${formatDate(value)}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="ยอดขาย"
                          stroke={COLORS.line}
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* กราฟยอดขายตามช่วงเวลาและหมวดหมู่ */}
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-clock me-2 text-success"></i>
                    ยอดขายตามช่วงเวลา
                  </h5>
                </div>
                <div className="card-body">
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={timeSlotSalesData}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${formatCurrency(value)}`, 'ยอดขาย']}
                        />
                        <Legend />
                        <Bar dataKey="amount" name="ยอดขาย" fill="#8a2be2" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-tags me-2 text-danger"></i>
                    ยอดขายตามหมวดหมู่
                  </h5>
                </div>
                <div className="card-body">
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesByCategoryData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={80}
                        />
                        <Tooltip
                          formatter={(value) => [`${formatCurrency(value)}`, 'ยอดขาย']}
                        />
                        <Legend />
                        <Bar dataKey="amount" name="ยอดขาย" fill={COLORS.category1}>
                          {salesByCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[`category${(index % 4) + 1}`]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {reportType === 'products' && !showBillHistory && (
        <>
          {/* สินค้าขายดี */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-trophy me-2 text-warning"></i>
                    สินค้าขายดี
                  </h5>
                </div>
                <div className="card-body">
                  <div style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topProductsData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}`, 'จำนวนที่ขายได้']}
                        />
                        <Legend />
                        <Bar dataKey="value" name="จำนวนที่ขายได้" fill={COLORS.barDefault} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {reportType === 'customers' && !showBillHistory && (
        <>
          {/* สัดส่วนประเภทลูกค้า */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-people-fill me-2 text-info"></i>
                    สัดส่วนประเภทลูกค้า
                  </h5>
                </div>
                <div className="card-body">
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {customerTypeData.map((entry, index) => {
                            let color;
                            if (entry.name === "ผู้ใหญ่") color = COLORS.adult;
                            else if (entry.name === "เด็กโต") color = COLORS.teenChild;
                            else if (entry.name === "เด็กเล็ก") color = COLORS.youngChild;
                            else color = COLORS[`category${(index % 4) + 1}`];

                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${value}%`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* จำนวนลูกค้าตามวัน */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-calendar-check me-2 text-success"></i>
                    จำนวนลูกค้าตามวัน
                  </h5>
                </div>
                <div className="card-body">
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={customersByDayData}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          tickFormatter={(value) => formatDate(value)}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${value} คน`, 'จำนวนลูกค้า']}
                          labelFormatter={(value) => `วันที่: ${formatDate(value)}`}
                        />
                        <Legend />
                        <Bar dataKey="customers" name="จำนวนลูกค้า" fill={COLORS.teenChild} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* การใช้โต๊ะ */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-grid-3x3 me-2 text-warning"></i>
                    สถานะการใช้โต๊ะปัจจุบัน
                  </h5>
                </div>
                <div className="card-body">
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'โต๊ะที่ใช้งานอยู่', value: activeTableCount },
                            { name: 'โต๊ะว่าง', value: tables.length - activeTableCount }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          <Cell fill="#e74c3c" />
                          <Cell fill="#3498db" />
                        </Pie>
                        <Tooltip
                          formatter={(value) => `${value} โต๊ะ`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;