// Thresholds are broad screening ranges for agronomic triage, not fertilizer prescriptions.
export const soilThresholds = {
  nitrogen: { low: 40, adequate: 80, unit: "mg/kg" },
  phosphorus: { low: 15, adequate: 30, unit: "mg/kg" },
  potassium: { low: 40, adequate: 80, unit: "mg/kg" },
  ph: { stronglyAcidic: 5.5, slightlyAcidic: 6.5, neutral: 7.5, stronglyAlkaline: 8.5, unit: "pH" },
  organicCarbon: { low: 0.5, adequate: 0.75, unit: "%" },
  electricalConductivity: { adequate: 1, high: 2, unit: "dS/m" },
};

export const cropRequirements = {
  Rice: { ph: [5.5, 7.5], label: "Rice typically performs across slightly acidic to neutral soils." },
  Wheat: { ph: [6, 7.5], label: "Wheat generally prefers near-neutral, well-drained soil." },
  Maize: { ph: [5.8, 7], label: "Maize generally prefers slightly acidic to neutral soil." },
  Cotton: { ph: [5.5, 8], label: "Cotton tolerates a broad pH range with good drainage." },
};


const parameterLabels = {
  ph: "Soil pH",
  moisture: "Soil moisture",
  nitrogen: "Total Nitrogen",
  phosphorus: "Phosphorus",
  potassium: "Potassium",
};

export const cropSoilRules = {
  Rice: { ph: [5.5, 7.0], moisture: [60, 85], nitrogen: [40, 80], phosphorus: [15, 35], potassium: [40, 80] },
  Wheat: { ph: [6.0, 7.5], moisture: [45, 70], nitrogen: [40, 80], phosphorus: [15, 35], potassium: [40, 80] },
  Corn: { ph: [5.8, 7.0], moisture: [50, 75], nitrogen: [45, 85], phosphorus: [20, 40], potassium: [45, 85] },
  Barley: { ph: [6.0, 7.5], moisture: [40, 65], nitrogen: [35, 75], phosphorus: [15, 35], potassium: [35, 75] },
  Soybean: { ph: [6.0, 7.5], moisture: [50, 75], nitrogen: [30, 70], phosphorus: [20, 40], potassium: [45, 85] },
};

const units = { ph: "pH", moisture: "%", nitrogen: "mg/kg", phosphorus: "mg/kg", potassium: "mg/kg" };

function numberValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function classifyParameter(name, value, crop = "Rice") {
  const number = numberValue(value);
  if (number === null) return { label: "Data unavailable", tone: "neutral", value: null, unit: units[name] };
  if (name === "nitrogen") return { label: "Recorded", tone: "neutral", value: number, unit: units[name], definition: "Total nitrogen; available-nitrogen thresholds are not applicable." };
  const range = cropSoilRules[crop]?.[name];
  if (!range) return { label: "Data unavailable", tone: "neutral", value: number, unit: units[name] };
  const margin = name === "ph" ? 0.8 : Math.max((range[1] - range[0]) * 0.5, 10);
  const warning = [range[0] - margin, range[1] + margin];
  if (number >= range[0] && number <= range[1]) return { label: "Suitable", tone: "green", value: number, unit: units[name] };
  if (number >= warning[0] && number <= warning[1]) return { label: "Warning", tone: "amber", value: number, unit: units[name] };
  return { label: "Critical", tone: "red", value: number, unit: units[name] };
}

export function analyzeSoil(parameters = {}, crop = "Rice") {
  const names = Object.keys(parameterLabels);
  const statuses = Object.fromEntries(names.map((name) => [name, classifyParameter(name, parameters[name], crop)]));
  const warnings = Object.entries(statuses).filter(([, status]) => status.label === "Warning" || status.label === "Critical").map(([name, status]) => `${parameterLabels[name]} is ${status.label.toLowerCase()} at ${status.value} ${status.unit}.`);
  const recommendations = Object.entries(statuses).filter(([, status]) => status.label === "Warning" || status.label === "Critical").map(([name]) => `${parameterLabels[name]} needs attention for ${crop}; follow a verified soil-test or agronomist action plan.`);
  const available = Object.values(statuses).filter(({ value }) => value !== null);
  const health = !available.length ? "Insufficient Data" : available.some(({ label }) => label === "Critical") ? "Critical" : warnings.length ? "Needs Attention" : "Good";
  const suitability = !available.length ? "Insufficient Data" : health === "Critical" ? "Critical" : warnings.length ? "Needs attention" : "Suitable";
  return { statuses, warnings, recommendations, suitability, health, availableCount: available.length, cropNote: `${crop}-specific screening ranges are applied to each available measurement.` };
}
