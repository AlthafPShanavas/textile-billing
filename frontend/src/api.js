import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on an expired/invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addVariant: (productId, data) => api.post(`/products/${productId}/variants`, data),
  updateVariant: (variantId, data) => api.put(`/products/variants/${variantId}`, data),
  deleteVariant: (variantId) => api.delete(`/products/variants/${variantId}`),
};

export const stockAPI = {
  getAll: () => api.get('/stock'),
  getByVariantId: (variantId) => api.get(`/stock/${variantId}`),
  adjust: (data) => api.post('/stock', data),
  set: (variantId, data) => api.put(`/stock/${variantId}`, data),
};

export const billingAPI = {
  create: (data) => api.post('/billing/create', data),
  getAll: () => api.get('/billing'),
  getById: (id) => api.get(`/billing/${id}`),
};

export const staffAPI = {
  getAll: () => api.get('/staff'),
  getById: (id) => api.get(`/staff/${id}`),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
};

export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const reportAPI = {
  getDaily: (date) => api.get(`/reports/daily/${date}`),
  getMonthly: (year, month) => api.get(`/reports/monthly/${year}/${month}`),
  getYearly: (year) => api.get(`/reports/yearly/${year}`),
  getSummary: () => api.get('/reports/stats/summary'),
  getDashboard: () => api.get('/reports/dashboard'),
};

export const paymentAPI = {
  create: (data) => api.post('/payments', data),
  getByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
};

export const whatsappAPI = {
  sendInvoice: (data) => api.post('/whatsapp/send-invoice', data),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (formData) => api.post('/settings', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export default api;
