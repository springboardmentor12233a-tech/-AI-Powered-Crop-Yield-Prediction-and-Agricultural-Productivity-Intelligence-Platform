export interface FarmerProfile {
  id: number;
  email: string;
  full_name: string;
  role?: 'farmer' | 'admin';
  is_active?: number;
  phone?: string;
  village?: string;
  district?: string;
  state?: string;
  onboarding_completed?: number;
  created_at?: string;
  prediction_count?: number;
  recommendation_count?: number;
}

export interface FarmDetails {
  id?: number;
  user_id?: number;
  field_name: string;
  land_size: number;
  land_unit: 'Acres' | 'Hectares';
  soil_type: 'Sandy' | 'Loam' | 'Clay';
  irrigation_method: 'Sprinkler' | 'Flood' | 'Drip' | 'Unknown';
}

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
  field_name?: string;
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

export interface RecommendationResult {
  id?: number;
  recommended_crop: string;
  confidence: number;
  confidence_pct: string;
  top_candidates: CropCandidate[];
  soil_ph_analysis: {
    ph: number;
    category: string;
    guidance: string;
    recommended_crops?: string[];
  };
  model_version?: string;
  algorithm?: string;
  created_at?: string;
}

export interface RiskFactor {
  factor: string;
  severity: 'Low' | 'Moderate' | 'High';
  description: string;
}

export interface RiskAssessment {
  overall_risk: 'Low' | 'Moderate' | 'High';
  risk_score: number;
  summary: string;
  color_badge: string;
  risk_factors: RiskFactor[];
}

export interface LLMReportInsight {
  source: string;
  content: string;
  is_llm: boolean;
}

export interface YieldResult {
  report_id: string;
  predicted_yield_ton_per_ha: number;
  model_version: string;
  algorithm: string;
  confidence_metric: string;
  risk_assessment?: RiskAssessment;
  llm_insights?: LLMReportInsight;
  insights: {
    model_predictions?: Array<{ title: string; description: string; type?: string; confidence_level?: string }>;
    data_driven_insights?: Array<{ title: string; description: string; type?: string }>;
    general_guidance?: Array<{ title: string; description: string; type?: string }>;
    risk_alerts?: Array<{ title: string; description: string; type?: string }>;
  };
}

export interface SavedReport {
  id: number;
  user_id: number;
  report_id: string;
  crop: string;
  region: string;
  soil_type: string;
  soil_ph: number;
  rainfall_mm: number;
  temperature_c: number;
  humidity_pct: number;
  fertilizer_kg: number;
  irrigation: string;
  pesticides_kg: number;
  planting_density: number;
  previous_crop: string;
  predicted_yield: number;
  field_name: string;
  risk_assessment?: RiskAssessment;
  llm_insights?: LLMReportInsight;
  insights: {
    model_predictions?: Array<{ title: string; description: string }>;
    data_driven_insights?: Array<{ title: string; description: string }>;
    general_guidance?: Array<{ title: string; description: string }>;
    risk_alerts?: Array<{ title: string; description: string }>;
  };
  created_at: string;
}

export interface SavedRecommendation {
  id: number;
  user_id: number;
  recommended_crop: string;
  confidence: number;
  confidence_pct: string;
  temperature_c: number;
  humidity_pct: number;
  soil_ph: number;
  rainfall_mm: number;
  top_candidates: CropCandidate[];
  soil_analysis: {
    ph: number;
    category: string;
    guidance: string;
  };
  created_at: string;
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
  crop_climatic_profiles: Record<
    string,
    {
      opt_temp_range: string;
      avg_temp: number;
      opt_humidity_range: string;
      avg_humidity: number;
      opt_rainfall_range: string;
      avg_rainfall: number;
    }
  >;
}

export interface SoilAnalyticsSummary {
  crop_recommendation_ph_stats: { min: number; max: number; mean: number; std: number };
  yield_dataset_ph_stats: { min: number; max: number; mean: number; std: number };
  soil_texture_performance: Record<
    string,
    {
      record_count: number;
      avg_yield_ton_ha: number;
      min_yield: number;
      max_yield: number;
      crops_grown: string[];
    }
  >;
  crop_soil_interaction: Record<string, Record<string, number>>;
}

export interface LLMConfig {
  id?: number;
  provider: string;
  model_name: string;
  masked_key?: string;
  has_key?: boolean;
  is_active: number | boolean;
  updated_at?: string;
}

export interface AdminSystemStats {
  total_farmers: number;
  active_farmers: number;
  total_predictions: number;
  total_recommendations: number;
  top_forecasted_crops: Array<{ crop: string; count: number }>;
  top_recommended_crops: Array<{ crop: string; count: number }>;
  recent_activity: Array<{
    id: number;
    report_id: string;
    crop: string;
    predicted_yield: number;
    created_at: string;
    farmer_name: string;
    farmer_email: string;
    activity_type: string;
  }>;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}
