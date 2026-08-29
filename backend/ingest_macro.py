import yfinance as yf
import pandas as pd
import requests
import datetime
import subprocess
from google.cloud import bigquery
from google.oauth2.credentials import Credentials

PROJECT_ID = "finwise-506509"
DATASET_ID = "finwise_data"
TABLE_ID = "macro_economic_indicators"

def get_credentials():
    try:
        token = subprocess.check_output(["gcloud", "auth", "print-access-token"]).decode('utf-8').strip()
        return Credentials(token)
    except Exception as e:
        print(f"Failed to get gcloud token: {e}")
        return None

def fetch_fred_series(series_id, indicator_name, category, unit):
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
    try:
        df = pd.read_csv(url)
        df.columns = ["DATE", "VALUE"]
        df["VALUE"] = pd.to_numeric(df["VALUE"], errors="coerce")
        df = df.dropna()
        df["DATE"] = pd.to_datetime(df["DATE"]).dt.date
        
        # Filter 2000 to present
        df = df[df["DATE"] >= datetime.date(2000, 1, 1)]
        
        rows = []
        for _, r in df.iterrows():
            rows.append({
                "indicator_code": series_id,
                "indicator_name": indicator_name,
                "category": category,
                "period_date": r["DATE"],
                "value": round(float(r["VALUE"]), 4),
                "unit": unit
            })
        print(f"  [FRED] {series_id} ({indicator_name}): {len(rows):,} records fetched.")
        return rows
    except Exception as e:
        print(f"  [Error FRED] {series_id}: {e}")
        return []

def fetch_market_indicator(symbol, indicator_code, indicator_name, category, unit):
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(start="2000-01-01", auto_adjust=True)
        if df.empty:
            return []
        df = df.reset_index()
        df["Date"] = pd.to_datetime(df["Date"]).dt.tz_localize(None).dt.date
        
        rows = []
        for _, r in df.iterrows():
            val = float(r["Close"])
            if pd.notnull(val) and val > 0:
                rows.append({
                    "indicator_code": indicator_code,
                    "indicator_name": indicator_name,
                    "category": category,
                    "period_date": r["Date"],
                    "value": round(val, 4),
                    "unit": unit
                })
        print(f"  [Market] {indicator_code} ({indicator_name}): {len(rows):,} records fetched.")
        return rows
    except Exception as e:
        print(f"  [Error Market] {symbol}: {e}")
        return []

def main():
    print(f"==================================================")
    print(f"  FinWise AI Macroeconomic Data Ingestion Engine  ")
    print(f"  Project: {PROJECT_ID} | Dataset: {DATASET_ID}")
    print(f"==================================================")

    all_rows = []

    # 1. Federal Reserve & Economic Data (FRED)
    fred_indicators = [
        ("CPIAUCSL", "Consumer Price Index (CPI Inflation)", "Inflation", "Index"),
        ("CPILFESL", "Core CPI (Ex-Food & Energy)", "Inflation", "Index"),
        ("FEDFUNDS", "Federal Funds Effective Rate", "Monetary Policy", "Percent"),
        ("T10Y2Y", "10Y Minus 2Y Treasury Yield Spread", "Yield Curve", "Percent Spread"),
        ("T10Y3M", "10Y Minus 3M Treasury Yield Spread", "Yield Curve", "Percent Spread"),
        ("UNRATE", "US Civilian Unemployment Rate", "Labor Market", "Percent"),
        ("M2SL", "M2 Money Supply", "Liquidity", "Billions USD"),
        ("DGS10", "10-Year Treasury Constant Maturity Rate", "Interest Rates", "Percent"),
        ("DGS2", "2-Year Treasury Constant Maturity Rate", "Interest Rates", "Percent"),
    ]

    for code, name, cat, unit in fred_indicators:
        all_rows.extend(fetch_fred_series(code, name, cat, unit))

    # 2. Market Sentiment, Currency & Volatility Indicators (Yahoo Finance)
    market_indicators = [
        ("^VIX", "VIX", "CBOE Volatility Index (Market Fear)", "Market Sentiment", "Index"),
        ("DX-Y.NYB", "DXY", "US Dollar Currency Index", "Currencies", "Index"),
        ("INR=X", "USDINR", "US Dollar to Indian Rupee Exchange Rate", "Currencies", "INR per USD"),
        ("CL=F", "CRUDE_OIL", "WTI Crude Oil Spot Price", "Commodities", "USD per Barrel"),
        ("^TNX", "US10Y", "US 10-Year Treasury Note Yield", "Interest Rates", "Percent")
    ]

    for sym, code, name, cat, unit in market_indicators:
        all_rows.extend(fetch_market_indicator(sym, code, name, cat, unit))

    if not all_rows:
        print("No macro rows collected.")
        return

    df_final = pd.DataFrame(all_rows)
    print(f"\nTotal Macro Records Collected: {len(df_final):,} rows.")

    schema = [
        bigquery.SchemaField("indicator_code", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("indicator_name", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("category", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("period_date", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("value", "FLOAT", mode="REQUIRED"),
        bigquery.SchemaField("unit", "STRING", mode="NULLABLE"),
    ]

    creds = get_credentials()
    client = bigquery.Client(project=PROJECT_ID, credentials=creds)
    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"

    job_config = bigquery.LoadJobConfig(
        schema=schema,
        write_disposition="WRITE_TRUNCATE",
    )

    print(f"\nUploading {len(df_final):,} macro records to BigQuery table: {table_ref}...")
    job = client.load_table_from_dataframe(df_final, table_ref, job_config=job_config)
    job.result()

    print(f"SUCCESS! Loaded {job.output_rows:,} records into {table_ref}.")

if __name__ == "__main__":
    main()
