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
    console.error('เกิดข้อผิดพลาดในการเรียกโต๊ะ:', error);
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
    console.log('Sending data to server:', data);
    const response = await axios.put(`${API_URL}/customer/${id}`, data);
    console.log('ผลลัพธ์จากการเรียก API:', response);
    return response.data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเรียก API:', error);
    throw error;
  }
};
