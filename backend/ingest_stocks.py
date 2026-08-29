import yfinance as yf
import pandas as pd
from google.cloud import bigquery
import datetime
import subprocess
import concurrent.futures
from google.oauth2.credentials import Credentials

PROJECT_ID = "finwise-506509"
DATASET_ID = "finwise_data"
TABLE_ID = "individual_stock_history"

# Expanded Universe of 130+ Assets across US & Indian Markets (2005 - 2026)
STOCKS = {
    # Gold & Silver Commodities & Mining
    "Gold / Silver - Gold ETFs": [
        {"symbol": "GOLDBEES.NS", "name": "Nippon India ETF Gold BeES"},
        {"symbol": "SETFGOLD.NS", "name": "SBI Gold ETF"},
        {"symbol": "AXISGOLD.NS", "name": "Axis Gold ETF"},
        {"symbol": "HDFCMFGETF.NS", "name": "HDFC Gold ETF"},
        {"symbol": "GLD", "name": "SPDR Gold Shares"},
        {"symbol": "IAU", "name": "iShares Gold Trust"}
    ],
    "Gold / Silver - Silver ETFs": [
        {"symbol": "SILVERBEES.NS", "name": "Nippon India ETF Silver BeES"},
        {"symbol": "HDFCSILVER.NS", "name": "HDFC Silver ETF"},
        {"symbol": "ICICISILVE.NS", "name": "ICICI Prudential Silver ETF"},
        {"symbol": "SLV", "name": "iShares Silver Trust"}
    ],
    "Gold / Silver - Mining": [
        {"symbol": "GDX", "name": "VanEck Gold Miners ETF"},
        {"symbol": "GDXJ", "name": "VanEck Junior Gold Miners ETF"},
        {"symbol": "NEM", "name": "Newmont Corporation"},
        {"symbol": "GOLD", "name": "Barrick Gold Corporation"}
    ],

    # Bonds & Fixed Income Instruments
    "Bonds - Government & Treasury": [
        {"symbol": "TLT", "name": "iShares 20+ Year Treasury Bond ETF"},
        {"symbol": "IEF", "name": "iShares 7-10 Year Treasury Bond ETF"},
        {"symbol": "SHY", "name": "iShares 1-3 Year Treasury Bond ETF"},
        {"symbol": "GILT5YBEES.NS", "name": "Nippon India ETF 5Y G-Sec"},
        {"symbol": "SETF10GILT.NS", "name": "SBI ETF 10 Year Gilt"}
    ],
    "Bonds - Corporate & Aggregate": [
        {"symbol": "BND", "name": "Vanguard Total Bond Market ETF"},
        {"symbol": "AGG", "name": "iShares Core U.S. Aggregate Bond ETF"},
        {"symbol": "LQD", "name": "iShares Investment Grade Corporate Bond ETF"},
        {"symbol": "HYG", "name": "iShares High Yield Corporate Bond ETF"},
        {"symbol": "LIQUIDBEES.NS", "name": "Nippon India ETF Liquid BeES"}
    ],

    # Broad Index Funds & ETFs
    "Mutual Funds / ETFs - Index": [
        {"symbol": "SPY", "name": "SPDR S&P 500 ETF Trust"},
        {"symbol": "QQQ", "name": "Invesco QQQ Trust"},
        {"symbol": "VOO", "name": "Vanguard S&P 500 ETF"},
        {"symbol": "DIA", "name": "SPDR Dow Jones Industrial Average ETF"},
        {"symbol": "IWM", "name": "iShares Russell 2000 ETF"},
        {"symbol": "EEM", "name": "iShares MSCI Emerging Markets ETF"},
        {"symbol": "NIFTYBEES.NS", "name": "Nippon India ETF Nifty 50 BeES"},
        {"symbol": "BANKBEES.NS", "name": "Nippon India ETF Nifty Bank BeES"},
        {"symbol": "JUNIORBEES.NS", "name": "Nippon India ETF Nifty Next 50 BeES"},
        {"symbol": "MID150BEES.NS", "name": "Nippon India ETF Nifty Midcap 150"}
    ],

    # US Equities - Technology & AI
    "US Equity - Technology": [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corp."},
        {"symbol": "NVDA", "name": "NVIDIA Corp."},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "META", "name": "Meta Platforms"},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."},
        {"symbol": "AVGO", "name": "Broadcom Inc."},
        {"symbol": "ADBE", "name": "Adobe Inc."},
        {"symbol": "CRM", "name": "Salesforce Inc."},
        {"symbol": "AMD", "name": "Advanced Micro Devices"},
        {"symbol": "QCOM", "name": "QUALCOMM Inc."},
        {"symbol": "ORCL", "name": "Oracle Corporation"},
        {"symbol": "INTC", "name": "Intel Corporation"},
        {"symbol": "TXN", "name": "Texas Instruments"}
    ],

    # US Equities - Financials
    "US Equity - Finance": [
        {"symbol": "JPM", "name": "JPMorgan Chase & Co."},
        {"symbol": "BAC", "name": "Bank of America"},
        {"symbol": "WFC", "name": "Wells Fargo & Co."},
        {"symbol": "C", "name": "Citigroup Inc."},
        {"symbol": "GS", "name": "Goldman Sachs Group"},
        {"symbol": "MS", "name": "Morgan Stanley"},
        {"symbol": "BLK", "name": "BlackRock Inc."},
        {"symbol": "V", "name": "Visa Inc."},
        {"symbol": "MA", "name": "Mastercard Inc."},
        {"symbol": "AXP", "name": "American Express"},
        {"symbol": "PYPL", "name": "PayPal Holdings"},
        {"symbol": "SCHW", "name": "Charles Schwab Corp."}
    ],

    # US Equities - Healthcare & Biotech
    "US Equity - Healthcare": [
        {"symbol": "LLY", "name": "Eli Lilly and Co."},
        {"symbol": "UNH", "name": "UnitedHealth Group"},
        {"symbol": "JNJ", "name": "Johnson & Johnson"},
        {"symbol": "ABBV", "name": "AbbVie Inc."},
        {"symbol": "MRK", "name": "Merck & Co."},
        {"symbol": "PFE", "name": "Pfizer Inc."},
        {"symbol": "TMO", "name": "Thermo Fisher Scientific"},
        {"symbol": "ABT", "name": "Abbott Laboratories"},
        {"symbol": "DHR", "name": "Danaher Corp."},
        {"symbol": "BMY", "name": "Bristol-Myers Squibb"}
    ],

    # US Equities - Consumer, Energy & Industrials
    "US Equity - Consumer & Industrials": [
        {"symbol": "WMT", "name": "Walmart Inc."},
        {"symbol": "COST", "name": "Costco Wholesale Corp."},
        {"symbol": "HD", "name": "Home Depot Inc."},
        {"symbol": "MCD", "name": "McDonald's Corp."},
        {"symbol": "NKE", "name": "NIKE Inc."},
        {"symbol": "PG", "name": "Procter & Gamble"},
        {"symbol": "KO", "name": "Coca-Cola Company"},
        {"symbol": "PEP", "name": "PepsiCo Inc."},
        {"symbol": "XOM", "name": "Exxon Mobil Corp."},
        {"symbol": "CVX", "name": "Chevron Corporation"},
        {"symbol": "CAT", "name": "Caterpillar Inc."},
        {"symbol": "GE", "name": "General Electric"},
        {"symbol": "BA", "name": "Boeing Company"},
        {"symbol": "HON", "name": "Honeywell International"},
        {"symbol": "UNP", "name": "Union Pacific Corp."}
    ],

    # Indian Equities - Information Technology
    "IN Equity - Technology": [
        {"symbol": "TCS.NS", "name": "Tata Consultancy Services"},
        {"symbol": "INFY.NS", "name": "Infosys Ltd"},
        {"symbol": "HCLTECH.NS", "name": "HCL Technologies"},
        {"symbol": "WIPRO.NS", "name": "Wipro Ltd"},
        {"symbol": "TECHM.NS", "name": "Tech Mahindra"},
        {"symbol": "LTIM.NS", "name": "LTIMindtree Ltd"},
        {"symbol": "PERSISTENT.NS", "name": "Persistent Systems"},
        {"symbol": "COFORGE.NS", "name": "Coforge Ltd"}
    ],

    # Indian Equities - Banking & Financial Services
    "IN Equity - Finance": [
        {"symbol": "HDFCBANK.NS", "name": "HDFC Bank"},
        {"symbol": "ICICIBANK.NS", "name": "ICICI Bank"},
        {"symbol": "SBIN.NS", "name": "State Bank of India"},
        {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank"},
        {"symbol": "AXISBANK.NS", "name": "Axis Bank"},
        {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance"},
        {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv"},
        {"symbol": "HDFCLIFE.NS", "name": "HDFC Life Insurance"},
        {"symbol": "SBILIFE.NS", "name": "SBI Life Insurance"},
        {"symbol": "INDUSINDBK.NS", "name": "IndusInd Bank"}
    ],

    # Indian Equities - Energy, Auto & Infrastructure
    "IN Equity - Energy & Industrials": [
        {"symbol": "RELIANCE.NS", "name": "Reliance Industries"},
        {"symbol": "ONGC.NS", "name": "Oil & Natural Gas Corp"},
        {"symbol": "NTPC.NS", "name": "NTPC Ltd"},
        {"symbol": "POWERGRID.NS", "name": "Power Grid Corporation"},
        {"symbol": "BPCL.NS", "name": "Bharat Petroleum"},
        {"symbol": "COALINDIA.NS", "name": "Coal India"},
        {"symbol": "TATAMOTORS.NS", "name": "Tata Motors"},
        {"symbol": "MARUTI.NS", "name": "Maruti Suzuki India"},
        {"symbol": "M&M.NS", "name": "Mahindra & Mahindra"},
        {"symbol": "BAJAJ-AUTO.NS", "name": "Bajaj Auto"},
        {"symbol": "LT.NS", "name": "Larsen & Toubro"},
        {"symbol": "ADANIENT.NS", "name": "Adani Enterprises"},
        {"symbol": "ADANIPORTS.NS", "name": "Adani Ports & SEZ"}
    ],

    # Indian Equities - Consumer, Pharma & Materials
    "IN Equity - Consumer & Pharma": [
        {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever"},
        {"symbol": "ITC.NS", "name": "ITC Ltd"},
        {"symbol": "NESTLEIND.NS", "name": "Nestle India"},
        {"symbol": "BRITANNIA.NS", "name": "Britannia Industries"},
        {"symbol": "TITAN.NS", "name": "Titan Company"},
        {"symbol": "ASIANPAINT.NS", "name": "Asian Paints"},
        {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical"},
        {"symbol": "DRREDDY.NS", "name": "Dr. Reddy's Laboratories"},
        {"symbol": "CIPLA.NS", "name": "Cipla Ltd"},
        {"symbol": "DIVISLAB.NS", "name": "Divi's Laboratories"},
        {"symbol": "APOLLOHOSP.NS", "name": "Apollo Hospitals"},
        {"symbol": "TATASTEEL.NS", "name": "Tata Steel"},
        {"symbol": "JSWSTEEL.NS", "name": "JSW Steel"},
        {"symbol": "HINDALCO.NS", "name": "Hindalco Industries"},
        {"symbol": "GRASIM.NS", "name": "Grasim Industries"}
    ]
}

def get_credentials():
    try:
        token = subprocess.check_output(["gcloud", "auth", "print-access-token"]).decode('utf-8').strip()
        return Credentials(token)
    except Exception as e:
        print(f"Failed to get gcloud token: {e}")
        return None

def fetch_single_ticker(stock_info, category, start_date_str, end_date_str):
    sym = stock_info["symbol"]
    name = stock_info["name"]
    try:
        ticker = yf.Ticker(sym)
        df = ticker.history(start=start_date_str, end=end_date_str, auto_adjust=True)
        if df.empty:
            return []
        
        df = df.reset_index()
        # Ensure date format is clean YYYY-MM-DD
        df['Date'] = pd.to_datetime(df['Date']).dt.tz_localize(None).dt.date
        
        rows = []
        for _, row in df.iterrows():
            close_val = float(row["Close"])
            vol_val = int(row["Volume"]) if pd.notnull(row["Volume"]) else 0
            if pd.notnull(close_val) and close_val > 0:
                rows.append({
                    "symbol": sym,
                    "name": name,
                    "category": category,
                    "trade_date": row["Date"],
                    "close_price": round(close_val, 4),
                    "volume": vol_val
                })
        return rows
    except Exception as e:
        print(f"  [Error] {sym}: {e}")
        return []

def fetch_and_upload():
    print(f"==================================================")
    print(f"  FinWise AI Massive BigQuery Ingestion Pipeline  ")
    print(f"  Project: {PROJECT_ID} | Dataset: {DATASET_ID}")
    print(f"==================================================")
    
    creds = get_credentials()
    client = bigquery.Client(project=PROJECT_ID, credentials=creds)
    
    # 20+ Years Historical Window (2005 - Present)
    start_date = "2005-01-01"
    end_date = datetime.datetime.now().strftime("%Y-%m-%d")
    
    tasks = []
    for category, stocks in STOCKS.items():
        for stock in stocks:
            tasks.append((stock, category))
            
    print(f"Starting multi-threaded download for {len(tasks)} assets from {start_date} to {end_date}...")
    
    all_data = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        future_to_stock = {
            executor.submit(fetch_single_ticker, stock, cat, start_date, end_date): stock["symbol"]
            for stock, cat in tasks
        }
        
        completed_count = 0
        for future in concurrent.futures.as_completed(future_to_stock):
            sym = future_to_stock[future]
            try:
                data = future.result()
                all_data.extend(data)
                completed_count += 1
                if completed_count % 15 == 0 or completed_count == len(tasks):
                    print(f"  Progress: {completed_count}/{len(tasks)} assets processed ({len(all_data):,} rows collected)...")
            except Exception as exc:
                print(f"  {sym} generated an exception: {exc}")

    if not all_data:
        print("No data collected.")
        return

    df_final = pd.DataFrame(all_data)
    print(f"\nTotal rows collected: {len(df_final):,} rows across {len(tasks)} assets.")
    
    schema = [
        bigquery.SchemaField("symbol", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("name", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("category", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("trade_date", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("close_price", "FLOAT", mode="REQUIRED"),
        bigquery.SchemaField("volume", "INTEGER", mode="NULLABLE"),
    ]
    
    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"
    
    job_config = bigquery.LoadJobConfig(
        schema=schema,
        write_disposition="WRITE_TRUNCATE",
    )
    
    print(f"\nUploading {len(df_final):,} records to BigQuery table: {table_ref}...")
    job = client.load_table_from_dataframe(df_final, table_ref, job_config=job_config)
    job.result()
    
    print(f"SUCCESS! Successfully loaded {job.output_rows:,} rows into {table_ref}.")

if __name__ == "__main__":
    fetch_and_upload()
