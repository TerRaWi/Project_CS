import React, { useState, useEffect } from 'react';
import {
  getCategories,
  getProduct,
  getAllPayments,
  getBill,
  getOrdersByTable,
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
  Line,
  ReferenceLine
} from 'recharts';

// สีที่ใช้ในกราฟ
const COLORS = {
  adult: '#3498db',       // สีฟ้า - ผู้ใหญ่
  teenChild: '#1abc9c',   // สีเขียวมิ้นท์ - เด็กโต
  youngChild: '#f1c40f',  // สีเหลือง - เด็กเล็ก
  barDefault: '#ff8c42',  // สีส้มแดง - แท่งกราฟ
  line: '#8884d8',        // สีม่วงอ่อน - กราฟเส้น
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

  // เพิ่ม state สำหรับเก็บช่วงเวลาที่เลือก
  const [selectedDateRange, setSelectedDateRange] = useState('week'); // 'today', 'yesterday', 'week', 'month', 'custom'

  const [reportType, setReportType] = useState('sales'); // 'sales', 'products', 'customers'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelReasons, setCancelReasons] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);

  // ฟังก์ชันสำหรับตั้งค่าวันที่ตามช่วงเวลาที่เลือก
  const handleDateRangeShortcut = (range) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case 'today':
        // วันนี้
        startDate = new Date();
        endDate = new Date();
        break;
      case 'yesterday':
        // เมื่อวาน
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = new Date(today);
        endDate.setDate(today.getDate() - 1);
        break;
      case 'week':
        // 7 วันย้อนหลัง
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = new Date(today);
        break;
      case 'month':
        // 30 วันย้อนหลัง
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        endDate = new Date(today);
        break;
      default:
        // ไม่ต้องทำอะไร สำหรับ custom range
        return;
    }

    // อัปเดต state
    setSelectedDateRange(range);
    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    });
  };

  // จัดการเมื่อเปลี่ยนช่วงวันที่
  const handleDateChange = (e) => {
    const { name, value } = e.target;

    // เมื่อมีการเปลี่ยนวันที่เอง ให้เปลี่ยนโหมดเป็น custom
    setSelectedDateRange('custom');

    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  // fetch ข้อมูลเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ดึงข้อมูลที่จำเป็นทั้งหมด
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

        // เก็บข้อมูลลงใน state
        setProducts(productsData || []);
        setCategories(categoriesData || []);
        setTables(tablesData || []);
        setPayments(paymentsData || []);
        setCancelReasons(reasonsData || []);

        // ดึงข้อมูล order details จากการผสมข้อมูลจาก payments
        const orderData = [];
        if (paymentsData && paymentsData.length > 0) {
          for (const payment of paymentsData) {
            try {
              // ดึงข้อมูลบิลของแต่ละ order
              const billData = await getBill(payment.order_id);
              if (billData && billData.items) {
                // เพิ่มข้อมูลวันที่ชำระเงินลงในรายการสินค้า
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

  // เฝ้าดูการเปลี่ยนแปลงของ dateRange เพื่อดึงข้อมูลใหม่
  useEffect(() => {
    // ตรงนี้สามารถเพิ่มโค้ดเพื่อดึงข้อมูลใหม่ตามช่วงวันที่ได้ในอนาคต
    console.log("Date range changed:", dateRange);
  }, [dateRange]);

  // กรองข้อมูลตามช่วงเวลาที่เลือก
  const filteredPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59); // ให้เป็นสิ้นสุดของวันที่เลือก

    return paymentDate >= startDate && paymentDate <= endDate;
  });

  const filteredOrderDetails = orderDetails.filter(item => {
    const itemDate = new Date(item.paymentDate);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59);

    return itemDate >= startDate && itemDate <= endDate;
  });

  // คำนวณตัวเลขสำคัญจากข้อมูลจริง
  const totalSales = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const customerCount = filteredPayments.length;
  const averagePerBill = customerCount > 0 ? totalSales / customerCount : 0;
  const activeTableCount = tables.filter(table => table.status_id === 2).length;

  // สร้างข้อมูลสำหรับกราฟตามวัน
  const getDailySalesData = () => {
    const salesByDay = {};

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
    // กำหนดช่วงเวลา
    const timeSlots = [
      '10:00-12:00', '12:00-14:00', '14:00-16:00',
      '16:00-18:00', '18:00-20:00', '20:00-22:00'
    ];

    // สร้าง Object เพื่อเก็บยอดขายแต่ละช่วงเวลา
    const salesByTime = timeSlots.reduce((acc, slot) => {
      acc[slot] = 0;
      return acc;
    }, {});

    // วนลูปข้อมูลการชำระเงินเพื่อคำนวณยอดขายตามช่วงเวลา
    filteredPayments.forEach(payment => {
      const paymentTime = new Date(payment.payment_date).getHours();

      // จับคู่เวลากับช่วงเวลาที่กำหนด
      let timeSlot = '';
      if (paymentTime >= 10 && paymentTime < 12) timeSlot = '10:00-12:00';
      else if (paymentTime >= 12 && paymentTime < 14) timeSlot = '12:00-14:00';
      else if (paymentTime >= 14 && paymentTime < 16) timeSlot = '14:00-16:00';
      else if (paymentTime >= 16 && paymentTime < 18) timeSlot = '16:00-18:00';
      else if (paymentTime >= 18 && paymentTime < 20) timeSlot = '18:00-20:00';
      else if (paymentTime >= 20 && paymentTime < 22) timeSlot = '20:00-22:00';

      // เพิ่มยอดขายถ้าอยู่ในช่วงเวลาที่กำหนด
      if (timeSlot && salesByTime[timeSlot] !== undefined) {
        salesByTime[timeSlot] += Number(payment.amount);
      }
    });

    // แปลงเป็น array เพื่อใช้กับ recharts
    return timeSlots.map(time => ({
      time,
      amount: salesByTime[time]
    }));
  };

  // สร้างข้อมูลสำหรับสินค้าขายดี
  const getTopProductsData = () => {
    // นับจำนวนการขายของแต่ละสินค้า
    const salesByProduct = {};

    filteredOrderDetails.forEach(item => {
      if (!salesByProduct[item.productName]) {
        salesByProduct[item.productName] = {
          quantity: 0,
          amount: 0
        };
      }
      salesByProduct[item.productName].quantity += item.quantity;
      salesByProduct[item.productName].amount += item.amount;
    });

    // แปลงเป็น array และเรียงลำดับตามจำนวนที่ขายได้
    return Object.keys(salesByProduct)
      .map(name => ({
        name,
        value: salesByProduct[name].quantity,
        amount: salesByProduct[name].amount
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // เลือก 10 อันดับแรก
  };

  // สร้างข้อมูลสำหรับสัดส่วนประเภทลูกค้า
  const getCustomerTypeData = () => {
    const customerTypes = {};

    // จำแนกประเภทลูกค้าจากการสั่งซื้อ
    filteredOrderDetails.forEach(item => {
      if (item.productName === 'ผู้ใหญ่' || item.productName === 'เด็กโต' || item.productName === 'เด็กเล็ก') {
        if (!customerTypes[item.productName]) {
          customerTypes[item.productName] = 0;
        }
        customerTypes[item.productName] += item.quantity;
      }
    });

    // คำนวณเปอร์เซ็นต์
    const total = Object.values(customerTypes).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      // ถ้าไม่มีข้อมูล ให้ใช้ค่าเริ่มต้น
      return [
        { name: 'ผู้ใหญ่', value: 60 },
        { name: 'เด็กโต', value: 30 },
        { name: 'เด็กเล็ก', value: 10 }
      ];
    }

    return Object.keys(customerTypes).map(type => ({
      name: type,
      value: Math.round((customerTypes[type] / total) * 100)
    }));
  };

  // สร้างข้อมูลสำหรับจำนวนลูกค้าตามวัน
  const getCustomersByDayData = () => {
    const customersByDay = {};

    filteredPayments.forEach(payment => {
      const date = new Date(payment.payment_date).toISOString().split('T')[0];
      if (!customersByDay[date]) {
        customersByDay[date] = 0;
      }
      customersByDay[date] += 1; // นับจำนวนบิล (ลูกค้า)
    });

    return Object.keys(customersByDay).map(date => ({
      day: date,
      customers: customersByDay[date]
    })).sort((a, b) => new Date(a.day) - new Date(b.day));
  };

  // สร้างข้อมูลสำหรับยอดขายตามหมวดหมู่
  const getSalesByCategoryData = () => {
    // สร้าง map เพื่อเก็บความสัมพันธ์ระหว่างสินค้าและหมวดหมู่
    const productCategoryMap = {};
    products.forEach(product => {
      productCategoryMap[product.name] = product.category_id;
    });

    // คำนวณยอดขายตามหมวดหมู่
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

    // แปลงเป็น array และเรียงลำดับตามยอดขาย
    return Object.values(salesByCategory)
      .sort((a, b) => b.amount - a.amount);
  };

  // ถ้ากำลังโหลดข้อมูล
  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // ถ้าเกิดข้อผิดพลาด
  if (error) {
    return <div className="error">{error}</div>;
  }

  // ข้อมูลสำหรับแสดงผลจากข้อมูลจริง
  const dailySalesData = getDailySalesData();
  const timeSlotSalesData = getTimeSlotSalesData();
  const topProductsData = getTopProductsData();
  const customerTypeData = getCustomerTypeData();
  const customersByDayData = getCustomersByDayData();
  const salesByCategoryData = getSalesByCategoryData();

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>รายงานผลการดำเนินงาน</h1>

        {/* ปุ่มลัดสำหรับเลือกช่วงวันที่ */}
        <div className="date-shortcuts">
          <button
            className={`date-shortcut-btn ${selectedDateRange === 'today' ? 'active' : ''}`}
            onClick={() => handleDateRangeShortcut('today')}
            title="today"
          >
            วันนี้
          </button>
          <button
            className={`date-shortcut-btn ${selectedDateRange === 'yesterday' ? 'active' : ''}`}
            onClick={() => handleDateRangeShortcut('yesterday')}
            title="yesterday"
          >
            เมื่อวาน
          </button>
          <button
            className={`date-shortcut-btn ${selectedDateRange === 'week' ? 'active' : ''}`}
            onClick={() => handleDateRangeShortcut('week')}
            title="week"
          >
            7 วันล่าสุด
          </button>
          <button
            className={`date-shortcut-btn ${selectedDateRange === 'month' ? 'active' : ''}`}
            onClick={() => handleDateRangeShortcut('month')}
            title="month"
          >
            30 วันล่าสุด
          </button>
        </div>

        <div className="date-filter">
          <label>
            ตั้งแต่วันที่:
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
            />
          </label>
          <label>
            ถึงวันที่:
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
            />
          </label>
        </div>

        {/* ปุ่มเลือกประเภทรายงาน */}
        <div className="filter-buttons">
          <button
            className={`filter-button ${reportType === 'sales' ? 'active' : ''}`}
            onClick={() => setReportType('sales')}
          >
            ยอดขาย
          </button>
          <button
            className={`filter-button ${reportType === 'products' ? 'active' : ''}`}
            onClick={() => setReportType('products')}
          >
            สินค้าขายดี
          </button>
          <button
            className={`filter-button ${reportType === 'customers' ? 'active' : ''}`}
            onClick={() => setReportType('customers')}
          >
            ลูกค้า
          </button>
        </div>
      </div>

      {/* การ์ดสรุปข้อมูลสำคัญ */}
      <div className="main-stats">
        <div className="stat-card">
          <h2>ยอดขายรวม</h2>
          <div className="main-stats-value currency-value">{totalSales.toFixed(2)}</div>
          <p>ช่วงวันที่ {formatDate(dateRange.start)} - {formatDate(dateRange.end)}</p>
        </div>

        <div className="stat-card">
          <h2>จำนวนลูกค้า</h2>
          <div className="main-stats-value">{customerCount} คน</div>
          <p>บิลทั้งหมด</p>
        </div>

        <div className="stat-card">
          <h2>เฉลี่ยต่อบิล</h2>
          <div className="main-stats-value currency-value">{averagePerBill.toFixed(2)}</div>
          <p>ค่าเฉลี่ยต่อบิล</p>
        </div>

        <div className="stat-card">
          <h2>จำนวนโต๊ะ</h2>
          <div className="main-stats-value">{tables.length}</div>
          <p>ทั้งหมด ({activeTableCount} โต๊ะกำลังใช้งาน)</p>
        </div>
      </div>

      {/* แสดงรายงานตามประเภทที่เลือก */}
      {reportType === 'sales' && (
        <>
          {/* ส่วนแสดงกราฟยอดขายตามวัน */}
          <div className="chart-container daily-chart">
            <h2>ยอดขายตามวัน</h2>
            <ResponsiveContainer width="100%" height={300}>
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
                  dot={{ r: 5, stroke: COLORS.line, fill: 'white' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ส่วนแสดงกราฟยอดขายตามช่วงเวลา */}
          <div className="chart-container time-chart">
            <h2>ยอดขายตามช่วงเวลา</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={timeSlotSalesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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

          {/* ส่วนแสดงกราฟยอดขายตามหมวดหมู่ */}
          <div className="chart-container category-chart">
            <h2>ยอดขายตามหมวดหมู่</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={salesByCategoryData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 13 }}
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
        </>
      )}

      {reportType === 'products' && (
        <>
          {/* สินค้าขายดี 10 อันดับ */}
          <div className="chart-container top-products-chart">
            <h2>สินค้าขายดี 10 อันดับ</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={topProductsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 13 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}`, 'จำนวนที่ขายได้']}
                />
                <Legend />
                <Bar dataKey="value" name="จำนวนที่ขายได้" fill={COLORS.barDefault} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ส่วนแสดงยอดขายตามหมวดหมู่ (แผนภูมิวงกลม) */}
          <div className="chart-container category-pie-chart">
            <h2>สัดส่วนยอดขายตามหมวดหมู่</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  dataKey="amount"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {salesByCategoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[`category${(index % 4) + 1}`]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {reportType === 'customers' && (
        <>
          {/* สัดส่วนประเภทลูกค้า */}
          <div className="chart-container customer-pie">
            <h2>สัดส่วนประเภทลูกค้า</h2>
            <ResponsiveContainer width="100%" height={300}>
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
                <Legend
                  iconType="square"
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* จำนวนลูกค้าตามวัน */}
          <div className="chart-container customer-by-day-chart">
            <h2>จำนวนลูกค้าตามวัน</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={customersByDayData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
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

          {/* การใช้โต๊ะ */}
          <div className="chart-container table-usage-chart">
            <h2>สถานะการใช้โต๊ะปัจจุบัน</h2>
            <ResponsiveContainer width="100%" height={300}>
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
                  <Cell fill={COLORS.barDefault} />
                  <Cell fill={COLORS.adult} />
                </Pie>
                <Tooltip
                  formatter={(value) => `${value} โต๊ะ`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;