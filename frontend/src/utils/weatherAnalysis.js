const baseWeather = {
  temperature: { suitable: [18, 32], warning: [12, 38], unit: "°C" },
  rainfall: { suitable: [2, 25], warning: [0, 50], unit: "mm" },
  humidity: { suitable: [45, 80], warning: [30, 90], unit: "%" },
  windSpeed: { suitable: [0, 20], warning: [0, 35], unit: "km/h" },
  precipitationProbability: { suitable: [20, 70], warning: [0, 90], unit: "%" },
};

export const cropWeatherRules = {
  Rice: {
    temperature: { suitable: [20, 35], warning: [15, 40], unit: "°C" },
    rainfall: { suitable: [5, 35], warning: [1, 70], unit: "mm" },
    humidity: { suitable: [60, 90], warning: [40, 95], unit: "%" },
    windSpeed: { suitable: [0, 18], warning: [0, 30], unit: "km/h" },
    precipitationProbability: { suitable: [30, 80], warning: [10, 95], unit: "%" },
  },
  Wheat: {
    temperature: { suitable: [10, 25], warning: [5, 32], unit: "°C" },
    rainfall: { suitable: [1, 15], warning: [0, 35], unit: "mm" },
    humidity: { suitable: [40, 70], warning: [25, 85], unit: "%" },
    windSpeed: { suitable: [0, 20], warning: [0, 35], unit: "km/h" },
    precipitationProbability: { suitable: [10, 55], warning: [0, 80], unit: "%" },
  },
  Corn: {
    temperature: { suitable: [18, 32], warning: [12, 38], unit: "°C" },
    rainfall: { suitable: [3, 25], warning: [0, 50], unit: "mm" },
    humidity: { suitable: [50, 80], warning: [30, 90], unit: "%" },
    windSpeed: { suitable: [0, 20], warning: [0, 35], unit: "km/h" },
    precipitationProbability: { suitable: [20, 70], warning: [0, 90], unit: "%" },
  },
  Barley: {
    temperature: { suitable: [12, 25], warning: [5, 32], unit: "°C" },
    rainfall: { suitable: [1, 15], warning: [0, 35], unit: "mm" },
    humidity: { suitable: [40, 70], warning: [25, 85], unit: "%" },
    windSpeed: { suitable: [0, 20], warning: [0, 35], unit: "km/h" },
    precipitationProbability: { suitable: [10, 55], warning: [0, 80], unit: "%" },
  },
  Soybean: {
    temperature: { suitable: [20, 30], warning: [15, 35], unit: "°C" },
    rainfall: { suitable: [3, 25], warning: [0, 50], unit: "mm" },
    humidity: { suitable: [50, 80], warning: [30, 90], unit: "%" },
    windSpeed: { suitable: [0, 18], warning: [0, 30], unit: "km/h" },
    precipitationProbability: { suitable: [20, 70], warning: [0, 90], unit: "%" },
  },
};

function classify(value, rule) {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) {
    return { label: "Data unavailable", tone: "neutral", value: null, unit: rule.unit };
  }
  const number = Number(value);
  if (number >= rule.suitable[0] && number <= rule.suitable[1]) return { label: "Suitable", tone: "green", value: number, unit: rule.unit };
  if (number >= rule.warning[0] && number <= rule.warning[1]) return { label: "Warning", tone: "amber", value: number, unit: rule.unit };
  return { label: "Critical", tone: "red", value: number, unit: rule.unit };
}

export function analyzeWeather(weather, crop = "Rice") {
  const rules = cropWeatherRules[crop] || baseWeather;
  const values = {
    temperature: weather?.temperature,
    rainfall: weather?.precipitation,
    humidity: weather?.humidity,
    windSpeed: weather?.windSpeed,
    precipitationProbability: weather?.precipitationProbability,
  };
  const parameters = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, classify(value, rules[name])]));
  const risks = Object.entries(parameters).filter(([, result]) => result.label === "Warning" || result.label === "Critical").map(([name, result]) => `${name} is ${result.label.toLowerCase()} at ${result.value} ${result.unit}.`);
  return { crop, parameters, risks, availableCount: Object.values(parameters).filter(({ value }) => value !== null).length };
}
