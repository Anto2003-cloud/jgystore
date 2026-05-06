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
  baseURL: 'https://jgystore.onrender.com/api/v1', 
});

// --- 3. INTERCEPTOR PARA AUTH ---
api.interceptors.request.use((config) => {
  const token = getCookie('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- 4. FUNCIONES DE AUTENTICACIÓN ---
export const loginUser = (formData: any) => api.post('/auth/login', formData);

// --- 5. DASHBOARD ---
export const getDashboardMetrics = () => api.get('/dashboard/');
export const refreshRates = () => api.post('/dashboard/refresh-rates');

// --- 6. PRODUCTOS (INVENTARIO) ---
export const getProducts = () => api.get('/products/');
export const createProduct = (data: any) => api.post('/products/', data);
export const updateProduct = (id: number, data: any) => api.put(`/products/${id}`, data);
export const deleteProduct = (id: number) => api.delete(`/products/${id}`);

// --- 7. VENTAS (POS) ---
export const registerSale = (data: any) => api.post('/sales/', data);

// --- 8. FINANZAS ---
export const getTransactions = () => api.get('/finance/');
export const createTransaction = (data: any) => api.post('/finance/', data);
export const updateFinance = (id: number, data: any) => api.put(`/finance/${id}`, data);
export const deleteFinance = (id: number) => api.delete(`/finance/${id}`);

// --- 9. ENCARGOS ---
export const getOrders = () => api.get('/orders/');
export const createOrder = (data: any) => api.post('/orders/', data);
export const updateOrder = (id: number, data: any) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id: number) => api.delete(`/orders/${id}`);
export const updateOrderStatus = (id: number, status: string) => api.put(`/orders/${id}/status?status=${status}`);

// --- 10. CLIENTES (CRM) ---
export const getCustomers = () => api.get('/customers/');
export const createCustomer = (data: any) => api.post('/customers/', data);
export const updateCustomer = (id: number, data: any) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id: number) => api.delete(`/customers/${id}`);

export default api;