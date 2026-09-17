import { getCoordinates } from "./weatherService";

const SOILGRIDS_SOURCE_URL = "https://isric.org/explore/soilgrids";
const SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query";

const EMPTY_PARAMETERS = {
  ph: null,
  moisture: null,
  nitrogen: null,
  phosphorus: null,
  potassium: null,
};

function soilDataStorageKey(location) {
  return `yieldsense-soil-data:${location.state}:${location.district}`.toLowerCase();
}

function propertyValue(data, property) {
  return data?.properties?.layers?.find((layer) => layer.name === property)?.depths?.[0]?.values?.mean ?? null;
}

export async function getSoilData(location) {
  const parameters = { ...EMPTY_PARAMETERS };
  let requestFailed = false;
  let coordinates = location;
  if (coordinates?.latitude === undefined || coordinates?.longitude === undefined) {
    try {
      coordinates = await getCoordinates(location);
    } catch {
      coordinates = null;
    }
  }
  const source = coordinates?.latitude !== undefined && coordinates?.longitude !== undefined
    ? `${SOILGRIDS_URL}?${new URLSearchParams([['lon', String(coordinates.longitude)], ['lat', String(coordinates.latitude)], ['property', 'phh2o'], ['property', 'nitrogen'], ['depth', '0-5cm'], ['value', 'mean']])}`
    : null;

  if (source) {
    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error("SoilGrids request failed.");
      const data = await response.json();
      const phValue = propertyValue(data, "phh2o");
      const nitrogenValue = propertyValue(data, "nitrogen");
      parameters.ph = phValue === null ? null : phValue / 10;
      parameters.nitrogen = nitrogenValue === null ? null : nitrogenValue * 10;
    } catch {
      requestFailed = true;
    }
  }

  const verified = loadVerifiedSoilTest(location);
  const result = {
    location: { state: location?.state, district: location?.district },
    coordinates: coordinates?.latitude !== undefined && coordinates?.longitude !== undefined
      ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
      : null,
    source: verified ? "User-provided verified soil test" : source ? "SoilGrids / ISRIC" : "SoilGrids / ISRIC unavailable",
    sourceUrl: SOILGRIDS_SOURCE_URL,
    dataType: requestFailed ? "Soil data temporarily unavailable" : verified ? "User-provided verified soil test" : Object.values(parameters).some((value) => value !== null) ? "Location-based SoilGrids data" : "Data unavailable",
    parameters: verified ? { ...parameters, ...verified } : parameters,
    depth: "0-5cm",
    isReference: false,
  };
  saveSoilData(location, result);
  return result;
}

export function soilStorageKey(location) {
  return `yieldsense-soil-test:${location.state}:${location.district}`.toLowerCase();
}

export function loadSoilTest(location) {
  const saved = loadVerifiedSoilTest(location);
  if (saved) return saved;
  return loadSoilData(location)?.parameters || null;
}

export function loadVerifiedSoilTest(location) {
  const saved = localStorage.getItem(soilStorageKey(location));
  return saved ? JSON.parse(saved) : null;
}

export function saveSoilTest(location, parameters) {
  localStorage.setItem(soilStorageKey(location), JSON.stringify(parameters));
  return parameters;
}

export function loadSoilData(location) {
  const saved = localStorage.getItem(soilDataStorageKey(location));
  return saved ? JSON.parse(saved) : null;
}

export function saveSoilData(location, data) {
  localStorage.setItem(soilDataStorageKey(location), JSON.stringify(data));
  return data;
}
