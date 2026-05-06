import axios from 'axios';

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

const api = axios.create({
  baseURL: 'https://jgystore.onrender.com/api/v1', 
});

api.interceptors.request.use((config) => {
  const token = getCookie('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- FUNCIONES CORREGIDAS PARA DEVOLVER .DATA DIRECTAMENTE ---
export const loginUser = (formData: any) => api.post('/auth/login', formData).then(res => res.data);
export const getDashboardMetrics = () => api.get('/dashboard/').then(res => res.data);
export const refreshRates = () => api.post('/dashboard/refresh-rates').then(res => res.data);

export const getProducts = () => api.get('/products/').then(res => res.data);
export const createProduct = (data: any) => api.post('/products/', data).then(res => res.data);
export const updateProduct = (id: number, data: any) => api.put(`/products/${id}`, data).then(res => res.data);
export const deleteProduct = (id: number) => api.delete(`/products/${id}`).then(res => res.data);

export const registerSale = (data: any) => api.post('/sales/', data).then(res => res.data);

export const getTransactions = () => api.get('/finance/').then(res => res.data);
export const createTransaction = (data: any) => api.post('/finance/', data).then(res => res.data);
export const updateFinance = (id: number, data: any) => api.put(`/finance/${id}`, data).then(res => res.data);
export const deleteFinance = (id: number) => api.delete(`/finance/${id}`).then(res => res.data);

export const getOrders = () => api.get('/orders/').then(res => res.data);
export const createOrder = (data: any) => api.post('/orders/', data).then(res => res.data);
export const updateOrder = (id: number, data: any) => api.put(`/orders/${id}`, data).then(res => res.data);
export const deleteOrder = (id: number) => api.delete(`/orders/${id}`).then(res => res.data);
export const updateOrderStatus = (id: number, status: string) => api.put(`/orders/${id}/status?status=${status}`).then(res => res.data);

export const getCustomers = () => api.get('/customers/').then(res => res.data);
export const createCustomer = (data: any) => api.post('/customers/', data).then(res => res.data);
export const updateCustomer = (id: number, data: any) => api.put(`/customers/${id}`, data).then(res => res.data);
export const deleteCustomer = (id: number) => api.delete(`/customers/${id}`).then(res => res.data);

export default api;