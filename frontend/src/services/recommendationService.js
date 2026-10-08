const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

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

