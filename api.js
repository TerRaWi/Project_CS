import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

/**
 * การจัดการข้อผิดพลาด
 */
const handleApiError = (error, customMessage = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ') => {
  let errorMessage = customMessage;

  if (axios.isAxiosError(error)) {
    if (error.response) {
      // กรณีเซิร์ฟเวอร์ตอบกลับด้วย error status
      const status = error.response.status;
      switch (status) {
        case 400:
          errorMessage = error.response.data?.message || 'คำขอไม่ถูกต้อง';
          break;
        case 401:
          errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
          break;
        case 403:
          errorMessage = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
          break;
        case 404:
          errorMessage = 'ไม่พบข้อมูลที่ต้องการ';
          break;
        case 500:
          errorMessage = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์';
          break;
        default:
          errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
      }
    } else if (error.request) {
      // กรณีไม่ได้รับการตอบกลับจากเซิร์ฟเวอร์
      errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
    }
  }

  throw new Error(errorMessage);
};

/**
 * ============================
 * API เกี่ยวกับโต๊ะและลูกค้า
 * ============================
 */

// ดึงข้อมูลโต๊ะทั้งหมด
export const getTables = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/tables`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลโต๊ะ');
  }
};

// เพิ่มโต๊ะใหม่
export const addTable = async (tableNumber) => {
  try {
    const { data } = await axios.post(`${API_URL}/tables`, { 
      table_number: tableNumber,
      status_id: 1 // Assuming 1 is the ID for "ว่าง" status
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเพิ่มโต๊ะ');
  }
};

// ลบโต๊ะ
export const deleteTable = async (tableNumber) => {
  try {
    const { data } = await axios.delete(`${API_URL}/tables/${tableNumber}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการลบโต๊ะ');
  }
};

// บันทึกข้อมูลลูกค้า
export const saveCustomerData = async (tableId, adultCount, oldChildCount, childCount) => {
  try {
    const { data } = await axios.post(`${API_URL}/saveCustomer`, {
      tableId,
      adultCount,
      oldChildCount,
      childCount
    });
    return data;
  } catch (error) {
    console.error('Error saving customer data:', error);
    throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
  }
};

/**
 * ============================
 * API เกี่ยวกับสินค้า
 * ============================
 */

// ดึงข้อมูลสินค้าทั้งหมด
export const getProduct = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/product`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลสินค้า');
  }
};

// เพิ่มสินค้าใหม่
export const addProducts = async (productData) => {
  try {
    const { data } = await axios.post(`${API_URL}/product`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
  }
};

// ลบสินค้า
export const deleteProduct = async (id) => {
  try {
    const { data } = await axios.delete(`${API_URL}/product/${id}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการลบสินค้า');
  }
};

