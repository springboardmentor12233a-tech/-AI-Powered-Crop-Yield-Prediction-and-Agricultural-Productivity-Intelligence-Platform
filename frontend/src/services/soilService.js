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

function currentUserScope() {
  try {
    const user = JSON.parse(localStorage.getItem("yieldsense-user") || "null");
    return user?.id || "anonymous";
  } catch {
    return "anonymous";
  }
}

function soilDataStorageKey(location) {
  return `yieldsense-soil-data:${currentUserScope()}:${location.state}:${location.district}`.toLowerCase();
}

function propertyValue(data, property) {
  return data?.properties?.layers?.find((layer) => layer.name === property)?.depths?.[0]?.values?.mean ?? null;
}

export async function getSoilData(location) {
  const parameters = { ...EMPTY_PARAMETERS };
  if (!location?.state?.trim() || !location?.district?.trim()) {
    return saveSoilData(location, {
      location: { state: location?.state || "", district: location?.district || "" },
      coordinates: null,
      source: "SoilGrids / ISRIC",
      sourceUrl: SOILGRIDS_SOURCE_URL,
      dataType: location?.state
        ? "Select a district to check SoilGrids coverage"
        : "Set a farm location to check SoilGrids coverage",
      parameters,
      depth: "0-5cm",
      fetchedAt: Date.now(),
      isReference: true,
    });
  }

  const cached = loadSoilData(location);
  const cacheAge = cached?.fetchedAt ? Date.now() - cached.fetchedAt : Infinity;
  if (cacheAge < 24 * 60 * 60 * 1000) return cached;

  let requestFailed = false;
  let coordinatesUnavailable = false;
  let coordinates = cached?.coordinates || location;
  if (coordinates?.latitude === undefined || coordinates?.longitude === undefined) {
    try {
      coordinates = await getCoordinates(location);
    } catch {
      coordinates = null;
      coordinatesUnavailable = true;
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
  const hasValues = Object.values(parameters).some((value) => value !== null);

  const result = {
    location: { state: location?.state, district: location?.district },
    coordinates: coordinates?.latitude !== undefined && coordinates?.longitude !== undefined
      ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
      : null,
    source: verified ? "Farmer-entered soil test" : source ? "SoilGrids / ISRIC" : "SoilGrids / ISRIC",
    sourceUrl: SOILGRIDS_SOURCE_URL,
    dataType: verified
      ? "Farmer-entered soil test"
      : requestFailed
        ? "SoilGrids could not be reached"
        : coordinatesUnavailable
          ? "Location coordinates could not be resolved"
          : hasValues
            ? "Location-based gridded reference data"
            : source
              ? "No SoilGrids values are modeled at these coordinates"
              : "Set a farm location to check SoilGrids coverage",
    parameters: verified ? { ...parameters, ...verified } : parameters,
    depth: "0-5cm",
    fetchedAt: Date.now(),
    isReference: !verified,
  };
  saveSoilData(location, result);
  return result;
}

export function soilStorageKey(location) {
  return `yieldsense-soil-test:${currentUserScope()}:${location.state}:${location.district}`.toLowerCase();
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
