export interface YieldInput {
  Crop: string;
  Region: string;
  Soil_Type: string;
  Soil_pH: number;
  Rainfall_mm: number;
  Temperature_C: number;
  Humidity_pct: number;
  Fertilizer_Used_kg: number;
  Irrigation: string;
  Pesticides_Used_kg: number;
  Planting_Density: number;
  Previous_Crop: string;
  farm_id?: string;
  plot_label?: string;
}

export interface InsightItem {
  type: 'MODEL PREDICTION' | 'DATA-DRIVEN INSIGHT' | 'GENERAL AGRICULTURAL GUIDANCE' | 'RISK ALERT';
  title: string;
  description: string;
  confidence_level?: string;
  alternative_options?: string[];
}

export interface MultiTierInsights {
  model_predictions: InsightItem[];
  data_driven_insights: InsightItem[];
  general_guidance: InsightItem[];
  risk_alerts: InsightItem[];
}

export interface YieldPredictionResponse {
  predicted_yield_ton_per_ha: number;
  model_version: string;
  algorithm: string;
  status: string;
  confidence_metric: string;
  insights: MultiTierInsights;
}

export interface RecommendationInput {
  Temperature: number;
  Humidity: number;
  pH: number;
  Rainfall: number;
}

export interface CropCandidate {
  crop: string;
  confidence: number;
  confidence_pct: string;
}

export interface SoilPhAnalysis {
  ph: number;
  category: string;
  guidance: string;
  recommended_crops: string[];
}

export interface RecommendationResponse {
  recommended_crop: string;
  confidence: number;
  confidence_pct: string;
  top_candidates: CropCandidate[];
  soil_ph_analysis: SoilPhAnalysis;
  model_version: string;
  algorithm: string;
  status: string;
}

export interface CropClimateProfile {
  opt_temp_range: string;
  avg_temp: number;
  opt_humidity_range: string;
  avg_humidity: number;
  opt_rainfall_range: string;
  avg_rainfall: number;
}

export interface WeatherAnalyticsSummary {
  crop_recommendation_weather: {
    temperature: { min: number; max: number; mean: number; std: number };
    humidity: { min: number; max: number; mean: number; std: number };
    rainfall: { min: number; max: number; mean: number; std: number };
  };
  yield_forecasting_weather: {
    temperature_c: { min: number; max: number; mean: number };
    humidity_pct: { min: number; max: number; mean: number };
    rainfall_mm: { min: number; max: number; mean: number };
  };
  crop_climatic_profiles: Record<string, CropClimateProfile>;
}

export interface SoilTextureStats {
  record_count: number;
  avg_yield_ton_ha: number;
  min_yield: number;
  max_yield: number;
  crops_grown: string[];
}

export interface SoilAnalyticsSummary {
  crop_recommendation_ph_stats: { min: number; max: number; mean: number; std: number };
  yield_dataset_ph_stats: { min: number; max: number; mean: number; std: number };
  soil_texture_performance: Record<string, SoilTextureStats>;
  crop_soil_interaction: Record<string, Record<string, number>>;
}

export interface PredictionReportResponse {
  report_id: string;
  generated_at: string;
  farm_details: {
    farm_id: string;
    plot_label: string;
    region: string;
  };
  agronomic_inputs: {
    crop_selected: string;
    soil_texture: string;
    soil_ph: number;
    soil_classification: string;
    temperature_c: number;
    humidity_pct: number;
    rainfall_mm: number;
    fertilizer_applied_kg: number;
    pesticides_applied_kg: number;
    planting_density: number;
    irrigation_method: string;
    preceding_crop: string;
  };
  forecast_results: {
    predicted_yield_ton_per_ha: number;
    model_version: string;
    confidence_metric: string;
    top_recommended_alternatives: Array<{ crop: string; confidence_pct: string }>;
  };
  insights_summary: MultiTierInsights;
  formatted_markdown: string;
}
