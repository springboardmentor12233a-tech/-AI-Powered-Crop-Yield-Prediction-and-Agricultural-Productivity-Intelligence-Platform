import { API_BASE_URL } from "./apiConfig";

function getAuthHeaders(headers = {}) {
  const token = localStorage.getItem("yieldsense-auth-token");
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

export async function generateRecommendations(context) {
  const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(context),
  });

  if (!response.ok) {
    throw new Error("Recommendation request failed.");
  }

  return response.json();
}
