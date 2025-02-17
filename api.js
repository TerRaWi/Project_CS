import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Custom error handler
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

// Table/Customer APIs
export const getTables = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/tables`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลโต๊ะ');
  }
};

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

export const deleteTable = async (tableNumber) => {
  try {
    const { data } = await axios.delete(`${API_URL}/tables/${tableNumber}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการลบโต๊ะ');
  }
};

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

// Product APIs
//
export const getProduct = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/product`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลสินค้า');
  }
};

//
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

//
export const deleteProduct = async (id) => {
  try {
    const { data } = await axios.delete(`${API_URL}/product/${id}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการลบสินค้า');
  }
};

//
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

// ฟังก์ชั่น ระงับการขายสินค้า
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

// Order APIs
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

export const getOrdersByTable = async (tableId) => {
  try {
    const response = await axios.get(`${API_URL}/orders/${tableId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'ไม่สามารถโหลดข้อมูลออเดอร์ได้');
  }
};

// Category APIs
export const getCategories = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/category`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลหมวดหมู่');
  }
};