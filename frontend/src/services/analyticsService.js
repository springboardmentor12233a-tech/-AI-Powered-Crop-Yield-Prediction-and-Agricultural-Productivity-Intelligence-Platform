import { API_BASE_URL } from "./apiConfig";
const pendingJsonRequests = new Map();

function getAuthHeaders(headers = {}) {
  const token = localStorage.getItem("yieldsense-auth-token");
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

async function getJson(path, params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null));
  const url = `${API_BASE_URL}${path}${query.toString() ? `?${query}` : ""}`;
  const token = localStorage.getItem("yieldsense-auth-token") || "";
  const key = `${token}:${url}`;
  const pending = pendingJsonRequests.get(key);
  if (pending) return pending;

  const request = fetch(url, { headers: getAuthHeaders() }).then(async (response) => {
    if (!response.ok) throw new Error("Analytics service is unavailable.");
    return response.json();
  });
  pendingJsonRequests.set(key, request);
  try {
    return await request;
  } finally {
    if (pendingJsonRequests.get(key) === request) pendingJsonRequests.delete(key);
  }
}

export const getAnalyticsSummary = (filters) => getJson("/api/analytics/summary", filters);
export const getAnalyticsHistory = (filters) => getJson("/api/analytics/history", filters);
export const getCropAnalytics = (filters) => getJson("/api/analytics/crops", filters);
export const getSeasonAnalytics = (filters) => getJson("/api/analytics/seasons", filters);
export const getAnalyticsDashboard = (filters) => getJson("/api/analytics/dashboard", filters);
export const getReportSummary = (filters) => getJson("/api/reports/summary", filters);

export async function downloadPdfReport(filters) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== "" && value !== undefined && value !== null)
  );
  const response = await fetch(`${API_BASE_URL}/api/reports/pdf?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("PDF report is unavailable.");
  return response.blob();
}
