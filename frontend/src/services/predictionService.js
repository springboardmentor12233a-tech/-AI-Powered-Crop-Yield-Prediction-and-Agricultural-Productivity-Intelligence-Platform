const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function getAuthHeaders(headers = {}) {
  const token = localStorage.getItem("yieldsense-auth-token");
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

export async function predictYield(payload) {
  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Yield prediction request failed.");
  }

  return response.json();
}

export async function getPredictionOptions() {
  const response = await fetch(`${API_BASE_URL}/api/prediction/options`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Prediction input options are unavailable.");
  }
  return response.json();
}
