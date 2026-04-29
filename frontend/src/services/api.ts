import axios from 'axios';

// --- 1. FUNCIÓN PARA LEER EL TOKEN DE SEGURIDAD ---
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

// --- 2. CONFIGURACIÓN DE LA INSTANCIA ---
const api = axios.create({
  // En producción (Render), usará la variable de entorno NEXT_PUBLIC_API_URL
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1', 
});

// --- 3. EL INTERCEPTOR (EL PASAPORTE) ---
api.interceptors.request.use((config) => {
  const token = getCookie('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- 4. FUNCIONES DE AUTENTICACIÓN ---
export const loginUser = async (formData: FormData) => {
  const response = await api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// --- 5. DASHBOARD ---
export const getDashboardMetrics = async () => {
  const response = await api.get('/dashboard/');
  return response.data;
};

// --- 6. PRODUCTOS (INVENTARIO) ---
export const getProducts = async () => {
  const response = await api.get('/products/');
  return response.data;
};

export const createProduct = async (productData: any) => {
  const response = await api.post('/products/', productData);
  return response.data;
};

export const updateProduct = async (id: number, productData: any) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id: number) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// --- 7. VENTAS ---
export const registerSale = async (saleData: any) => {
  const response = await api.post('/sales/', saleData);
  return response.data;
};

// --- 8. FINANZAS (NUEVO - REQUERIMIENTO JGYSTORE 2.0) ---
export const getTransactions = async () => {
  const response = await api.get('/finance/');
  return response.data;
};

export const createTransaction = async (data: {
  type: string;
  category: string;
  amount_usd: number;
  description: string;
}) => {
  const response = await api.post('/finance/', data);
  return response.data;
};

// Función extra para el balance total si decides usarla en el Dashboard
export const getFinanceSummary = async () => {
  const response = await api.get('/finance/summary');
  return response.data;
};

export default api;

// --- 9. ENCARGOS (PEDIDOS BAJO MANDATO) ---
export const getOrders = async () => {
  const response = await api.get('/orders/');
  return response.data;
};

export const createOrder = async (orderData: {
  customer_name: string;
  product_details: string;
  amount_usd: number;
  deposit_usd: number;
}) => {
  const response = await api.post('/orders/', orderData);
  return response.data;
};

export const updateOrderStatus = async (orderId: number, status: string) => {
  const response = await api.put(`/orders/${orderId}/status?status=${status}`);
  return response.data;
};

export const deleteOrder = async (id: number) => {
  await api.delete(`/orders/${id}`);
};
export const updateOrder = async (id: number, data: any) => {
  const response = await api.put(`/orders/${id}`, data);
  return response.data;
};

export const getCustomers = async () => {
  const response = await api.get('/customers/');
  return response.data;
};

export const createCustomer = async (data: any) => {
  const response = await api.post('/customers/', data);
  return response.data;
};