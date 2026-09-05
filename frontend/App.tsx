import React, { useState } from 'react';
import { UserProfile, AllocationData, Projection, TabState, ChatMessage, MarketBenchmark, MarketAnalysis, MacroRegimeState, NarrativeData } from './types';
import { 
  generateAllocationAgent, 
  generateProjectionsAgent, 
  generateNarrativeAgent,
  initChatSession
} from './services/geminiService';
import { fetchMarketAnalysis, fetchMacroRegime } from './services/bigqueryService';
import InputForm from './components/InputForm';
import Dashboard from './components/Dashboard';
import Chat from './components/Chat';
import { LayoutDashboard, MessageSquare } from 'lucide-react';

const DEFAULT_PROFILE: UserProfile = {
  income: 0,
  expenses: 0,
  capital: 0,
  market: 'IN',
  objective: 'MILESTONE',
  riskProfile: 'MODERATE',
  goalAmount: 0,
  goalHorizon: 0,
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  
  // Multi-Agent & Data State
  const [isPlanActive, setIsPlanActive] = useState(false);
  const [benchmarks, setBenchmarks] = useState<MarketBenchmark[] | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState<MarketAnalysis | null>(null);
  const [macroRegime, setMacroRegime] = useState<MacroRegimeState | null>(null);
  const [allocation, setAllocation] = useState<AllocationData | null>(null);
  const [projections, setProjections] = useState<Projection[] | null>(null);
  const [narrativeData, setNarrativeData] = useState<NarrativeData | null>(null);
  
  // Loading States for Progressive Rendering
  const [isFetchingBQ, setIsFetchingBQ] = useState(false);
  const [isGeneratingAllocation, setIsGeneratingAllocation] = useState(false);
  const [isGeneratingProjections, setIsGeneratingProjections] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);

  const [activeTab, setActiveTab] = useState<TabState>(TabState.DASHBOARD);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    // Validation
    if (profile.income <= 0) {
      setError("Please provide a valid Monthly Income.");
      return;
    }
    
    // If FIRE or RETIREMENT, we auto-set a 30 year horizon for the charts if not provided
    const effectiveProfile = { ...profile };
    if (profile.objective !== 'MILESTONE') {
      effectiveProfile.goalHorizon = 30;
      effectiveProfile.goalAmount = 0; // Let AI calculate
    } else if (profile.goalAmount <= 0 || profile.goalHorizon <= 0) {
      setError("Please provide valid Target Goal Amount and Goal Horizon for your milestone.");
      return;
    }

    setError(null);
    setIsPlanActive(true);
    setActiveTab(TabState.DASHBOARD);
    setChatMessages([]);
    
    // Reset states
    setBenchmarks(null);
    setMacroRegime(null);
    setAllocation(null);
    setProjections(null);
    setNarrativeData(null);
    
    // Start loading sequence
    setIsFetchingBQ(true);
    setIsGeneratingAllocation(true);
    setIsGeneratingProjections(true);
    setIsGeneratingNarrative(true);

    try {
      // Stage 0: Fetch Deep BigQuery Market Analysis & Macro Indicators in Parallel
      const [{ benchmarks: bqData, rawAnalysis: analysis }, macroData] = await Promise.all([
        fetchMarketAnalysis(effectiveProfile.market),
        fetchMacroRegime()
      ]);
      setBenchmarks(bqData);
      setRawAnalysis(analysis);
      setMacroRegime(macroData);
      setIsFetchingBQ(false);

      // Stage 1: Fast Allocation Agent (Ground with BQ Data & Macro Regime)
      const allocData = await generateAllocationAgent(effectiveProfile, bqData, macroData);
      setAllocation(allocData);
      setIsGeneratingAllocation(false);

      // Stage 2: Parallel Execution of Quant Modeler & Narrative Synthesizer
      const [projData, narrData] = await Promise.all([
        generateProjectionsAgent(effectiveProfile, allocData, bqData).then(res => {
          setProjections(res);
          setIsGeneratingProjections(false);
          return res;
        }),
        generateNarrativeAgent(effectiveProfile, allocData, bqData, macroData).then(res => {
          setNarrativeData(res);
          setIsGeneratingNarrative(false);
          return res;
        })
      ]);

      // Initialize Chat Agent once all context is ready
      initChatSession(effectiveProfile, allocData, projData, narrData, bqData, macroData);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during generation.");
      setIsPlanActive(false);
      setIsFetchingBQ(false);
      setIsGeneratingAllocation(false);
      setIsGeneratingProjections(false);
      setIsGeneratingNarrative(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <InputForm 
        profile={profile} 
        onChange={setProfile} 
        onSubmit={handleGeneratePlan} 
        isLoading={isFetchingBQ || isGeneratingAllocation} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-950">
        
        {/* Top Navigation Tabs */}
        {isPlanActive && (
          <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
              <button
                onClick={() => setActiveTab(TabState.DASHBOARD)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === TabState.DASHBOARD 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                Strategy Dashboard
              </button>
              <button
                onClick={() => setActiveTab(TabState.CHAT)}
                disabled={isGeneratingNarrative || isGeneratingProjections}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === TabState.CHAT 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                AI Advisor Chat
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              725,000+ BigQuery Nodes Active
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/10 border border-red-500/40 text-red-300 px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 text-sm font-medium backdrop-blur-md">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {!isPlanActive && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-slate-900/80 rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-slate-800/80 relative">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl animate-pulse"></div>
                <LayoutDashboard className="w-9 h-9 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">Autonomous Wealth Strategy Studio</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Enter your client's financial parameters on the left and click <span className="text-emerald-400 font-semibold">"Generate Autonomous Plan"</span> to trigger 4 parallel AI agents backed by 725,000+ real-time BigQuery records.
              </p>

              {/* Quick Sample Profiles for Instant Exploration */}
              <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  ⚡ Quick-Load Test Profiles:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      setProfile({
                        income: 150000,
                        expenses: 50000,
                        capital: 500000,
                        market: 'IN',
                        objective: 'MILESTONE',
                        riskProfile: 'MODERATE',
                        goalAmount: 2500000,
                        goalHorizon: 7
                      });
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 text-left transition-all group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 block mb-0.5">Family Milestone</span>
                    <span className="text-[11px] text-slate-400 font-mono block">₹1.5L/mo • 7 Yr • Moderate</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfile({
                        income: 300000,
                        expenses: 90000,
                        capital: 1500000,
                        market: 'IN',
                        objective: 'FIRE',
                        riskProfile: 'AGGRESSIVE',
                        goalAmount: 0,
                        goalHorizon: 15
                      });
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 text-left transition-all group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 block mb-0.5">Aggressive FIRE</span>
                    <span className="text-[11px] text-slate-400 font-mono block">₹3.0L/mo • 15 Yr • Aggressive</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfile({
                        income: 200000,
                        expenses: 80000,
                        capital: 2000000,
                        market: 'IN',
                        objective: 'RETIREMENT',
                        riskProfile: 'CONSERVATIVE',
                        goalAmount: 0,
                        goalHorizon: 20
                      });
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 text-left transition-all group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 block mb-0.5">Retirement Corpus</span>
                    <span className="text-[11px] text-slate-400 font-mono block">₹2.0L/mo • 20 Yr • Conservative</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPlanActive && activeTab === TabState.DASHBOARD && (
            <Dashboard 
              profile={profile}
              benchmarks={benchmarks}
              macroRegime={macroRegime}
              allocation={allocation}
              projections={projections}
              narrativeData={narrativeData}
              isFetchingBQ={isFetchingBQ}
              isGeneratingAllocation={isGeneratingAllocation}
              isGeneratingProjections={isGeneratingProjections}
              isGeneratingNarrative={isGeneratingNarrative}
            />
          )}

          {isPlanActive && activeTab === TabState.CHAT && (
            <Chat messages={chatMessages} setMessages={setChatMessages} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
