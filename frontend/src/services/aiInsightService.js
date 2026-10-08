import { API_BASE_URL } from "./apiConfig";

export async function generateAIInsights(context) {
  const token = localStorage.getItem("yieldsense-auth-token");
  const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(context),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Unable to generate AI insights.");
  }
  return response.json();
}
