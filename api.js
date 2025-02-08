import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const getTables = async () => {
  try {
    const response = await axios.get(`${API_URL}/customer`);
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเรียกโต๊ะ:', error);
    throw error;
  }
};

export const addTable = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/customer`, { id });
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเพิ่มโต๊ะ:', error);
    throw error;
  }
};

export const deleteTable = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/customer/${id}`);
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลบโต๊ะ:', error);
    throw error;
  }
};

export const getProduct = async () => {
  try {
    const response = await axios.get(`${API_URL}/product`);
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเรียกสินค้า:', error);
    throw error;
  }
};

export const saveCustomerData = async (id, adultCount, oldChildCount, childCount, count) => {
  try {
    const data = {
      adultCount,
      oldChildCount,
      childCount,
      count
    };
    // console.log('Sending data to server:', data); 
    const response = await axios.put(`${API_URL}/customer/${id}`, data);
    console.log('ผลลัพธ์จากการเรียก API:', response);
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเรียก API:', error);
    throw error;
  }
};

// ฟังก์ชันเพิ่มสินค้าใหม่
export const addproducts = async (productData) => {
  try {
    const response = await axios.post(`${API_URL}/product`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเพิ่มสินค้า:', error);
    throw error;
  }
};

 // เพิ่มฟังก์ชันลบสินค้า
 export const deleteproducts = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/product/${id}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 500) {
      throw new Error('เกิดข้อผิดพลาดในการลบสินค้า');
    }
    console.error('เกิดข้อผิดพลาดในการลบสินค้า:', error);
    throw new Error('เกิดข้อผิดพลาดในการดำเนินการ');
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await axios.put(`${API_URL}/product/${id}`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      ...response.data,
      id: response.data.id,
      name: response.data.name,
      price: response.data.price,
      category_id: response.data.category_id,
      image_url: response.data.image_url
    };
  } catch (error) {
    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error('ไม่พบสินค้าที่ต้องการแก้ไข');
        case 500:
          throw new Error('เกิดข้อผิดพลาดในการแก้ไขสินค้า');
        default:
          throw new Error('เกิดข้อผิดพลาดในการดำเนินการ');
      }
    }
    console.error('เกิดข้อผิดพลาดในการแก้ไขสินค้า:', error);
    throw error;
  }
};

export const createOrder = async (tableId, items) => {
  try {
    console.log('Sending order data:', { tableId, items }); // เพิ่ม log
    const response = await axios.post(`${API_URL}/order`, {
      tableId,
      items
    });
    console.log('Order API response:', response.data); // เพิ่ม log
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/category`);
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเรียกหมวดหมู่:', error);
    throw error;
  }
};

export const getOrdersByTable = async (tableId) => {
  try {
    const response = await axios.get(`${API_URL}/orders/${tableId}`);
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์:', error);
    throw error;
  }
};