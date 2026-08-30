"use client";
import { useState } from 'react';

export default function Dashboard() {
  const [formData, setFormData] = useState({ rainfall: 1200, temperature: 28, pesticide: 45, area: 12 });
  const [prediction, setPrediction] = useState<number | null>(null);

  const fetchPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Paste your active token here
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYXJtZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3ODgwOTQ5NzN9.cTII7U0a27SzrOnv3cK-VIAhxuN1221CpFg-6U7CahU"; 

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setPrediction(data.predicted_crop_yield);
      } else {
        console.error("Failed to fetch prediction");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">YieldSense Predictor</h1>
        
        <form onSubmit={fetchPrediction} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Rainfall (mm)</label>
            <input type="number" value={formData.rainfall} onChange={e => setFormData({...formData, rainfall: +e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
            <input type="number" value={formData.temperature} onChange={e => setFormData({...formData, temperature: +e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pesticide (tonnes)</label>
            <input type="number" value={formData.pesticide} onChange={e => setFormData({...formData, pesticide: +e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Area (hectares)</label>
            <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: +e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
          </div>
          
          <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition">
            Predict Yield
          </button>
        </form>

        {prediction !== null && (
          <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded text-center font-bold">
            Predicted Yield: {prediction} tons/hectare
          </div>
        )}
      </div>
    </div>
  );
}