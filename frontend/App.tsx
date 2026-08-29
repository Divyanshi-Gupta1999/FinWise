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
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Navigation Tabs */}
        {isPlanActive && (
          <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-6 py-3 flex items-center gap-4 z-10">
            <button
              onClick={() => setActiveTab(TabState.DASHBOARD)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === TabState.DASHBOARD 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Strategy Dashboard
            </button>
            <button
              onClick={() => setActiveTab(TabState.CHAT)}
              disabled={isGeneratingNarrative || isGeneratingProjections}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === TabState.CHAT 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              AI Advisor Chat
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {!isPlanActive && (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-800">
                <LayoutDashboard className="w-10 h-10 text-gray-700" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-300 mb-2">Awaiting Profile Data</h2>
              <p className="max-w-md text-gray-500">
                Enter your financial parameters in the sidebar and click "Generate Autonomous Plan" to let our multi-agent system synthesize your strategy.
              </p>
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
