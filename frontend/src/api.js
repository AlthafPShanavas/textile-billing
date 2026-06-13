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
};

export const stockAPI = {
  getAll: () => api.get('/stock'),
  getByProductId: (productId) => api.get(`/stock/${productId}`),
  add: (data) => api.post('/stock', data),
  update: (productId, data) => api.put(`/stock/${productId}`, data),
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

export const reportAPI = {
  getDaily: (date) => api.get(`/reports/daily/${date}`),
  getMonthly: (year, month) => api.get(`/reports/monthly/${year}/${month}`),
  getYearly: (year) => api.get(`/reports/yearly/${year}`),
  getSummary: () => api.get('/reports/stats/summary'),
};

export const paymentAPI = {
  create: (data) => api.post('/payments', data),
  getByOrderId: (orderId) => api.get(`/payments/order/${orderId}`),
};

export default api;
