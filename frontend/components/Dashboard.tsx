import React, { useState } from 'react';
import { UserProfile, AllocationData, Projection, CategoryRecommendation, SpecificAssetPick, MarketBenchmark, NarrativeData, MacroRegimeState } from '../types';
import { getCategoryRecommendation, getSpecificAssetRecommendations } from '../services/geminiService';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { ShieldAlert, Target, TrendingUp, X, ChevronRight, Database, CheckCircle2, ArrowLeft, TrendingDown, Activity, Loader2, AlertTriangle, ListChecks, Globe, Gauge, Landmark, DollarSign } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  benchmarks: MarketBenchmark[] | null;
  macroRegime?: MacroRegimeState | null;
  allocation: AllocationData | null;
  projections: Projection[] | null;
  narrativeData: NarrativeData | null;
  isFetchingBQ: boolean;
  isGeneratingAllocation: boolean;
  isGeneratingProjections: boolean;
  isGeneratingNarrative: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const SUB_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];

const Dashboard: React.FC<DashboardProps> = ({ 
  profile, benchmarks, macroRegime, allocation, projections, narrativeData, 
  isFetchingBQ, isGeneratingAllocation, isGeneratingProjections, isGeneratingNarrative 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryRec, setCategoryRec] = useState<CategoryRecommendation | null>(null);
  const [isLoadingRec, setIsLoadingRec] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [assetPicks, setAssetPicks] = useState<SpecificAssetPick[] | null>(null);
  const [isLoadingPicks, setIsLoadingPicks] = useState(false);
  
  const currencySymbol = profile.market === 'US' ? '$' : '₹';
  
  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `${currencySymbol}${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 1000000) return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 100000) return `${currencySymbol}${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
    return `${currencySymbol}${value}`;
  };

  const finalBase = projections ? projections[projections.length - 1]?.base || 0 : 0;
  const goalReached = profile.objective === 'MILESTONE' ? finalBase >= profile.goalAmount : true;

  const handleCategoryClick = async (data: any) => {
    const category = data.assetClass || data.name;
    if (!category || !benchmarks) return;
    
    setSelectedCategory(category);
    setIsLoadingRec(true);
    setCategoryRec(null);
    setRecError(null);
    setSelectedSubCategory(null);
    setAssetPicks(null);
    
    try {
      const rec = await getCategoryRecommendation(category, profile, benchmarks);
      setCategoryRec(rec);
    } catch (err: any) {
      setRecError(err.message || "Failed to load recommendation.");
    } finally {
      setIsLoadingRec(false);
    }
  };

  const handleSubCategoryClick = async (subCategoryName: string) => {
    if (!selectedCategory) return;
    
    setSelectedSubCategory(subCategoryName);
    setIsLoadingPicks(true);
    setAssetPicks(null);
    
    try {
      const picks = await getSpecificAssetRecommendations(selectedCategory, subCategoryName, profile);
      setAssetPicks(picks);
    } catch (err: any) {
      setRecError(err.message || "Failed to load specific asset picks.");
      setSelectedSubCategory(null);
    } finally {
      setIsLoadingPicks(false);
    }
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setCategoryRec(null);
    setRecError(null);
    setSelectedSubCategory(null);
    setAssetPicks(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Strategy Dashboard
            {(isFetchingBQ || isGeneratingAllocation || isGeneratingProjections || isGeneratingNarrative) && (
              <span className="flex items-center gap-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" /> Agents Working...
              </span>
            )}
          </h2>
          <p className="text-gray-400 text-sm">AI-generated based on your profile and market conditions.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-800/50 px-3 py-1.5 rounded-full">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-blue-300">Live BigQuery Data</span>
        </div>
      </div>

      {/* BigQuery Market Intelligence Panel */}
      <div className="bg-gray-900 border border-blue-900/50 rounded-xl overflow-hidden">
        <div className="bg-blue-950/30 px-6 py-4 border-b border-blue-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                Real-Time Market Intelligence
                <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Live BigQuery</span>
                <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">660,000+ Records (20Y Depth)</span>
              </h3>
              <p className="text-xs text-blue-300/70 font-mono mt-0.5">finwise-506509.finwise_data | 5 parallel SQL queries | Multi-Asset Global Intelligence</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 overflow-x-auto">
          {isFetchingBQ || !benchmarks ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-blue-400 animate-pulse">Running 5 parallel BigQuery analytical queries on 30+ years of market data...</p>
            </div>
          ) : (
            <>
              {/* Current Market Regime Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {benchmarks.map((bm, idx) => (
                  <div key={idx} className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-medium truncate mb-1">{bm.assetClass.split('(')[0].trim()}</p>
                    {bm.currentPrice ? (
                      <>
                        <p className="text-lg font-bold text-white font-mono">{bm.currentPrice.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${(bm.return1Y || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {(bm.return1Y || 0) >= 0 ? '▲' : '▼'} {bm.return1Y}% 1Y
                          </span>
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${(bm.momentum30d || 0) > 30 ? 'bg-emerald-500/10 text-emerald-500' : (bm.momentum30d || 0) < -10 ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-400'}`}>
                            {(bm.momentum30d || 0) > 0 ? '+' : ''}{bm.momentum30d?.toFixed(0)}% 30D
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-lg font-bold text-white font-mono">{bm.cagr30Y}% CAGR</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Detailed Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">Asset Class</th>
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">30Y CAGR</th>
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">Volatility (σ)</th>
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">Max Drawdown</th>
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">Current Regime</th>
                    <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">Data Coverage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {benchmarks.map((bm, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 text-sm font-medium text-gray-200">{bm.assetClass}</td>
                      <td className="py-3 text-sm text-emerald-400 font-mono">{bm.cagr30Y}%</td>
                      <td className="py-3 text-sm text-amber-400 font-mono">{bm.volatility_std}%</td>
                      <td className="py-3 text-sm text-red-400 font-mono">{bm.maxDrawdown}</td>
                      <td className="py-3 text-sm text-gray-300">{bm.currentValuation}</td>
                      <td className="py-3 text-xs text-gray-500 font-mono">
                        {bm.dataStartDate && bm.dataStartDate !== 'N/A' ? `${bm.dataStartDate} → ${bm.dataEndDate}` : 'N/A'}
                        {bm.totalTradingDays ? <span className="text-gray-600 ml-1">({bm.totalTradingDays.toLocaleString()} days)</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Macroeconomic & Rate Cycle Pulse Bar */}
      {macroRegime && (
        <div className="bg-gray-900/90 border border-purple-900/40 rounded-xl p-4 animate-in fade-in duration-500">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-gray-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-purple-500/20 p-1.5 rounded-lg">
                <Globe className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">Detected Macro Regime</span>
                <span className="text-sm font-semibold text-white flex items-center gap-2">
                  {macroRegime.title}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">{macroRegime.badge}</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 font-mono">Live Central Bank & Economic Pulse</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-gray-950/80 border border-gray-800/80 rounded-lg p-2.5">
              <span className="text-[11px] text-gray-400 block mb-0.5">CPI Inflation</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{macroRegime.cpiInflation}</span>
              <span className="text-[10px] text-gray-500 block">YoY Trajectory</span>
            </div>

            <div className="bg-gray-950/80 border border-gray-800/80 rounded-lg p-2.5">
              <span className="text-[11px] text-gray-400 block mb-0.5">Policy Rate</span>
              <span className="text-sm font-bold font-mono text-blue-400">{macroRegime.fedFundsRate}</span>
              <span className="text-[10px] text-gray-500 block">Central Bank</span>
            </div>

            <div className="bg-gray-950/80 border border-gray-800/80 rounded-lg p-2.5">
              <span className="text-[11px] text-gray-400 block mb-0.5">Yield Curve (10Y-2Y)</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{macroRegime.yieldCurveSpread}</span>
              <span className="text-[10px] text-gray-500 truncate block">{macroRegime.yieldCurveStatus.split('(')[0]}</span>
            </div>

            <div className="bg-gray-950/80 border border-gray-800/80 rounded-lg p-2.5">
              <span className="text-[11px] text-gray-400 block mb-0.5">VIX (Market Fear)</span>
              <span className="text-sm font-bold font-mono text-amber-400">{macroRegime.vixIndex}</span>
              <span className="text-[10px] text-gray-500 block">{Number(macroRegime.vixIndex) < 15 ? '🟢 Calm' : Number(macroRegime.vixIndex) < 25 ? '🟡 Normal' : '🔴 Panic'}</span>
            </div>

            <div className="bg-gray-950/80 border border-gray-800/80 rounded-lg p-2.5">
              <span className="text-[11px] text-gray-400 block mb-0.5">USD / INR</span>
              <span className="text-sm font-bold font-mono text-white">{macroRegime.usdInrRate}</span>
              <span className="text-[10px] text-gray-500 block">Exchange Rate</span>
            </div>

            <div className="bg-gray-950/80 border border-gray-800/80 rounded-lg p-2.5">
              <span className="text-[11px] text-gray-400 block mb-0.5">Unemployment</span>
              <span className="text-sm font-bold font-mono text-white">{macroRegime.unemploymentRate}</span>
              <span className="text-[10px] text-gray-500 block">Labor Market</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-lg">
            <ShieldAlert className="text-blue-400 w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400 font-medium">AI Risk Score</p>
            {isGeneratingAllocation ? (
              <div className="h-8 w-16 bg-gray-800 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-white">{allocation?.riskScore} <span className="text-sm text-gray-500 font-normal">/ 100</span></p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-lg">
            <TrendingUp className="text-emerald-400 w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400 font-medium">Projected Base (End)</p>
            {isGeneratingProjections ? (
              <div className="h-8 w-24 bg-gray-800 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-white">{formatCurrency(finalBase)}</p>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
          <div className={`${goalReached && !isGeneratingProjections ? 'bg-emerald-500/20' : 'bg-amber-500/20'} p-3 rounded-lg`}>
            <Target className={`${goalReached && !isGeneratingProjections ? 'text-emerald-400' : 'text-amber-400'} w-6 h-6`} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-400 font-medium">Objective Status</p>
            {isGeneratingProjections ? (
              <div className="h-8 w-20 bg-gray-800 rounded animate-pulse mt-1"></div>
            ) : (
              <p className={`text-2xl font-bold ${goalReached ? 'text-emerald-400' : 'text-amber-400'}`}>
                {profile.objective === 'MILESTONE' ? (goalReached ? 'On Track' : 'Shortfall') : 'Compounding'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Asset Allocation Pie Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 lg:col-span-1 flex flex-col">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-semibold text-white">Dynamic Asset Allocation</h3>
            {isGeneratingAllocation && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
          </div>
          <p className="text-xs text-gray-400 mb-4">Click on any category for a deep dive</p>
          
          {isGeneratingAllocation || !allocation ? (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[250px] space-y-6">
              <div className="w-40 h-40 rounded-full border-8 border-gray-800 border-t-emerald-500/50 animate-spin"></div>
              <div className="w-full space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-full bg-gray-800 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-grow min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation.assetAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="percentage"
                      nameKey="assetClass"
                      stroke="none"
                      onClick={(entry) => handleCategoryClick(entry.payload || entry)}
                      className="cursor-pointer hover:opacity-80 transition-opacity outline-none"
                    >
                      {allocation.assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem' }}
                      itemStyle={{ color: '#f3f4f6' }}
                      formatter={(value: number) => [`${value}%`, 'Allocation']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {allocation.assetAllocation.map((asset, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleCategoryClick(asset)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-gray-300">{asset.assetClass}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{asset.percentage}%</span>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Probabilistic Outcome Curves */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-white">Probabilistic Outcome Curves</h3>
            {isGeneratingProjections && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
          </div>
          
          {isGeneratingProjections || !projections ? (
            <div className="flex-grow flex items-end justify-between min-h-[300px] pb-8 px-4 gap-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-full bg-gray-800 rounded-t animate-pulse" style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 100}ms` }}></div>
              ))}
            </div>
          ) : (
            <div className="flex-grow min-h-[300px] animate-in fade-in duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projections} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis 
                    dataKey="year" 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af' }} 
                    tickFormatter={(val) => `Yr ${val}`}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    tick={{ fill: '#9ca3af' }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="bull" name="Bull Case (90th %ile)" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="base" name="Base Case (50th %ile)" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="bear" name="Bear Case (10th %ile)" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Action Steps & Regime Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Action Steps */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-400" />
              Prioritized Action Steps
            </h3>
            {isGeneratingAllocation && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
          </div>
          
          {isGeneratingAllocation || !allocation ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 w-full bg-gray-800 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-500">
              {allocation.actionSteps.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-gray-950 p-4 rounded-lg border border-gray-800">
                  <div className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 30-Year Regime Analysis */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              30-Year Macro Regime Analysis
            </h3>
            {isGeneratingNarrative && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
          </div>
          
          {isGeneratingNarrative || !narrativeData ? (
            <div className="space-y-4">
              <div className="h-16 w-full bg-gray-800 rounded-lg animate-pulse"></div>
              <div className="h-24 w-full bg-gray-800 rounded-lg animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              <p className="text-sm text-gray-300 leading-relaxed bg-gray-950 p-4 rounded-lg border border-gray-800">
                {narrativeData.regimeAnalysis.summary}
              </p>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Historical Stress Tests</h4>
                {narrativeData.regimeAnalysis.historicalEvents.map((event, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-850 p-3 rounded-lg border border-gray-800/50">
                    <span className="text-sm font-medium text-white">{event.eventName}</span>
                    <div className="text-right">
                      <span className="text-red-400 text-sm font-mono block">{event.impact}</span>
                      <span className="text-xs text-gray-500">Recovery: {event.recoveryTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Narrative */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="bg-emerald-500/20 p-1.5 rounded text-emerald-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </span>
            AI Strategy Synthesis
          </h3>
          {isGeneratingNarrative && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
        </div>
        
        {isGeneratingNarrative || !narrativeData ? (
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-800 rounded animate-pulse"></div>
            <div className="h-4 w-11/12 bg-gray-800 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-800 rounded animate-pulse"></div>
            <div className="h-4 w-4/5 bg-gray-800 rounded animate-pulse"></div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed animate-in fade-in duration-500">
            {narrativeData.narrative.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 last:mb-0">{paragraph}</p>
            ))}
          </div>
        )}
      </div>

      {/* Visual Drill-down Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-850 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-400">Deep Dive:</span> {selectedCategory}
                </h3>
                <span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded border border-blue-800/50 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Live BQ Data
                </span>
              </div>
              <button 
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
              {isLoadingRec ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-gray-400 animate-pulse">Analyzing historical data & predicting optimal split...</p>
                </div>
              ) : recError ? (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg text-center">
                  {recError}
                </div>
              ) : categoryRec ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-300 h-full">
                  
                  {/* Left Column: Visual Chart & Sub-categories */}
                  <div className="lg:col-span-5 flex flex-col space-y-6">
                    <div className="flex flex-col items-center justify-center bg-gray-950 rounded-xl border border-gray-800 p-6">
                      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 w-full text-left">Recommended Split</h4>
                      <div className="w-full h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryRec.subCategories}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="percentage"
                              nameKey="name"
                              stroke="none"
                            >
                              {categoryRec.subCategories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={SUB_COLORS[index % SUB_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6', borderRadius: '0.5rem' }}
                              itemStyle={{ color: '#f3f4f6' }}
                              formatter={(value: number) => [`${value}%`, 'Allocation']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Interactive Legend */}
                      <div className="w-full space-y-2 mt-4">
                        <p className="text-xs text-gray-500 mb-2">Click a category to view AI asset picks</p>
                        {categoryRec.subCategories.map((sub, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleSubCategoryClick(sub.name)}
                            className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedSubCategory === sub.name 
                                ? 'bg-gray-800 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                : 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-850'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUB_COLORS[idx % SUB_COLORS.length] }}></div>
                                <span className="font-medium text-white text-sm">{sub.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-400 text-sm">{sub.percentage}%</span>
                                <ChevronRight className={`w-4 h-4 ${selectedSubCategory === sub.name ? 'text-emerald-500' : 'text-gray-600'}`} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Content (Takeaways OR Top Picks) */}
                  <div className="lg:col-span-7 flex flex-col">
                    {!selectedSubCategory ? (
                      // Default View: Key Takeaways
                      <div className="bg-gray-950 rounded-xl border border-gray-800 p-6 h-full">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Market Analysis & Strategy</h4>
                        <div className="space-y-5">
                          {categoryRec.keyTakeaways.map((takeaway, idx) => (
                            <div key={idx} className="flex gap-4 items-start bg-gray-900 p-5 rounded-xl border border-gray-800/50">
                              <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-300 leading-relaxed">{takeaway}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-8 p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg flex items-start gap-3">
                          <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-300 leading-relaxed">
                            Select a sub-category on the left to generate a real-time list of top specific asset recommendations based on current market conditions and your profile.
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Drill-down View: Top AI Picks
                      <div className="bg-gray-950 rounded-xl border border-gray-800 p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                          <div>
                            <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Top AI Picks</h4>
                            <p className="text-xl font-bold text-white mt-1">{selectedSubCategory}</p>
                          </div>
                          <button 
                            onClick={() => setSelectedSubCategory(null)}
                            className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800"
                          >
                            <ArrowLeft className="w-4 h-4" /> Back
                          </button>
                        </div>

                        {isLoadingPicks ? (
                          <div className="flex flex-col items-center justify-center flex-grow space-y-4">
                            <div className="relative w-10 h-10">
                              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-sm text-gray-400 animate-pulse">Synthesizing top assets for {selectedSubCategory}...</p>
                          </div>
                        ) : assetPicks ? (
                          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                            {assetPicks.map((pick, idx) => (
                              <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="bg-gray-800 text-gray-300 text-xs font-bold px-2.5 py-1 rounded border border-gray-700">
                                      {pick.symbol}
                                    </span>
                                    <h5 className="font-semibold text-white text-sm">{pick.name}</h5>
                                  </div>
                                  <span className="text-emerald-400 font-mono text-sm font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                                    {pick.currentPriceEstimate}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                      <TrendingDown className="w-3 h-3" /> Past Performance
                                    </p>
                                    <p className="text-xs text-gray-300 leading-relaxed">{pick.pastPerformance}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" /> Future Outlook
                                    </p>
                                    <p className="text-xs text-gray-300 leading-relaxed">{pick.futurePrediction}</p>
                                  </div>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-gray-800/50">
                                  <p className="text-xs text-gray-400"><span className="text-emerald-500 font-medium">Why it fits you:</span> {pick.reasoning}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
