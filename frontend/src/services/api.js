/**
 * YieldSense AI — API Service Layer
 * All HTTP calls to the FastAPI backend.
 */
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ys_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ys_token');
      localStorage.removeItem('ys_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Prediction ───────────────────────────────────────────────────────────────
export const predictionAPI = {
  predict: (data) => api.post('/predict', data),
  getModelInfo: () => api.get('/model-info'),
  getModelComparison: () => api.get('/model-comparison'),
};

// ─── AI Insights ──────────────────────────────────────────────────────────────
export const insightsAPI = {
  getInsights: (data) => api.post('/ai-insights', data),
};

// ─── Analysis ─────────────────────────────────────────────────────────────────
export const analysisAPI = {
  getWeatherAnalysis: () => api.get('/weather/analysis'),
  getSoilAnalysis: () => api.get('/soil/analysis'),
};

export default api;
