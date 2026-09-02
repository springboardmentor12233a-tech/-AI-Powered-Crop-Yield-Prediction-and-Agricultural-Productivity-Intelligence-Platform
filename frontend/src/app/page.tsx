"use client";
import { useState, useEffect } from "react";
import { LayoutDashboard, Leaf, Database, Map as MapIcon, Sparkles, Trash2 } from "lucide-react";

export default function YieldSenseApp() {
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- DASHBOARD STATE ---
  const [activeTab, setActiveTab] = useState("overview");
  
  // --- DYNAMIC TIME STATE ---
  const [timeData, setTimeData] = useState({
    date: "WEDNESDAY, 2 SEPTEMBER 2026", 
    greeting: "Good afternoon"
  });

  useEffect(() => {
    // Automatically updates to the user's real-world time and date
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-GB', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    }).toUpperCase();
    
    const hours = date.getHours();
    let greet = "Good evening";
    if (hours < 12) greet = "Good morning";
    else if (hours < 18) greet = "Good afternoon";

    setTimeData({ date: formattedDate, greeting: greet });
  }, []);
  
  // --- FORECAST STATE ---
  const [isForecastGenerated, setIsForecastGenerated] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [forecastForm, setForecastForm] = useState({
    crop: "Maize", area: "5", rainfall: "820", temp: "25",
    nitrogen: "90", phosphorus: "50", potassium: "60", ph: "6.5"
  });

  // --- FIELD REGISTRY STATE ---
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ name: "", location: "", area: "", soil: "Loamy" });

  // --- HANDLERS ---
  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab("overview");
  };

  const handleGenerateForecast = (e) => {
    e.preventDefault();
    
    const conditions = {
      Maize: { temp: [18, 35], rain: [500, 1000], ph: [5.5, 7.5], baseYield: 4.5 },
      Rice: { temp: [20, 38], rain: [800, 2500], ph: [5.0, 7.0], baseYield: 5.2 },
      Wheat: { temp: [10, 30], rain: [400, 1000], ph: [6.0, 7.5], baseYield: 3.8 },
      Cotton: { temp: [20, 35], rain: [500, 1100], ph: [5.8, 8.0], baseYield: 2.1 },
      Millet: { temp: [20, 38], rain: [300, 700], ph: [5.5, 7.5], baseYield: 1.8 }
    };

    const reqs = conditions[forecastForm.crop] || conditions.Maize;
    const t = parseFloat(forecastForm.temp);
    const r = parseFloat(forecastForm.rainfall);
    const p = parseFloat(forecastForm.ph);
    const area = parseFloat(forecastForm.area) || 1;

    let stressFactors = 0;
    if (t < reqs.temp[0] || t > reqs.temp[1]) stressFactors++;
    if (r < reqs.rain[0] || r > reqs.rain[1]) stressFactors++;
    if (p < reqs.ph[0] || p > reqs.ph[1]) stressFactors++;

    let riskStatus, riskColor, riskMsg, confidence;
    let yieldMultiplier = 1;

    if (stressFactors === 0) {
      riskStatus = "Optimal / Good to Grow";
      riskColor = "bg-[#B5F140] text-[#12281C]"; 
      riskMsg = "Current conditions are perfectly balanced. Maintain regular crop scouting and standard nutrient schedules.";
      confidence = (94 + Math.random() * 4).toFixed(1);
    } else if (stressFactors === 1) {
      riskStatus = "Moderate Risk";
      riskColor = "bg-[#FFD166] text-[#12281C]"; 
      riskMsg = "Conditions are slightly outside optimal ranges. Monitor soil moisture and adjust fertilizers accordingly.";
      confidence = (85 + Math.random() * 5).toFixed(1);
      yieldMultiplier = 0.85; 
    } else {
      riskStatus = "High Risk";
      riskColor = "bg-[#EF476F] text-white"; 
      riskMsg = "Significant environmental stress detected. Consider immediate interventions or alternative crop selection.";
      confidence = (70 + Math.random() * 8).toFixed(1);
      yieldMultiplier = 0.55; 
    }

    const expectedPerAcre = reqs.baseYield * yieldMultiplier;
    let dynamicTotal = (expectedPerAcre * area);
    dynamicTotal = (dynamicTotal + (Math.random() * (dynamicTotal * 0.05))).toFixed(2);
    const dynamicPerAcre = (dynamicTotal / area).toFixed(2);
    
    setForecastResult({ 
      total: dynamicTotal, perAcre: dynamicPerAcre, crop: forecastForm.crop,
      riskStatus, riskColor, riskMsg, confidence
    });
    
    setIsForecastGenerated(true);
  };

  const handleRegisterField = (e) => {
    e.preventDefault();
    if (!newField.name || !newField.area) return;
    setFields([...fields, { ...newField }]);
    setNewField({ name: "", location: "", area: "", soil: "Loamy" });
  };

  const handleRemoveField = (indexToRemove) => {
    setFields(fields.filter((_, index) => index !== indexToRemove));
  };

  // ==========================================
  // VIEW 1: LOGIN SCREEN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex font-sans selection:bg-[#B5F140] selection:text-[#12281C]">
        <div className="w-1/2 bg-[#12281C] relative overflow-hidden flex flex-col justify-center p-20">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#B5F140] rounded-full opacity-90"></div>
          <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-[#2D5A3C] to-transparent opacity-50 transform skew-y-12 translate-y-20"></div>
          
          <div className="relative z-10 text-[#F4F2EB]">
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-16 text-[#8EA094]">Agricultural Intelligence / 01</p>
            <h1 className="text-7xl font-serif leading-[1.1] mb-6">Every field<br/>has a future.</h1>
            <p className="text-xl text-gray-300">Forecast it with confidence.</p>
          </div>
        </div>

        <div className="w-1/2 bg-[#F4F2EB] flex flex-col justify-center p-24">
          <div className="max-w-md w-full mx-auto">
            <div className="flex items-center text-xs font-black tracking-[0.2em] mb-16 uppercase text-[#12281C]">
              <span className="mr-2 text-lg leading-none">✦</span> YieldSense AI
            </div>
            
            <h2 className="text-5xl font-serif text-[#12281C] mb-4">Sign in to your fields</h2>
            <p className="text-gray-500 mb-10">Your growing season, made visible.</p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Full name</label>
                <input type="text" required defaultValue="Sanghavi S Avadhani" className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#12281C] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Email</label>
                <input type="email" required defaultValue="sanghavi@farm.com" className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#12281C] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Password</label>
                <input type="password" required defaultValue="password123" className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-[#12281C] bg-white" />
              </div>
              <button type="submit" className="w-full bg-[#12281C] text-white py-4 rounded-xl text-sm font-bold flex justify-center items-center space-x-2 hover:bg-black transition-colors mt-4">
                <span>Sign in</span> <span>&rarr;</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MAIN DASHBOARD
  // ==========================================
  const NavButton = ({ id, icon: Icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button 
        onClick={() => setActiveTab(id)} 
        className={`w-full flex items-center space-x-4 p-3 px-4 rounded-xl transition-all ${
          isActive ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-[#E4E0D1] text-[#12281C]" : "text-gray-500 hover:text-[#12281C]"
        }`}
      >
        <Icon size={18} strokeWidth={1.5} className={isActive ? "text-[#2D5A3C]" : ""} />
        <span className={`font-${isActive ? 'bold' : 'medium'} text-sm`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F2EB] text-[#12281C] flex font-sans selection:bg-[#B5F140] selection:text-[#12281C]">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 border-r border-[#E4E0D1] flex flex-col justify-between py-8 px-6 hidden md:flex">
        <div>
          <div className="flex items-center text-xs font-black tracking-[0.2em] mb-10 uppercase cursor-pointer" onClick={() => setActiveTab('overview')}>
            <span className="mr-2 text-lg leading-none">✦</span> YieldSense AI
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E4E0D1] mb-6 cursor-pointer hover:border-[#2D5A3C] transition-colors" onClick={() => setActiveTab('registry')}>
            <div className="flex items-center space-x-2 text-[9px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#B5F140]"></div>
              <span>Active Zone</span>
            </div>
            <p className="text-sm font-bold text-[#12281C] capitalize">{fields[0]?.name || "No fields yet"}</p>
          </div>

          <nav className="space-y-1">
            <NavButton id="overview" icon={LayoutDashboard} label="Overview" />
            <NavButton id="forecast" icon={Leaf} label="Yield Forecast" />
            <NavButton id="registry" icon={Database} label="Field Registry" />
            <NavButton id="system" icon={MapIcon} label="System Map" />
          </nav>
        </div>
        
        <div className="flex items-start space-x-3 pt-6 mt-8 border-t border-[#E4E0D1]">
          <div className="w-10 h-10 bg-[#12281C] text-[#F4F2EB] flex items-center justify-center rounded-full font-serif text-lg flex-shrink-0">
            S
          </div>
          <div className="text-left flex flex-col">
            <p className="text-sm font-bold leading-tight">Sanghavi S Avadhani</p>
            <p className="text-xs text-gray-500 mt-0.5">Farm operator</p>
            <button onClick={handleLogout} className="text-[10px] text-left text-gray-400 hover:text-black font-bold uppercase tracking-widest mt-3 transition-colors">
              Sign out ↗
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 max-w-6xl mx-auto overflow-y-auto">
        
        {/* ===================== OVERVIEW TAB ===================== */}
        {activeTab === "overview" && (
          <div className="animate-in fade-in duration-500">
            <header className="flex justify-between items-end mb-10">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.15em] text-gray-500 mb-3 uppercase">{timeData.date}</p>
                <h2 className="text-5xl font-serif tracking-tight text-[#12281C]">{timeData.greeting}, <span className="italic text-[#2D5A3C]">grower.</span></h2>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-bold text-[#12281C] tracking-[0.15em] uppercase mb-2">
                <div className="w-2 h-2 rounded-full bg-[#B5F140]"></div>
                <span>Systems Optimal</span>
              </div>
            </header>
            
            <div className="bg-[#EBE6D5] rounded-2xl p-10 flex justify-between items-center mb-8">
              <div className="max-w-lg">
                <p className="text-[11px] font-semibold tracking-[0.15em] text-gray-500 mb-4 uppercase">Seasonal Outlook / Kharif '26</p>
                <h3 className="text-4xl font-serif leading-tight mb-4 text-[#12281C]">Make your next harvest <br/><span className="italic text-[#2D5A3C]">count.</span></h3>
                <p className="text-sm text-[#4A5A50] mb-6">Local conditions are trending favorable. Your field intelligence is ready.</p>
                <button onClick={() => setActiveTab('forecast')} className="bg-[#12281C] text-white px-6 py-3.5 rounded-xl text-sm font-bold flex items-center space-x-2 hover:bg-black transition-colors">
                  <span>Run a forecast</span> <span>&rarr;</span>
                </button>
              </div>
              
              <div className="w-48 h-48 rounded-full bg-[#91B875] flex items-center justify-center p-4">
                <div className="w-full h-full rounded-full border border-[#749D56] bg-[#6A964D] flex items-center justify-center p-3">
                  <div className="w-full h-full rounded-full border border-dashed border-[#8CBA6F] bg-[#4B793E] flex flex-col items-center justify-center text-white shadow-inner">
                    <span className="text-5xl font-serif leading-none mb-1">78</span>
                    <span className="text-[9px] tracking-[0.2em] font-bold uppercase leading-tight text-center text-[#BEEA9B]">Weather<br/>Index</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E4E0D1]">
                <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 mb-5 uppercase">Projected Yield</p>
                <p className="text-[2.75rem] font-serif leading-none mb-3">3.72</p>
                <p className="text-xs text-gray-500">tonnes / acre <span className="text-[#2D5A3C] font-medium ml-1">↑ 8.4%</span></p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#E4E0D1]">
                <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 mb-5 uppercase">Soil Vitality</p>
                <p className="text-[2.75rem] font-serif leading-none mb-3">74</p>
                <p className="text-xs text-gray-500">of 100 <span className="text-[#2D5A3C] font-medium ml-1">Stable</span></p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-[#E4E0D1]">
                <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 mb-5 uppercase">Registered Fields</p>
                <p className="text-[2.75rem] font-serif leading-none mb-3">{fields.length}</p>
                <p className="text-xs text-gray-500">{fields.length === 0 ? "Add fields to track" : "Ready to analyze"}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===================== FORECAST TAB ===================== */}
        {activeTab === "forecast" && (
          <div className="animate-in fade-in duration-500">
             <header className="mb-10">
              <h2 className="text-5xl font-serif tracking-tight text-[#12281C] mb-3">Forecast a field</h2>
              <p className="text-sm text-gray-500">Turn local weather and soil readings into a practical harvest outlook.</p>
            </header>

            <div className="bg-[#EBE6D5] p-6 rounded-xl flex items-center mb-8 border-l-4 border-[#B5F140]">
              <span className="text-3xl font-serif text-[#2D5A3C] mr-4">01</span>
              <p className="text-sm text-[#12281C]"><strong className="font-bold">Yield Forecast</strong> estimates production, scores growing conditions, and explains the next best action for your field.</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-[#E4E0D1]">
                <form onSubmit={handleGenerateForecast} className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-blue-800 uppercase border-b border-gray-100 pb-2 mb-4">Field Profile</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-2 text-gray-500">Crop</label>
                        <select className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" value={forecastForm.crop} onChange={e => setForecastForm({...forecastForm, crop: e.target.value})}>
                          <option>Maize</option>
                          <option>Rice</option>
                          <option>Wheat</option>
                          <option>Cotton</option>
                          <option>Millet</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2 text-gray-500">Area (acres)</label>
                        <input type="number" required value={forecastForm.area} onChange={e => setForecastForm({...forecastForm, area: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-teal-600 uppercase border-b border-gray-100 pb-2 mb-4">Live Conditions</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold mb-2 text-gray-500">Rainfall (mm)</label>
                        <input type="number" value={forecastForm.rainfall} onChange={e => setForecastForm({...forecastForm, rainfall: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2 text-gray-500">Temperature (°C)</label>
                        <input type="number" value={forecastForm.temp} onChange={e => setForecastForm({...forecastForm, temp: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold mb-2 text-gray-500">Nitrogen (kg/ha)</label>
                        <input type="number" value={forecastForm.nitrogen} onChange={e => setForecastForm({...forecastForm, nitrogen: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2 text-gray-500">Phosphorus (kg/ha)</label>
                        <input type="number" value={forecastForm.phosphorus} onChange={e => setForecastForm({...forecastForm, phosphorus: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-2 text-gray-500">Potassium (kg/ha)</label>
                        <input type="number" value={forecastForm.potassium} onChange={e => setForecastForm({...forecastForm, potassium: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2 text-gray-500">Soil pH</label>
                        <input type="number" step="0.1" value={forecastForm.ph} onChange={e => setForecastForm({...forecastForm, ph: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-[#12281C] text-white py-4 rounded-xl text-sm font-bold flex justify-center items-center space-x-2 hover:bg-black transition-colors">
                    <span>Generate forecast</span> <span>&rarr;</span>
                  </button>
                </form>
              </div>

              <div className="bg-[#1D3C28] rounded-2xl flex flex-col items-center justify-center text-white p-8 relative overflow-hidden transition-all duration-500 min-h-[600px]">
                {!isForecastGenerated ? (
                  <div className="text-center animate-in fade-in zoom-in duration-500">
                    <Sparkles className="text-[#B5F140] w-10 h-10 mx-auto mb-6 opacity-100" />
                    <h3 className="text-[1.75rem] font-serif leading-tight">Your harvest outlook<br/>will appear here.</h3>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div>
                      <div className="flex justify-between items-start mb-10">
                        <p className="text-[10px] font-bold tracking-[0.15em] text-gray-300 uppercase">{forecastResult.crop} / Projected<br/>Production</p>
                        <span className={`${forecastResult.riskColor} text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-sm shadow-sm`}>
                          {forecastResult.riskStatus}
                        </span>
                      </div>
                      
                      <div className="mb-8">
                        <p className="text-7xl font-serif leading-none mb-3">{forecastResult.total} <span className="text-2xl font-sans text-gray-300 ml-2">tonnes</span></p>
                        <p className="text-sm text-gray-300">{forecastResult.perAcre} tonnes per acre · {forecastResult.confidence}% model confidence</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 border-t border-b border-white/10 py-6 mb-8">
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-gray-400 mb-2 uppercase">Weather</p>
                          <p className="text-3xl font-serif">99</p>
                        </div>
                        <div className="border-l border-white/10 pl-4">
                          <p className="text-[10px] font-bold tracking-widest text-gray-400 mb-2 uppercase">Soil</p>
                          <p className="text-3xl font-serif">68</p>
                        </div>
                        <div className="border-l border-white/10 pl-4">
                          <p className="text-[10px] font-bold tracking-widest text-gray-400 mb-2 uppercase">MAE</p>
                          <p className="text-3xl font-serif">0.29</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-[#B5F140] mb-2 uppercase">Recommended Next Step</p>
                      <p className="text-sm leading-relaxed text-gray-200">{forecastResult.riskMsg}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== FIELD REGISTRY TAB ===================== */}
        {activeTab === "registry" && (
          <div className="animate-in fade-in duration-500">
            <header className="mb-10">
              <h2 className="text-5xl font-serif tracking-tight text-[#12281C] mb-3">Know every acre</h2>
              <p className="text-sm text-gray-500">Create a trusted home for the fields that drive your decisions.</p>
            </header>

            <div className="bg-[#EBE6D5] p-6 rounded-xl flex items-center mb-8 border-l-4 border-[#B5F140]">
              <span className="text-3xl font-serif text-[#2D5A3C] mr-4">02</span>
              <p className="text-sm text-[#12281C]"><strong className="font-bold">Field Registry</strong> keeps farm location, acreage, and soil type organised for every forecast and seasonal report.</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-[#E4E0D1]">
                <form onSubmit={handleRegisterField} className="space-y-6">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase border-b border-gray-100 pb-2 mb-4">New Field</p>
                  <div>
                    <label className="block text-xs font-bold mb-2 text-[#12281C]">Field name</label>
                    <input type="text" required value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" placeholder="e.g. North Plot" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2 text-[#12281C]">Location</label>
                    <input type="text" required value={newField.location} onChange={e => setNewField({...newField, location: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" placeholder="e.g. Mandya, Karnataka" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-2 text-[#12281C]">Area (acres)</label>
                      <input type="number" required value={newField.area} onChange={e => setNewField({...newField, area: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]" placeholder="10" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-2 text-[#12281C]">Soil type</label>
                      <select value={newField.soil} onChange={e => setNewField({...newField, soil: e.target.value})} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-[#12281C]">
                        <option>Loamy</option>
                        <option>Sandy</option>
                        <option>Clay</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-[#12281C] text-white py-4 rounded-xl text-sm font-bold flex justify-center items-center space-x-2 hover:bg-black transition-colors mt-4">
                    <span>Register field</span> <span className="text-[#B5F140]">+</span>
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-[#E4E0D1] h-[600px] overflow-y-auto">
                <p className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase border-b border-gray-100 pb-2 mb-4">Your Fields ({fields.length})</p>
                
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 animate-in fade-in duration-500">
                    <Database size={32} className="mb-3 opacity-50" />
                    <p className="text-sm">No fields registered yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, idx) => (
                      <div key={idx} className="group border-l-4 border-[#2D5A3C] pl-4 flex justify-between items-center bg-[#F4F2EB]/50 p-4 rounded-r-xl animate-in fade-in slide-in-from-right-4 transition-all">
                        <div>
                          <p className="font-bold text-[#12281C] text-lg capitalize">{field.name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-1 capitalize">{field.location} · {field.soil}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-2xl font-serif text-[#12281C]">{field.area}</p>
                            <p className="text-[10px] tracking-widest uppercase text-gray-500">acres</p>
                          </div>
                          <button 
                            onClick={() => handleRemoveField(idx)}
                            className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Remove field"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== SYSTEM MAP TAB ===================== */}
        {activeTab === "system" && (
           <div className="animate-in fade-in duration-500">
            <header className="mb-10">
              <h2 className="text-5xl font-serif tracking-tight text-[#12281C] mb-3">System Architecture</h2>
              <p className="text-sm text-gray-500">An overview of the YieldSense intelligence flow.</p>
            </header>

            <div className="bg-[#EBE6D5] p-6 rounded-xl flex items-center mb-12 border-l-4 border-[#B5F140]">
              <span className="text-3xl font-serif text-[#2D5A3C] mr-4">03</span>
              <p className="text-sm text-[#12281C]"><strong className="font-bold">System Map</strong> makes the data journey visible - from field observations to secure records, AI prediction, and decision-ready insight.</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4 text-center font-sans">
              <div className="bg-[#19271E] text-white py-5 px-4 shadow-sm">
                <p className="font-bold text-base">Farmers · Advisors · Admin</p>
              </div>
              <p className="text-gray-500 text-sm">↓</p>
              
              <div className="bg-[#B5F140] text-[#12281C] py-7 px-4 shadow-sm">
                <p className="font-bold text-base mb-1">YieldSense Web Experience</p>
                <p className="text-[10px] font-mono opacity-80 uppercase tracking-widest">Responsive desktop and mobile interface</p>
              </div>
              <p className="text-gray-500 text-sm">↓</p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 py-8 px-4 shadow-sm">
                  <p className="font-bold text-base text-[#12281C] mb-2">FastAPI Service</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">JWT · RBAC · REST API</p>
                </div>
                <div className="bg-white border border-gray-200 py-8 px-4 shadow-sm">
                  <p className="font-bold text-base text-[#12281C] mb-2">AI Forecast Engine</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Random Forest · model metrics</p>
                </div>
              </div>
              <p className="text-gray-500 text-sm">↓</p>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 py-8 px-4 shadow-sm">
                  <p className="font-bold text-base text-[#12281C] mb-2">PostgreSQL</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Users · farms · records</p>
                </div>
                <div className="bg-white border border-gray-200 py-8 px-4 shadow-sm">
                  <p className="font-bold text-base text-[#12281C] mb-2">Data pipeline</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">FAOSTAT · USDA · Weather · Soil</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-8 pt-4">
                <div className="bg-white border-t-4 border-[#19271E] p-4 text-left shadow-sm font-serif text-lg font-bold">01</div>
                <div className="bg-white border-t-4 border-[#19271E] p-4 text-left shadow-sm font-serif text-lg font-bold">02</div>
                <div className="bg-white border-t-4 border-[#19271E] p-4 text-left shadow-sm font-serif text-lg font-bold">03</div>
                <div className="bg-white border-t-4 border-[#19271E] p-4 text-left shadow-sm font-serif text-lg font-bold">04</div>
              </div>
            </div>
           </div>
        )}

      </main>
    </div>
  );
}