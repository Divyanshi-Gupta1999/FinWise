# FinWise AI: Autonomous, Data-Grounded Wealth Advisory Platform
*Democratizing Institutional-Grade Financial Planning & Crisis Stress-Testing for Everyone*

---

## 1. Executive Summary

**FinWise AI** is an autonomous wealth advisory and financial intelligence platform that pairs multi-agent generative AI with **725,000+ live and historical Google Cloud BigQuery records (1985–2026)**.

Traditional financial advisory is either too expensive for everyday individuals or reliant on generic AI chatbots that frequently hallucinate returns and drawdowns. FinWise AI bridges this divide by delivering a **zero-hallucination**, accessible, and institutional-grade financial copilot. It allows both retail investors and professional wealth managers to build personalized portfolios, simulate macroeconomic regime shifts, and stress-test investments against historical market crises in seconds.

---

## 2. Problem Statement & Market Opportunity

### 2.1 The Wealth Advice Gap
- **High Advisory Cost:** Quality financial planning and custom portfolio engineering typically require minimum asset thresholds ($100k+) and hefty annual fees (1–2% AUM), leaving retail earners and early-stage wealth builders behind.
- **Complex Jargon:** Everyday individuals struggle with financial literacy when confronted with macroeconomic terms like yield curve inversions, standard deviation, and Monte Carlo simulations.

### 2.2 The Generative AI Reliability Problem in FinTech
- **LLM Hallucinations:** General-purpose Large Language Models (LLMs) frequently fabricate CAGR numbers, simulate fake stock performance, or give mathematically inconsistent projections.
- **Static Calculators:** Online retirement/SIP calculators rely on naive linear assumptions (e.g., assuming a fixed 12% return year-over-year) that ignore market volatility, inflation surges, and sequence-of-returns risk.

---

## 3. Solution: FinWise AI Platform Overview

FinWise AI introduces a **hybrid intelligence architecture**: combining Google Gemini 2.5 on Vertex AI for reasoning and conversational synthesis with Google BigQuery SQL analytics and deterministic financial mathematics.

```
+-------------------------------------------------------------------------+
|                              USER INTERACTION                           |
|       (Client Profile: Income, Expenses, Capital, Horizon, Risk)        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  MULTI-AGENT ORCHESTRATOR (Vertex AI)                   |
|                                                                         |
|  [Macro Strategist]   -->   [Quant Modeler]   -->   [Asset Picker]      |
|  Analyzes FRED rates,       Runs Monte Carlo,       Ranks Top ETFs &    |
|  Inflation, VIX, Spreads    10th/50th/90th Fans     US/India Equities   |
|                                   |                                     |
|                                   v                                     |
|                     [Narrative & Advisory Synthesizer]                  |
|                     Plain English, Jargon-Free Summary                  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                   GROUND TRUTH DATA ENGINE (BigQuery)                   |
|        725,000+ Historical & Live Market Records (1985–2026)            |
|       - market_regime_history      - macro_economic_indicators          |
|       - individual_stock_history   - regime_summary                     |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     OUTPUT DASHBOARD & COPILOT UI                       |
|   * Dynamic Asset Allocation      * Probabilistic Fan Curves            |
|   * Crisis Stress-Test Engine     * Conversational Q&A Copilot          |
+-------------------------------------------------------------------------+
```

---

## 4. Key Features & Capabilities

### 4.1 Real-Time Macroeconomic Pulse Engine
Tracks live macroeconomic indicators directly from verified data sources:
- **CPI Inflation Tracking** (e.g., 2.9%)
- **Central Bank Policy Rates** (e.g., 3.63%)
- **Yield Curve Spreads** (10Y minus 2Y Treasury: +0.39%)
- **Market Volatility Index (CBOE VIX)** (e.g., 14.4)

