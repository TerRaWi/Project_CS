import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
// const API_URL = "http://203.159.93.245:3001/api" // Server


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

// เพิ่มฟังก์ชั่นช่วยสำหรับการจัดการกับ URL รูปภาพ
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // ถ้าเป็น URL เต็มอยู่แล้ว ให้ใช้ค่านั้นเลย
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // ถ้าเป็น path สัมพัทธ์ ให้แปลงเป็น URL เต็ม
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}${imagePath}`;
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

    // Add logging to debug the request
    console.log(`Fetching orders for table ID: ${tableId}`);
    
    const response = await axios.get(`${API_URL}/order/${tableId}`);
    
    // เช็คว่ามีข้อมูลและเป็น array
    if (!response.data) {
      console.error('Empty response received:', response);
      return []; // Return empty array instead of throwing error
    }
    
    if (!Array.isArray(response.data)) {
      console.error('Response is not an array:', response.data);
      // If data exists but is not an array, wrap it in an array
      return Array.isArray(response.data) ? response.data : [];
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    // More detailed error handling
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with an error status
        console.error('Server error response:', error.response.status, error.response.data);
        
        if (error.response.status === 500) {
          // For 500 errors, return empty array instead of throwing
          console.error('Server internal error (500). Returning empty array.');
          return [];
        }
        
        throw new Error(error.response.data?.error || `เกิดข้อผิดพลาดในการเรียกข้อมูล (${error.response.status})`);
      } else if (error.request) {
        // No response received
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      }
    }
    
    // For other errors, rethrow
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

export const updateOrderDetailStatus = async (detailId, newStatus, cancelReasonId = null) => {
  try {
    // ตรวจสอบว่าสถานะที่ส่งมาถูกต้องหรือไม่
    if (!['A', 'P', 'C', 'V'].includes(newStatus)) {
      throw new Error('สถานะไม่ถูกต้อง กรุณาระบุ A, P, C หรือ V');
    }

    // ถ้าเป็นการยกเลิกรายการ (V) และไม่มีเหตุผลการยกเลิก ให้แจ้งเตือน
    if (newStatus === 'V' && !cancelReasonId) {
      throw new Error('กรุณาระบุเหตุผลในการยกเลิก');
    }

    // สร้าง payload สำหรับส่งไป API
    const payload = {
      status: newStatus
    };

    // เพิ่มเหตุผลการยกเลิกในกรณีที่เป็นการยกเลิกรายการ
    if (newStatus === 'V' && cancelReasonId) {
      payload.cancel_reason_id = cancelReasonId;
    }

    const { data } = await axios.patch(`${API_URL}/order-detail/${detailId}/status`, payload);
    
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

export const addOrderItem = async (orderId, productId, quantity, unitPrice) => {
  try {
    const { data } = await axios.post(`${API_URL}/order-detail`, {
      order_id: orderId,
      product_id: productId,
      quantity: quantity,
      unit_price: unitPrice
    });
    return data;
  } catch (error) {
    console.error('Error adding order item:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data?.error || 'เกิดข้อผิดพลาดในการเพิ่มรายการ');
      } else if (error.request) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
    
    throw new Error('เกิดข้อผิดพลาดในการเพิ่มรายการอาหาร');
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
    
    // เพิ่มการตรวจสอบ
    if (!tables || tables.length === 0) {
      console.log('No tables found');
      return [];
    }
    
    // เปลี่ยนจาก Promise.all เป็น Promise.allSettled
    const ordersArrays = await Promise.allSettled(
      tables.map(table => getOrdersByTable(table.id))
    );
    
    // รวมข้อมูลออเดอร์จากทุกโต๊ะที่สำเร็จเท่านั้น
    const allOrders = [];
    
    // เปลี่ยนวิธีการประมวลผล Promise.allSettled
    ordersArrays.forEach((result, index) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        const tableInfo = tables[index];
        const ordersWithTableInfo = result.value.map(order => ({
          ...order,
          tableNumber: tableInfo.table_number,
          tableId: tableInfo.id
        }));
        
        allOrders.push(...ordersWithTableInfo);
      } else {
        console.error(`Failed to get orders for table ${tables[index].id}:`, 
          result.status === 'rejected' ? result.reason : 'Invalid response format');
      }
    });
    
    // ส่วนที่เหลือคงเดิม
    const activeOrders = allOrders.filter(order => order.status === 'A');
    
    const sortedOrders = activeOrders.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
    
    return sortedOrders;
    
  } catch (error) {
    console.error('Error fetching all orders:', error);
    // เปลี่ยนจาก throw error เป็นคืนค่า array ว่าง
    return [];
  }
};

/**
 * ============================
 * API เกี่ยวกับการชำระเงิน (Payment)
 * ============================
 */

// ดึงข้อมูลบิล
export const getBill = async (orderId) => {
  try {
    const { data } = await axios.get(`${API_URL}/order/${orderId}/bill`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงข้อมูลบิล');
  }
};

// ชำระเงินและปิดโต๊ะ
export const checkout = async (orderId, paymentMethod) => {
  try {
    const { data } = await axios.post(`${API_URL}/checkout/${orderId}`, {
      paymentMethod
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการชำระเงิน');
  }
};

// ดึงประวัติการชำระเงินทั้งหมด
export const getAllPayments = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/payments`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน');
  }
};

