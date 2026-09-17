const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are an agricultural decision-support assistant. Analyze only the supplied crop, yield, weather, and soil data. Never invent missing values, never change or calculate the supplied predicted yield, and clearly state uncertainty when data is missing. Give practical, understandable recommendations relevant to the supplied crop and conditions. Avoid dangerous or highly specific chemical or pesticide instructions. Return valid JSON only with exactly these keys: summary (string), yield_outlook (Low | Moderate | Good | Excellent), weather_risk (Low | Medium | High), soil_status (Poor | Fair | Good | Excellent | Insufficient Data), key_risks (array of strings), recommendations (array of strings).`;

const allowed = {
  yield_outlook: ["Low", "Moderate", "Good", "Excellent"],
  weather_risk: ["Low", "Medium", "High"],
  soil_status: ["Poor", "Fair", "Good", "Excellent", "Insufficient Data"],
};

function parseJson(content) {
  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object") throw new Error("Groq returned an invalid insight object.");
  if (typeof parsed.summary !== "string" || !Array.isArray(parsed.key_risks) || !Array.isArray(parsed.recommendations)) throw new Error("Groq returned incomplete insight data.");
  return {
    summary: parsed.summary,
    yield_outlook: allowed.yield_outlook.includes(parsed.yield_outlook) ? parsed.yield_outlook : "Moderate",
    weather_risk: allowed.weather_risk.includes(parsed.weather_risk) ? parsed.weather_risk : "Medium",
    soil_status: allowed.soil_status.includes(parsed.soil_status) ? parsed.soil_status : "Insufficient Data",
    key_risks: parsed.key_risks.filter((item) => typeof item === "string"),
    recommendations: parsed.recommendations.filter((item) => typeof item === "string"),
  };
}

export async function generateAIInsights(context) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key is not configured. Add VITE_GROQ_API_KEY to frontend/.env.");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: JSON.stringify(context) }],
    }),
  });

  if (!response.ok) throw new Error("Unable to generate AI insights from Groq.");
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned no insight content.");
  return parseJson(content);
}