// แก้ไขข้อมูลสินค้า
export const updateProduct = async (id, productData) => {
  try {
    const { data } = await axios.put(`${API_URL}/product/${id}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการแก้ไขสินค้า');
  }
};

// อัพเดทสถานะสินค้า (ระงับการขาย)
export const updateProductStatus = async (id, newStatus) => {
  try {
    const { data } = await axios.patch(`${API_URL}/product/${id}/status`, {
      status: newStatus
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการอัพเดทสถานะสินค้า');
  }
};

/**
 * ============================
 * API เกี่ยวกับออเดอร์
 * ============================
 */

// สร้างออเดอร์ใหม่
export const createOrder = async (tableId, items) => {
  try {
    const { data } = await axios.post(`${API_URL}/order`, { tableId, items });
    // ตรวจสอบว่า response มี orderId
    if (data && data.orderId) {
      return data;
    } else {
      throw new Error('ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง');
    }
  } catch (error) {
    // จัดการ error ที่มาจาก axios
    if (error.response) {
      // Server ตอบกลับมาด้วย error status
      throw new Error(error.response.data.error || 'เกิดข้อผิดพลาดในการสร้างออเดอร์');
    } else if (error.request) {
      // ไม่ได้รับการตอบกลับจาก server
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } else {
      // เกิดข้อผิดพลาดอื่นๆ
      throw new Error('เกิดข้อผิดพลาดในการสร้างออเดอร์ กรุณาลองใหม่อีกครั้ง');
    }
  }
};

// ดึงประวัติการสั่งอาหารตามโต๊ะ
export const getOrdersByTable = async (tableId) => {
  try {
    if (!tableId) {
      throw new Error('กรุณาระบุหมายเลขโต๊ะ');
    }

    const response = await axios.get(`${API_URL}/order/${tableId}`);
    
    // เช็คว่ามีข้อมูลและเป็น array
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid response format:', response.data);
      throw new Error('ข้อมูลไม่ถูกต้อง');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      }
      throw new Error(error.response.data?.error || 'เกิดข้อผิดพลาดในการเรียกข้อมูล');
    }
    throw error;
  }
};

// อัพเดทสถานะรายการอาหาร
export const updateOrderItemStatus = async (orderDetailId, newStatus) => {
  try {
    // ตรวจสอบว่า status ที่ส่งมาถูกต้องหรือไม่
    if (!['P', 'C', 'V'].includes(newStatus)) {
      throw new Error('สถานะไม่ถูกต้อง กรุณาระบุ P, C หรือ V');
    }

    const { data } = await axios.put(`${API_URL}/order-detail/${orderDetailId}/status`, {
      status: newStatus
    });
    
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการอัพเดทสถานะรายการอาหาร');
  }
};

// ดึงข้อมูลรายละเอียดออเดอร์
export const getOrderDetails = async (orderId) => {
  try {
    const { data } = await axios.get(`${API_URL}/order-detail/${orderId}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลรายละเอียดออเดอร์');
  }
};

export const updateOrderDetailStatus = async (detailId, newStatus) => {
  try {
    // ตรวจสอบว่า status ที่ส่งมาถูกต้องหรือไม่
    if (!['A', 'P', 'C', 'V'].includes(newStatus)) {
      throw new Error('สถานะไม่ถูกต้อง กรุณาระบุ A, P, C หรือ V');
    }

    const { data } = await axios.patch(`${API_URL}/order-detail/${detailId}/status`, {
      status: newStatus
    });
    
    return data;
  } catch (error) {
    console.error('Error updating order detail status:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data?.error || 'เกิดข้อผิดพลาดในการอัพเดทสถานะ');
      } else if (error.request) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
    
    throw new Error('เกิดข้อผิดพลาดในการอัพเดทสถานะรายการอาหาร');
  }
};

/**
 * ============================
 * API เกี่ยวกับหมวดหมู่
 * ============================
 */

// ดึงข้อมูลหมวดหมู่ทั้งหมด
export const getCategories = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/category`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลหมวดหมู่');
  }
};

// เพิ่มหมวดหมู่ใหม่
export const addCategory = async (categoryName) => {
  try {
    const { data } = await axios.post(`${API_URL}/category`, { name: categoryName });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่');
  }
};

// แก้ไขหมวดหมู่
export const updateCategory = async (categoryId, categoryName) => {
  try {
    const { data } = await axios.put(`${API_URL}/category/${categoryId}`, {
      name: categoryName
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่');
  }
};

// ลบหมวดหมู่
export const deleteCategory = async (categoryId) => {
  try {
    const { data } = await axios.delete(`${API_URL}/category/${categoryId}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
  }
};

/**
 * ดึงออเดอร์ทั้งหมดทุกโต๊ะที่ยังเปิดอยู่
 */
export const getAllActiveOrders = async () => {
  try {
    // ดึงข้อมูลโต๊ะทั้งหมดก่อน
    const tables = await getTables();
    
    // จัดการดึงข้อมูลออเดอร์ทุกโต๊ะพร้อมกัน
    const orderPromises = tables.map(table => getOrdersByTable(table.id));
    
    // รอให้ทุก Promise เสร็จสิ้น
    const ordersArrays = await Promise.all(orderPromises);
    
    // รวมข้อมูลออเดอร์จากทุกโต๊ะและเพิ่มข้อมูลโต๊ะ
    const allOrders = [];
    
    ordersArrays.forEach((tableOrders, index) => {
      const tableInfo = tables[index];
      const ordersWithTableInfo = tableOrders.map(order => ({
        ...order,
        tableNumber: tableInfo.table_number,
        tableId: tableInfo.id
      }));
      
      allOrders.push(...ordersWithTableInfo);
    });
    
    // กรองเฉพาะออเดอร์ที่ยังทำงานอยู่ (Active)
    const activeOrders = allOrders.filter(order => order.status === 'A');
    
    // เรียงออเดอร์ตามเวลาล่าสุด โดยใช้ getTime() ให้ถูกต้อง
    const sortedOrders = activeOrders.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;  // เรียงจากใหม่ไปเก่า
    });
    
    // เพิ่ม debugging log เพื่อตรวจสอบผลลัพธ์
    console.log('Sorted orders from API:', sortedOrders.map(order => ({
      tableId: order.tableId,
      date: order.date,
      timestamp: new Date(order.date).getTime()
    })));
    
    return sortedOrders;
    
  } catch (error) {
    console.error('Error fetching all orders:', error);
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลออเดอร์ทั้งหมด');
  }
};