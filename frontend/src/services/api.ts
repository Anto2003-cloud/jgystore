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
  // Asegúrate de que en tu .env.local diga: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000', 
});

// --- 3. EL INTERCEPTOR (EL PASAPORTE) ---
// Este código añade el token de seguridad a cada petición automáticamente
api.interceptors.request.use((config) => {
  const token = getCookie('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- 4. FUNCIONES DE AUTENTICACIÓN (NUEVO) ---
export const loginUser = async (formData: FormData) => {
  // FastAPI espera los datos de login como OAuth2 Form Data
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

export default api;