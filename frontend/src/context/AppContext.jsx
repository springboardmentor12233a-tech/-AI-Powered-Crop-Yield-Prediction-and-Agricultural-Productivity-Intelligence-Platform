import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { getWeatherAnalysis, getSoilAnalysis, getLLMInsights, getAgriculturalReport } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [recentPrediction, setRecentPrediction] = useState(null);
  
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
    if (!prediction) return;

    const signature = JSON.stringify(prediction.input);

    // If we're already fetching this exact signature, do nothing.
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
      
      const [weather, soil] = await Promise.all([
        getWeatherAnalysis(input).catch(() => null),
        getSoilAnalysis(input).catch(() => null)
      ]);
      
      let insights = null;
      let llmError = false;
      try {
        insights = await getLLMInsights(input);
      } catch (e) {
        llmError = true;
      }

      setAnalysisState({
        status: 'success',
        signature,
        weatherData: weather,
        soilData: soil,
        insightsData: insights,
        llmError
      });
    } catch (e) {
      setAnalysisState(prev => ({
        ...prev,
        status: 'error',
        signature
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
    } catch (e) {
      setAnalysisState(prev => ({ ...prev, status: 'success', llmError: true }));
    }
  }, [recentPrediction]);

  return (
    <AppContext.Provider value={{
      recentPrediction,
      setRecentPrediction,
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
