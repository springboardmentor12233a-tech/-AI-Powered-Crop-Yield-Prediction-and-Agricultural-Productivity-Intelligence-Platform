const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function getJson(path, params = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "" && value !== undefined && value !== null));
  const response = await fetch(`${API_BASE_URL}${path}${query.toString() ? `?${query}` : ""}`);
  if (!response.ok) throw new Error("Analytics service is unavailable.");
  return response.json();
}

export const getAnalyticsSummary = (filters) => getJson("/api/analytics/summary", filters);
export const getAnalyticsHistory = (filters) => getJson("/api/analytics/history", filters);
export const getCropAnalytics = (filters) => getJson("/api/analytics/crops", filters);
export const getSeasonAnalytics = (filters) => getJson("/api/analytics/seasons", filters);
export const getReportSummary = (filters) => getJson("/api/reports/summary", filters);

export async function downloadPdfReport(filters) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const response = await fetch(`${API_BASE_URL}/api/reports/pdf?${query}`);
  if (!response.ok) throw new Error("PDF report is unavailable.");
  return response.blob();
}