### 4.2 Probabilistic Fan Curves (Monte Carlo Simulation)
Eliminates linear return fallacies by projecting growth across probabilistic bands:
- **90th Percentile (Bull Case):** Favorable compounding environment.
- **50th Percentile (Base Case):** Realistic median outcome.
- **10th Percentile (Bear Case):** Adverse market scenario, testing baseline survival.

### 4.3 Crisis Stress-Testing (Downside Protection)
Allows users to simulate how their proposed portfolio would have performed during real historical market shocks:
- **2008 Great Financial Crisis (GFC):** Peak-to-trough drawdown and exact months to recovery.
- **2020 COVID-19 Liquidity Shock:** Speed of rebound and volatility resilience.
- **Inflationary Squeeze (1970s / 2022):** Real purchasing power preservation.

### 4.4 Dual-Market Asset Drill-Down (US & India)
- Provides category breakdowns across Equities, Fixed Income, Gold/Commodities, and Cash Equivalents.
- Ranks top-performing ETFs and individual equities based on historical Sharpe ratio, volatility, and returns from BigQuery.

### 4.5 Natural Language Financial Copilot
- Everyday users can chat in plain English: *"Can I afford to retire in 15 years if inflation averages 4%?"*
- Answers are synthesized by Gemini 2.5 Flash, backed by verifiable SQL queries and statistical formulas.

---

## 5. Technical Architecture & Tech Stack

| Layer | Technologies Used | Purpose / Responsibility |
| :--- | :--- | :--- |
| **Frontend UI** | React, TypeScript, TailwindCSS, Chart.js / Recharts | Interactive charts, Monte Carlo curves, risk matrices, responsive design |
| **Generative AI** | Google Vertex AI, Gemini 2.5 Flash | Multi-agent reasoning, plain-English synthesis, personalized recommendations |
| **Data Engine** | Google Cloud BigQuery (`finwise_data`) | 725,000+ records, 40+ years of asset prices, macroeconomic indicators |
| **Backend Service**| Node.js, Express | Secure API proxy, Cloud authentication, query orchestration |
| **Deployment** | Google Cloud Platform (Cloud Run / App Engine) | Scalable, low-latency microservices |

---

## 6. Target User Personas

### Persona A: The Everyday Individual (Retail Wealth Builder)
* **Goal:** Wants to plan retirement, children's education, or FIRE (Financial Independence, Retire Early) milestones without paying thousands in fees.
* **Benefit:** Plain-language guidance, clear risk warnings, and confidence that projections are mathematically real.

### Persona B: The Professional Wealth Advisor / RIA
* **Goal:** Needs to prepare institutional-grade proposals and stress-test portfolios during client meetings.
* **Benefit:** Cuts proposal preparation time from 3 hours to 30 seconds with complete auditability.

---

## 7. Competitive Differentiation

| Feature / Metric | Generic AI Chatbots (ChatGPT / Copilot) | Traditional Online Calculators | FinWise AI |
| :--- | :---: | :---: | :---: |
| **Zero Hallucinations** | ❌ High Hallucination Risk | ⚠️ Oversimplified | ✅ 100% BigQuery Grounded |
| **Macroeconomic Awareness** | ❌ Static / Outdated | ❌ None | ✅ Real-Time Live Feed |
| **Crisis Stress Testing** | ❌ Qualitative Guesswork | ❌ None | ✅ Quantitative Historical Simulation |
| **Monte Carlo Fan Curves** | ❌ None | ⚠️ Fixed % | ✅ Probabilistic (10th/50th/90th) |
| **Target Audience** | General public | General public | Everyone (Retail & Advisors) |

---

## 8. Roadmap & Future Scope
1. **Automated Broker Integration:** One-click portfolio rebalancing via Plaid / Zerodha / Interactive Brokers APIs.
2. **Tax-Loss Harvesting Engine:** Automated capital gains tax optimization algorithms.
3. **Multi-Currency Global Expansion:** Expanded asset coverage across European and Asian equity markets.

---
*Created for FinWise AI Project Submission*
