import React from 'react';
import { UserProfile } from '../types';
import { DollarSign, TrendingUp, Target, Clock, ShieldAlert, Wallet, Flag } from 'lucide-react';

interface InputFormProps {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ profile, onChange, onSubmit, isLoading }) => {
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...profile,
      [name]: parseFloat(value) || 0
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({
      ...profile,
      [name]: value
    });
  };

  const currencySymbol = profile.market === 'US' ? '$' : '₹';
  const isSpecificMilestone = profile.objective === 'MILESTONE';

  return (
    <div className="bg-gray-900 border-r border-gray-800 w-full md:w-80 p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-emerald-500/20 p-2 rounded-lg">
          <TrendingUp className="text-emerald-400 w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">FinWise <span className="text-emerald-500">AI</span></h1>
      </div>

      <div className="space-y-5 flex-grow">
        
        {/* Objective Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
            <Flag className="w-4 h-4" /> Investment Objective
          </label>
          <select
            name="objective"
            value={profile.objective}
            onChange={handleSelectChange}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors appearance-none"
          >
            <option value="MILESTONE">Specific Milestone (House, Car, etc.)</option>
            <option value="FIRE">Long-Term Wealth Compounding / FIRE</option>
            <option value="RETIREMENT">Retirement Corpus Planning</option>
          </select>
        </div>

        {/* Risk Profile */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
            <ShieldAlert className="w-4 h-4" /> Risk Tolerance Profile
          </label>
          <select
            name="riskProfile"
            value={profile.riskProfile}
            onChange={handleSelectChange}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors appearance-none"
          >
            <option value="CONSERVATIVE">Conservative (Capital Preservation)</option>
            <option value="MODERATE">Moderate (Balanced Growth)</option>
            <option value="AGGRESSIVE">Aggressive (Max Equity Compounding)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-gray-800"></div>

        {/* Financials */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
            <DollarSign className="w-4 h-4" /> Monthly Income ({currencySymbol})
          </label>
          <input
            type="number"
            name="income"
            value={profile.income || ''}
            onChange={handleNumberChange}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="e.g. 8000"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
            <Wallet className="w-4 h-4" /> Fixed Expenses ({currencySymbol})
          </label>
          <input
            type="number"
            name="expenses"
            value={profile.expenses || ''}
            onChange={handleNumberChange}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="e.g. 4000"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
            <DollarSign className="w-4 h-4" /> Current Capital ({currencySymbol})
          </label>
          <input
            type="number"
            name="capital"
            value={profile.capital || ''}
            onChange={handleNumberChange}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="e.g. 50000"
          />
        </div>

        {/* Conditional Milestone Fields */}
        {isSpecificMilestone && (
          <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                <Target className="w-4 h-4" /> Target Goal Amount ({currencySymbol})
              </label>
              <input
                type="number"
                name="goalAmount"
                value={profile.goalAmount || ''}
                onChange={handleNumberChange}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g. 1000000"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                <Clock className="w-4 h-4" /> Goal Horizon (Years)
              </label>
              <input
                type="number"
                name="goalHorizon"
                value={profile.goalHorizon || ''}
                onChange={handleNumberChange}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="e.g. 10"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading}
        className={`mt-8 w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 flex-shrink-0
          ${isLoading 
            ? 'bg-emerald-600/50 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
          }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Synthesizing...
          </>
        ) : (
          'Generate Autonomous Plan'
        )}
      </button>
    </div>
  );
};

export default InputForm;
