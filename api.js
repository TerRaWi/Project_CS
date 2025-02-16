import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Custom error handler
const handleApiError = (error, customMessage) => {
  console.error(customMessage, error);
  
  if (error.response) {
    switch (error.response.status) {
      case 404:
        throw new Error('ไม่พบข้อมูลที่ต้องการ');
      case 500:
        throw new Error('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์');
      default:
        throw new Error(customMessage);
    }
  }
  
  throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
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

export const saveCustomerData = async (id, adultCount, oldChildCount, childCount, count) => {
  try {
    const { data } = await axios.put(`${API_URL}/customer/${id}`, {
      adultCount,
      oldChildCount,
      childCount,
      count
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลูกค้า');
  }
};

// Product APIs
export const getProduct = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/product`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลสินค้า');
  }
};

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

export const deleteProduct = async (id) => {
  try {
    const { data } = await axios.delete(`${API_URL}/product/${id}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการลบสินค้า');
  }
};

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
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการสร้างออเดอร์');
  }
};

export const getOrdersByTable = async (tableId) => {
  try {
    const { data } = await axios.get(`${API_URL}/orders/${tableId}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์');
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