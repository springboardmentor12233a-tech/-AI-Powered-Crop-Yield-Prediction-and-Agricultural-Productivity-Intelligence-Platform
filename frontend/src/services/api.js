import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
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

// Response interceptor to handle 401s (optional, but good for clearing bad tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid, but don't redirect here to avoid circular dependencies with React Router
      // The AuthContext will handle state updates when it fails to verify
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// ==========================================
// Authentication Endpoints
// ==========================================

export const loginUser = async (email, password) => {
  // FastAPI OAuth2PasswordRequestForm requires x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// ==========================================
// Milestone 2 Core Endpoints
// ==========================================

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const predictYield = async (data) => {
  const response = await api.post('/ml/predict', data);
  return response.data;
};

export const getWeatherAnalysis = async (data) => {
  const response = await api.post('/ml/weather-analysis', data);
  return response.data;
};

export const getSoilAnalysis = async (data) => {
  const response = await api.post('/ml/soil-analysis', data);
  return response.data;
};

export const getAgriculturalReport = async (data) => {
  const response = await api.post('/ml/agricultural-report', data);
  return response.data;
};

export const getLLMInsights = async (data) => {
  const response = await api.post('/ml/llm-insights', data);
  return response.data;
};

export default api;
