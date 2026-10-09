/**
 * YieldSense AI — API Service Layer
 * All HTTP calls to the FastAPI backend.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

// ─── Milestone 3: Productivity ────────────────────────────────────────────────
export const productivityAPI = {
  getAnalysis: () => api.get('/productivity/analysis'),
};

// ─── Milestone 3: Crop Recommendation ────────────────────────────────────────
export const recommendationAPI = {
  getCropRecommendation: (data) => api.post('/recommendation/crop', data),
};

// ─── Milestone 3: Resource Optimization ──────────────────────────────────────
export const resourcesAPI = {
  optimize: (data) => api.post('/resources/optimize', data),
};

// ─── Milestone 3: Risk Assessment ────────────────────────────────────────────
export const riskAPI = {
  assess: (data) => api.post('/risk/assess', data),
};

// ─── Prediction History ───────────────────────────────────────────────────────
export const historyAPI = {
  saveHistory:   (data)   => api.post('/history/save', data),
  getHistory:    (params) => api.get('/history', { params }),
  getPrediction: (id)     => api.get(`/history/${id}`),
  deleteHistory: (id)     => api.delete(`/history/${id}`),
};

// ─── PDF Report ───────────────────────────────────────────────────────────────
export const reportAPI = {
  downloadById: (id)   => api.get(`/report/${id}`, { responseType: 'blob' }),
  generateLive: (data) => api.post('/report/generate', data, { responseType: 'blob' }),
};

// ─── Agriculture AI Chatbot ───────────────────────────────────────────────────
export const chatbotAPI = {
  ask: (data) => api.post('/chatbot/ask', data),
};

export default api;


