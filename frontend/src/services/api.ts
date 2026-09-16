/// <reference types="vite/client" />
import {
  FarmerProfile,
  FarmDetails,
  YieldInput,
  YieldResult,
  RecommendationInput,
  RecommendationResult,
  SavedReport,
  WeatherAnalyticsSummary,
  SoilAnalyticsSummary
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
// Farmer Authentication APIs
// ----------------------------------------------------------------------------
export async function registerFarmer(data: {
  email: string;
  password: string;
  full_name: string;
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

export async function loginFarmer(data: { email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed.');
  }
  return res.json();
}

export async function fetchFarmerProfile(): Promise<FarmerProfile> {
  const res = await fetch(`${API_BASE_URL}/api/farmer/profile`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch farmer profile.');
  }
  const data = await res.json();
  return data.profile;
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
    throw new Error(err.detail || 'Failed to update profile.');
  }
  const result = await res.json();
  return result.profile;
}

export async function completeOnboarding(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/onboarding/complete`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
  });
}

// ----------------------------------------------------------------------------
// Farm Details Management APIs
// ----------------------------------------------------------------------------
export async function fetchFarmerFarm(): Promise<FarmDetails> {
  const res = await fetch(`${API_BASE_URL}/api/farmer/farm`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch farm details.');
  }
  const data = await res.json();
  return data.farm;
}

export async function updateFarmerFarm(data: FarmDetails): Promise<FarmDetails> {
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

// ----------------------------------------------------------------------------
// Yield Prediction & Crop Suitability APIs
// ----------------------------------------------------------------------------
export async function predictYield(input: YieldInput): Promise<YieldResult> {
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
    throw new Error(err.detail || 'Yield prediction failed.');
  }
  return res.json();
}

export async function predictRecommendation(input: RecommendationInput): Promise<RecommendationResult> {
  const res = await fetch(`${API_BASE_URL}/api/predict/recommendation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Crop suitability analysis failed.');
  }
  return res.json();
}

export async function getWeatherAnalytics(): Promise<WeatherAnalyticsSummary> {
  const res = await fetch(`${API_BASE_URL}/api/analytics/weather`);
  if (!res.ok) throw new Error('Failed to fetch weather analytics.');
  return res.json();
}

export async function getSoilAnalytics(): Promise<SoilAnalyticsSummary> {
  const res = await fetch(`${API_BASE_URL}/api/analytics/soil`);
  if (!res.ok) throw new Error('Failed to fetch soil analytics.');
  return res.json();
}

// Export aliases for WeatherSoilAnalyticsTab compatibility
export const fetchWeatherAnalytics = getWeatherAnalytics;
export const fetchSoilAnalytics = getSoilAnalytics;

// ----------------------------------------------------------------------------
// Reports & PDF History APIs
// ----------------------------------------------------------------------------
export async function fetchPredictionHistory(): Promise<SavedReport[]> {
  const res = await fetch(`${API_BASE_URL}/api/reports/history`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return data.history || [];
}

export function getReportPdfUrl(reportId: string): string {
  const token = localStorage.getItem('yieldsense_token') || '';
  return `${API_BASE_URL}/api/reports/pdf/${reportId}?token=${encodeURIComponent(token)}`;
}

export async function downloadReportPdf(reportId: string, filename: string = 'Crop_Yield_Report.pdf') {
  const res = await fetch(`${API_BASE_URL}/api/reports/pdf/${reportId}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error('Failed to download PDF report.');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
