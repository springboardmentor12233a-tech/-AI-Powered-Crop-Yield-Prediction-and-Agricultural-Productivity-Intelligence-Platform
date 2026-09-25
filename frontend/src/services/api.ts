/// <reference types="vite/client" />
import {
  FarmerProfile,
  FarmDetails,
  YieldInput,
  YieldResult,
  RecommendationInput,
  RecommendationResult,
  SavedReport,
  SavedRecommendation,
  WeatherAnalyticsSummary,
  SoilAnalyticsSummary,
  AdminSystemStats,
  LLMConfig,
  ChatMessage
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('yieldsense_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/`);
    return res.ok;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Authentication & Profile APIs
// ----------------------------------------------------------------------------
export async function registerUser(data: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  phone?: string;
  village?: string;
  district?: string;
  state?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Registration failed.');
  }
  return res.json();
}

export async function loginUser(data: { email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Invalid email or password.');
  }
  return res.json();
}

export async function fetchCurrentUserProfile(): Promise<FarmerProfile> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch profile.');
  }
  const data = await res.json();
  return data.user;
}

export async function updateFarmerProfile(data: {
  full_name: string;
  phone?: string;
  village?: string;
  district?: string;
  state?: string;
}): Promise<FarmerProfile> {
  const res = await fetch(`${API_BASE_URL}/api/farmer/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update farmer profile.');
  }
  const result = await res.json();
  return result.profile;
}

export async function updateFarmerFarm(data: {
  field_name: string;
  land_size: number;
  land_unit: 'Acres' | 'Hectares';
  soil_type: string;
  irrigation_method: string;
}): Promise<FarmDetails> {
  const res = await fetch(`${API_BASE_URL}/api/farmer/farm`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update farm details.');
  }
  const result = await res.json();
  return result.farm;
}

export async function completeOnboarding(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/auth/onboarding/complete`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error('Failed to mark onboarding complete.');
  }
}

// ----------------------------------------------------------------------------
// Farm Profile APIs
// ----------------------------------------------------------------------------
export async function fetchFarmerFarm(): Promise<FarmDetails> {
  const res = await fetch(`${API_BASE_URL}/api/farmer/farm`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch farm profile.');
  }
  const data = await res.json();
  return data.farm;
}

export async function updateFarmerProfileAndFarm(data: {
  full_name: string;
  phone?: string;
  village?: string;
  district?: string;
  state?: string;
  field_name: string;
  land_size: number;
  land_unit: 'Acres' | 'Hectares';
  soil_type: string;
  irrigation_method: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/farmer/profile-and-farm`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update profile.');
  }
  return res.json();
}

// ----------------------------------------------------------------------------
// ML Prediction & Recommendation APIs
// ----------------------------------------------------------------------------
export async function predictCropYield(input: YieldInput): Promise<YieldResult> {
  const res = await fetch(`${API_BASE_URL}/api/predict/yield`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Prediction failed.');
  }
  return res.json();
}

export async function predictCropRecommendation(input: RecommendationInput): Promise<RecommendationResult> {
  const res = await fetch(`${API_BASE_URL}/api/predict/recommendation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Crop recommendation failed.');
  }
  return res.json();
}

// ----------------------------------------------------------------------------
// Reports & History APIs
// ----------------------------------------------------------------------------
export async function generateFullReport(input: YieldInput): Promise<SavedReport> {
  const res = await fetch(`${API_BASE_URL}/api/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Report generation failed.');
  }
  return res.json();
}

export async function fetchFarmerPredictionHistory(): Promise<SavedReport[]> {
  const res = await fetch(`${API_BASE_URL}/api/reports/history`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error('Failed to load prediction history.');
  }
  const data = await res.json();
  return data.history || [];
}

export async function fetchFarmerRecommendationHistory(): Promise<SavedRecommendation[]> {
  const res = await fetch(`${API_BASE_URL}/api/predict/recommendations/history`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error('Failed to load recommendation history.');
  }
  const data = await res.json();
  return data.history || [];
}

export function getReportPdfDownloadUrl(reportId: string): string {
  return `${API_BASE_URL}/api/reports/${reportId}/pdf`;
}

export async function downloadReportPdfBlob(reportId: string): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}/pdf`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error('Failed to generate PDF on server.');
  }
  return res.blob();
}

// ----------------------------------------------------------------------------
// AI Agricultural Chatbot APIs
// ----------------------------------------------------------------------------
export async function sendChatMessage(message: string): Promise<{ reply: string; message: ChatMessage }> {
  const res = await fetch(`${API_BASE_URL}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to communicate with AI Assistant.');
  }
  return res.json();
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/api/chat/history`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages || [];
}

export async function clearChatHistory(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/chat/history`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
}

// ----------------------------------------------------------------------------
// Analytics APIs
// ----------------------------------------------------------------------------
export async function fetchWeatherAnalytics(): Promise<WeatherAnalyticsSummary> {
  const res = await fetch(`${API_BASE_URL}/api/analytics/weather`);
  if (!res.ok) throw new Error('Failed to fetch weather analytics.');
  return res.json();
}

export async function fetchSoilAnalytics(): Promise<SoilAnalyticsSummary> {
  const res = await fetch(`${API_BASE_URL}/api/analytics/soil`);
  if (!res.ok) throw new Error('Failed to fetch soil analytics.');
  return res.json();
}

// ----------------------------------------------------------------------------
// Admin APIs
// ----------------------------------------------------------------------------
export async function fetchAdminStats(): Promise<AdminSystemStats> {
  const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Admin access required.');
  }
  const data = await res.json();
  return data.stats;
}

export async function fetchAdminFarmers(): Promise<FarmerProfile[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/farmers`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to load farmers.');
  const data = await res.json();
  return data.farmers;
}

export async function fetchAdminFarmerDetails(farmerId: number) {
  const res = await fetch(`${API_BASE_URL}/api/admin/farmers/${farmerId}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to load farmer details.');
  return res.json();
}

export async function toggleFarmerStatus(userId: number, isActive: number) {
  const res = await fetch(`${API_BASE_URL}/api/admin/farmers/toggle-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ user_id: userId, is_active: isActive }),
  });
  if (!res.ok) throw new Error('Failed to update status.');
  return res.json();
}

export async function deleteFarmerAccount(userId: number) {
  const res = await fetch(`${API_BASE_URL}/api/admin/farmers/${userId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to delete farmer account.');
  return res.json();
}

export async function fetchLLMConfigs(): Promise<LLMConfig[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/llm/configs`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch LLM configs.');
  const data = await res.json();
  return data.configs;
}

export async function saveLLMConfig(data: {
  provider: string;
  model_name: string;
  api_key?: string;
  is_active: boolean;
}) {
  const res = await fetch(`${API_BASE_URL}/api/admin/llm/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save LLM config.');
  return res.json();
}

export async function testLLMConnection(data: {
  provider: string;
  model_name: string;
  api_key: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/admin/llm/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Backward compatibility alias exports
export const registerFarmer = registerUser;
export const loginFarmer = loginUser;
export const fetchFarmerProfile = fetchCurrentUserProfile;
export const predictYield = predictCropYield;
export const predictRecommendation = predictCropRecommendation;
export const fetchPredictionHistory = fetchFarmerPredictionHistory;
