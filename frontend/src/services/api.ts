import axios from 'axios';

// Función para el token de seguridad
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

const api = axios.create({
  // CAMBIA ESTO POR TU URL REAL DE RENDER
  baseURL: 'https://jgystore.onrender.com/api/v1', 
});

api.interceptors.request.use((config) => {
  const token = getCookie('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Funciones básicas
export const loginUser = (formData: any) => api.post('/auth/login', formData);
export const getDashboardMetrics = () => api.get('/dashboard/');
export const getProducts = () => api.get('/products/');
export const createProduct = (data: any) => api.post('/products/', data);
export const registerSale = (data: any) => api.post('/sales/', data);
export const getTransactions = () => api.get('/finance/');
export const createTransaction = (data: any) => api.post('/finance/', data);
export const getOrders = () => api.get('/orders/');
export const createOrder = (data: any) => api.post('/orders/', data);
export const getCustomers = () => api.get('/customers/');
export const createCustomer = (data: any) => api.post('/customers/', data);

export default api;