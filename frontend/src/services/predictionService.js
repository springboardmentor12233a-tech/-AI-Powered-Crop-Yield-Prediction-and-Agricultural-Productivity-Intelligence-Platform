const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function predictYield(payload) {
  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Yield prediction request failed.");
  }

  return response.json();
}

export const predictionPreview = { yield: 4.27, unit: "t/ha", isPreview: true };
