import {
  YieldInput,
  YieldPredictionResponse,
  RecommendationInput,
  RecommendationResponse,
  WeatherAnalyticsSummary,
  SoilAnalyticsSummary,
  PredictionReportResponse
} from '../types';

const API_BASE_URL = ((import.meta as any).env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function checkApiHealth(): Promise<{ status: string; project: string; version?: string }> {
  const response = await fetch(`${API_BASE_URL}/`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`API health check failed with HTTP ${response.status}`);
  }
  return response.json();
}

export async function predictYield(input: YieldInput): Promise<YieldPredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/predict/yield`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || `Prediction request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function predictRecommendation(input: RecommendationInput): Promise<RecommendationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/predict/recommendation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || `Recommendation request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function fetchWeatherAnalytics(): Promise<WeatherAnalyticsSummary> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/weather`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Weather analytics request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchSoilAnalytics(): Promise<SoilAnalyticsSummary> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/soil`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Soil analytics request failed with status ${response.status}`);
  }

  return response.json();
}

export async function generatePredictionReport(input: YieldInput): Promise<PredictionReportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.detail || `Report generation failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
