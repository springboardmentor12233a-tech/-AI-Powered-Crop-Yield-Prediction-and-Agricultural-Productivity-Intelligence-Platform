const DEFAULT_API_BASE_URL = "https://ai-powered-crop-yield-prediction-and-uido.onrender.com";
const DEVELOPMENT_API_BASE_URL = "http://127.0.0.1:8000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? DEVELOPMENT_API_BASE_URL : DEFAULT_API_BASE_URL)
).replace(/\/+$/, "");
