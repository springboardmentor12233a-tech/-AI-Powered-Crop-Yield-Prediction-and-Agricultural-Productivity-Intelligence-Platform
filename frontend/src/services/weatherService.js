const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

const WEATHER_DESCRIPTIONS = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Light rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

async function requestJson(url, errorMessage) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(errorMessage);
  return response.json();
}

export async function getCoordinates({ state, district }) {
  const query = district || state;
  if (!query) throw new Error("Unable to find weather data for this location.");
  const params = new URLSearchParams({ name: query, count: "10", language: "en", format: "json", countryCode: "IN" });
  const data = await requestJson(`${GEOCODING_URL}?${params}`, "Unable to find weather data for this location.");
  const results = data.results || [];
  const normalizedState = state?.toLowerCase().replace(/\s+/g, " ");
  const result = results.find((item) => item.admin1?.toLowerCase() === normalizedState) || results[0];
  if (!result) throw new Error("Unable to find weather data for this location.");
  return { latitude: result.latitude, longitude: result.longitude, name: result.name, admin1: result.admin1 || state };
}

export async function getCurrentWeather({ latitude, longitude }) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,apparent_temperature,weather_code",
    daily: "precipitation_probability_max",
    forecast_days: "1",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timezone: "auto",
  });
  const data = await requestJson(`${WEATHER_URL}?${params}`, "Weather data is temporarily unavailable.");
  const current = data.current;
  if (!current) throw new Error("Weather data is temporarily unavailable.");
  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    precipitation: current.precipitation,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    precipitationProbability: data.daily?.precipitation_probability_max?.[0] ?? null,
    weatherCode: current.weather_code,
    condition: WEATHER_DESCRIPTIONS[current.weather_code] || "Weather conditions unavailable",
    lastUpdated: new Date().toISOString(),
    latitude,
    longitude,
  };
}

export async function fetchWeather(location) {
  const coordinates = await getCoordinates(location);
  const weather = await getCurrentWeather(coordinates);
  return { ...weather, location: coordinates };
}
