import React, { useState } from 'react';
import { updateFarmerProfile, updateFarmerFarm, completeOnboarding } from '../services/api';
import { FarmerProfile, FarmDetails } from '../types';

interface OnboardingWizardProps {
  user: FarmerProfile;
  farm: FarmDetails;
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, farm, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [village, setVillage] = useState(user.village || '');
  const [district, setDistrict] = useState(user.district || '');
  const [state, setState] = useState(user.state || '');

  const [fieldName, setFieldName] = useState(farm.field_name || 'North Field');
  const [landSize, setLandSize] = useState<number>(farm.land_size || 4.5);
  const [landUnit, setLandUnit] = useState<'Acres' | 'Hectares'>(farm.land_unit || 'Acres');
  const [soilType, setSoilType] = useState<'Sandy' | 'Loam' | 'Clay'>(farm.soil_type || 'Loam');
  const [irrigation, setIrrigation] = useState<'Sprinkler' | 'Flood' | 'Drip' | 'Unknown'>(
    farm.irrigation_method || 'Sprinkler'
  );

  const handleFinish = async () => {
    setLoading(true);
    try {
      await updateFarmerProfile({ full_name: fullName, phone, village, district, state });
      await updateFarmerFarm({ field_name: fieldName, land_size: landSize, land_unit: landUnit, soil_type: soilType, irrigation_method: irrigation });
      await completeOnboarding();
      onComplete();
    } catch {
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await completeOnboarding();
    } catch {}
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-emerald-100 dark:border-slate-800 shadow-xl mb-8">
      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Welcome to YieldSense AI
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Let's set up your farm so you don't have to enter the same details every time.
          </p>
        </div>
        <button
          onClick={handleSkip}
          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
        >
          Skip Setup
        </button>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                s === step
                  ? 'bg-emerald-600 text-white'
                  : s < step
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                s === step ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'
              }`}
            >
              {s === 1 ? 'About You' : s === 2 ? 'Your Farm' : 'Farm Conditions'}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: ABOUT YOU */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Step 1: Personal Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Village
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Village name"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="District"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition shadow"
            >
              Next: Your Farm →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: YOUR FARM */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Step 2: Farm Specifications
          </h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Field / Plot Name
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g. North Field"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Land Size
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={landSize}
                onChange={(e) => setLandSize(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Land Unit
              </label>
              <select
                value={landUnit}
                onChange={(e) => setLandUnit(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Acres">Acres</option>
                <option value="Hectares">Hectares</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition shadow"
            >
              Next: Conditions →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: FARM CONDITIONS */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Step 3: Soil & Water Settings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Soil Type
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Loam">Loam (Balanced)</option>
                <option value="Sandy">Sandy (Light/Draining)</option>
                <option value="Clay">Clay (Heavy/Retentive)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Irrigation Method
              </label>
              <select
                value={irrigation}
                onChange={(e) => setIrrigation(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Sprinkler">Sprinkler Irrigation</option>
                <option value="Drip">Drip Irrigation</option>
                <option value="Flood">Flood Irrigation</option>
                <option value="Unknown">Rainfed / None</option>
              </select>
            </div>
          </div>

          <div className="pt-6 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs text-slate-600 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              ← Back
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-lg"
            >
              {loading ? 'Saving Setup...' : 'Complete & Open Dashboard 🎉'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
