export interface UserProfile {
  income: number;
  expenses: number;
  capital: number;
  market: string; // 'IN', 'US', 'GLOBAL'
  objective: string; // 'MILESTONE', 'FIRE', 'RETIREMENT'
  riskProfile: string; // 'CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'
  goalAmount: number;
  goalHorizon: number; // years
}

export interface AssetAllocation {
  assetClass: string;
  percentage: number;
  reasoning: string;
}

export interface AllocationData {
  riskScore: number;
  assetAllocation: AssetAllocation[];
  actionSteps: string[];
}

export interface Projection {
  year: number;
  bear: number; // 10th percentile
  base: number; // 50th percentile
  bull: number; // 90th percentile
}

export interface SubCategoryOption {
  name: string;
  percentage: number;
  reasoning: string;
}

export interface CategoryRecommendation {
  category: string;
  keyTakeaways: string[];
  subCategories: SubCategoryOption[];
}

export interface SpecificAssetPick {
  symbol: string;
  name: string;
  currentPriceEstimate: string;
  pastPerformance: string;
  futurePrediction: string;
  reasoning: string;
}

export interface HistoricalEvent {
  eventName: string;
  impact: string;
  recoveryTime: string;
}

export interface NarrativeData {
  narrative: string;
  regimeAnalysis: {
    summary: string;
    historicalEvents: HistoricalEvent[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export enum TabState {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT'
}

export interface MarketBenchmark {
  assetClass: string;
  cagr30Y: number;
  volatility_std: number;
  maxDrawdown: string;
  currentValuation: string;
  // Extended fields from deep analytics
  currentPrice?: number;
  return1Y?: number;
  momentum30d?: number;
  recentVolatility?: number;
  allTimeHigh?: number;
  allTimeLow?: number;
  maxDrawdownDate?: string;
  maxDrawdownPct?: number;
  dataStartDate?: string;
  dataEndDate?: string;
  totalTradingDays?: number;
}

export interface MarketAnalysis {
  timestamp: string;
  regimeSummary: any[];
  currentPrices: any[];
  momentum30d: any[];
  maxDrawdowns: any[];
  priceRange: any[];
}

export interface MacroRegimeState {
  title: string;
  badge: string;
  yieldCurveStatus: string;
  cpiInflation: string;
  fedFundsRate: string;
  yieldCurveSpread: string;
  vixIndex: string;
  usDollarIndex: string;
  usdInrRate: string;
  unemploymentRate: string;
}

export interface MacroIndicator {
  indicator_code: string;
  indicator_name: string;
  category: string;
  period_date: string;
  value: number;
  unit: string;
}

export interface MacroRegimeResponse {
  success: boolean;
  timestamp: string;
  regime: MacroRegimeState;
  indicators: MacroIndicator[];
}