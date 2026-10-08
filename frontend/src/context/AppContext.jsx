/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { getWeatherAnalysis, getSoilAnalysis, getLLMInsights, getAgriculturalReport } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [recentPrediction, setRecentPrediction] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  
  const [reportState, setReportState] = useState({
    status: 'idle',
    signature: null,
    data: null,
    error: null
  });
  const reportInFlightRef = useRef(null);

  const fetchReport = useCallback(async (prediction) => {
    if (!prediction) return;
    const signature = JSON.stringify(prediction.input);
    
    if (reportInFlightRef.current === signature) return;
    reportInFlightRef.current = signature;
    
    setReportState(prev => ({ ...prev, status: 'loading', signature, error: null }));
    
    try {
      const result = await getAgriculturalReport(prediction.input);
      setReportState({ status: 'success', signature, data: result, error: null });
    } catch (e) {
      setReportState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: e.response?.data?.detail || "Failed to generate report" 
      }));
      reportInFlightRef.current = null;
    }
  }, []);

  const [analysisState, setAnalysisState] = useState({
    status: 'idle', // idle, loading, success, error
    signature: null,
    weatherData: null,
    soilData: null,
    insightsData: null,
    llmError: false
  });

  const analysisInFlightRef = useRef(null);

  const fetchAnalysis = useCallback(async (prediction, forceRetry = false) => {
    if (!prediction || !prediction.id) return;

    // Deduplicate strictly by prediction ID
    const signature = prediction.id.toString();

    // If we're already fetching this exact prediction ID, do nothing.
    if (!forceRetry && analysisInFlightRef.current === signature) {
      return;
    }

    analysisInFlightRef.current = signature;
    setAnalysisState(prev => ({
      ...prev,
      status: 'loading',
      signature,
      llmError: false
    }));

    try {
      const { input } = prediction;
      
      // Fire weather and soil independently and update context immediately upon success
      getWeatherAnalysis(input)
        .then(weather => setAnalysisState(prev => ({ ...prev, weatherData: weather })))
        .catch(() => setAnalysisState(prev => ({ ...prev, weatherData: null })));
        
      getSoilAnalysis(input)
        .then(soil => setAnalysisState(prev => ({ ...prev, soilData: soil })))
        .catch(() => setAnalysisState(prev => ({ ...prev, soilData: null })));
      
      let insights = null;
      let llmError = false;
      try {
        insights = await getLLMInsights(input);
      } catch (err) {
        console.error("LLM Insights Error:", err);
        llmError = true;
      }

      setAnalysisState(prev => ({
        ...prev,
        status: 'success',
        insightsData: insights,
        llmError
      }));
    } catch {
      setAnalysisState(prev => ({
        ...prev,
        status: 'error'
      }));
      analysisInFlightRef.current = null; // allow retry on total failure
    }
  }, []);

  const retryInsights = useCallback(async () => {
    if (!recentPrediction) return;
    setAnalysisState(prev => ({ ...prev, status: 'loading', llmError: false }));
    try {
      const insights = await getLLMInsights(recentPrediction.input);
      setAnalysisState(prev => ({ ...prev, status: 'success', insightsData: insights, llmError: false }));
    } catch {
      setAnalysisState(prev => ({ ...prev, status: 'success', llmError: true }));
    }
  }, [recentPrediction]);

  return (
    <AppContext.Provider value={{
      recentPrediction,
      setRecentPrediction,
      predictionHistory,
      setPredictionHistory,
      reportState,
      fetchReport,
      analysisState,
      fetchAnalysis,
      retryInsights
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