// ดึงประวัติการชำระเงินตามวันที่
export const getPaymentsByDate = async (startDate, endDate) => {
  try {
    const { data } = await axios.get(`${API_URL}/payments`, {
      params: { startDate, endDate }
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน');
  }
};

// ดึงข้อมูลใบเสร็จ
export const getReceipt = async (paymentId) => {
  try {
    const { data } = await axios.get(`${API_URL}/receipt/${paymentId}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงข้อมูลใบเสร็จ');
  }
};

// ยกเลิกการชำระเงิน (กรณีทำผิด)
export const voidPayment = async (paymentId, reason) => {
  try {
    const { data } = await axios.post(`${API_URL}/payment/${paymentId}/void`, {
      reason
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการยกเลิกการชำระเงิน');
  }
};

// ออกใบกำกับภาษี
export const generateTaxInvoice = async (paymentId, customerInfo) => {
  try {
    const { data } = await axios.post(`${API_URL}/payment/${paymentId}/tax-invoice`, customerInfo);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการออกใบกำกับภาษี');
  }
};

/**
 * ดึงข้อมูลเหตุผลในการยกเลิกรายการอาหาร
 */
export const getCancelReasons = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/cancel-reasons`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลเหตุผลการยกเลิก');
  }
};

/**
 * ============================
 * API เกี่ยวกับการจัดการโต๊ะ (ย้าย, รวม, ยกเลิก)
 * ============================
 */

// ย้ายโต๊ะจากต้นทางไปปลายทาง (ย้ายออเดอร์ทั้งหมดไปโต๊ะใหม่)
export const moveTable = async (sourceTableId, targetTableId) => {
  try {
    const { data } = await axios.post(`${API_URL}/tables/move`, {
      sourceTableId,
      targetTableId
    });
    return data;
  } catch (error) {
    // การจัดการข้อผิดพลาด
  }
};

// รวมโต๊ะสองโต๊ะเข้าด้วยกัน (รวมออเดอร์)
export const mergeTable = async (sourceTableId, targetTableId) => {
  try {
    const { data } = await axios.post(`${API_URL}/tables/merge`, {
      sourceTableId,
      targetTableId
    });
    return data;
  } catch (error) {
    console.error('Error merging tables:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data?.error || 'เกิดข้อผิดพลาดในการรวมโต๊ะ');
      } else if (error.request) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
    throw new Error('เกิดข้อผิดพลาดในการรวมโต๊ะ');
  }
};

// ยกเลิกโต๊ะ (ยกเลิกออเดอร์ทั้งหมดและปรับสถานะโต๊ะเป็นว่าง)
export const cancelTable = async (tableId) => {
  try {
    const { data } = await axios.post(`${API_URL}/tables/cancel`, {
      tableId
    });
    return data;
  } catch (error) {
    console.error('Error canceling table:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(error.response.data?.error || 'เกิดข้อผิดพลาดในการยกเลิกโต๊ะ');
      } else if (error.request) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
    throw new Error('เกิดข้อผิดพลาดในการยกเลิกโต๊ะ');
  }
};

export const getPaymentsByStatus = async (status, startDate, endDate) => {
  try {
    // ถ้าเลือกสถานะ "ทั้งหมด" ให้ดึงข้อมูลทั้งหมด ไม่ต้องกรอง status
    const url = `${API_URL}/payments${status === 'all' ? '' : `/${status}`}`;
    
    // สร้าง params สำหรับช่วงวันที่
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const { data } = await axios.get(url, { params });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงประวัติการชำระเงิน');
  }
};

export const getCanceledBills = async (startDate, endDate) => {
  try {
    const { data } = await axios.get(`${API_URL}/canceled-orders`, {
      params: { startDate, endDate }
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงข้อมูลบิลที่ถูกยกเลิก');
  }
};

// คำขอบริการของลูกค้า

/**
 * ส่งคำขอบริการของลูกค้า
 * @param {number} tableId - รหัสโต๊ะ
 * @param {number} orderId - รหัสออเดอร์
 * @param {string} serviceType - ประเภทของบริการที่ต้องการ
 * @param {string} note - บันทึกเพิ่มเติม (ถ้ามี)
 * @returns {Promise<object>} - ข้อมูลการตอบกลับจากเซิร์ฟเวอร์
 */
export const requestCustomerService = async (tableId, orderId, serviceType, note = '') => {
  try {
    const response = await axios.post(`${API_URL}/service-requests`, {
      tableId,
      orderId,
      serviceType,
      note,
      requestTime: new Date().toISOString()
    });
    
    return response.data;
  } catch (err) {
    console.error('Error sending service request:', err);
    
    if (axios.isAxiosError(err)) {
      if (err.response) {
        throw new Error(err.response.data?.error || 'เกิดข้อผิดพลาดในการส่งคำขอบริการ');
      } else if (err.request) {
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    }
    
    throw new Error('เกิดข้อผิดพลาดในการส่งคำขอบริการ');
  }
};

/**
 * ดึงข้อมูลคำขอบริการของโต๊ะ
 * @param {number} tableId - รหัสโต๊ะ
 * @returns {Promise<Array>} - รายการคำขอบริการ
 */
export const getServiceRequestsByTable = async (tableId) => {
  try {
    const response = await axios.get(`${API_URL}/service-requests`, {
      params: { tableId }
    });
    
    return response.data;
  } catch (err) {
    console.error('Error fetching service requests:', err);
    handleApiError(err, 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอบริการ');
  }
};

/**
 * อัพเดตสถานะคำขอบริการ
 * @param {number} requestId - รหัสคำขอบริการ
 * @param {string} status - สถานะใหม่ (pending, in-progress, completed, canceled)
 * @param {string} note - บันทึกเพิ่มเติม (ถ้ามี)
 * @returns {Promise<object>} - ข้อมูลคำขอบริการที่อัพเดต
 */
export const updateServiceRequestStatus = async (requestId, status, note = '') => {
  try {
    const response = await axios.patch(`${API_URL}/service-requests/${requestId}/status`, {
      status,
      note,
      updatedAt: new Date().toISOString()
    });
    
    return response.data;
  } catch (err) {
    console.error('Error updating service request status:', err);
    handleApiError(err, 'เกิดข้อผิดพลาดในการอัพเดตสถานะคำขอบริการ');
  }
};

/**
 * ดึงประวัติบิลทั้งหมด (ทั้งที่ชำระแล้วและที่ยกเลิก)
 * @param {string} startDate - วันที่เริ่มต้น (yyyy-MM-dd)
 * @param {string} endDate - วันที่สิ้นสุด (yyyy-MM-dd)
 * @param {string} status - สถานะที่ต้องการ ('all', 'completed', 'canceled')
 * @returns {Promise<Array>} - รายการบิลทั้งหมด
 */
export const getBillHistory = async (startDate, endDate, status = 'all') => {
  try {
    // สร้าง query parameters
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status !== 'all') params.append('status', status);
    
    // ส่งคำขอไปยัง API
    const url = `${API_URL}/bill-history?${params.toString()}`;
    console.log('Fetching bill history from:', url);
    
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error('Error fetching bill history:', error);
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงประวัติบิล');
  }
};

/**
 * ดึงข้อมูลโต๊ะทั้งหมด รวมถึงโต๊ะที่ไม่ใช้งานแล้ว
 */
export const getAllTablesIncludeInactive = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/all-tables`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลโต๊ะทั้งหมด');
  }
};

/**
 * ดึงข้อมูลสถานะโต๊ะทั้งหมด
 */
export const getTableStatuses = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/table-statuses`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการเรียกข้อมูลสถานะโต๊ะ');
  }
};

/**
 * ดึงประวัติการใช้งานของโต๊ะทั้งหมด (รวมถึงโต๊ะที่ไม่ใช้งานแล้ว)
 */
export const getAllTableHistory = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/table-history`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงประวัติการใช้งานโต๊ะ');
  }
};

/**
 * ดึงประวัติการใช้งานของโต๊ะตามหมายเลขโต๊ะ
 * @param {string} tableNumber - หมายเลขโต๊ะที่ต้องการดูประวัติ
 */
export const getTableHistory = async (tableNumber) => {
  try {
    const { data } = await axios.get(`${API_URL}/table-history/${tableNumber}`);
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการดึงประวัติการใช้งานโต๊ะ');
  }
};

/**
 * อัปเดตสถานะของโต๊ะ (ใช้สำหรับเปิดใช้งาน/ระงับการใช้งานโต๊ะ)
 * @param {number} tableId - รหัสโต๊ะ
 * @param {number} statusId - รหัสสถานะใหม่
 */
export const updateTableStatus = async (tableId, statusId) => {
  try {
    const { data } = await axios.patch(`${API_URL}/tables/${tableId}/status`, {
      status_id: statusId
    });
    return data;
  } catch (error) {
    handleApiError(error, 'เกิดข้อผิดพลาดในการอัปเดตสถานะโต๊ะ');
  }
};