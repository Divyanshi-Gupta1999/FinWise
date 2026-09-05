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

def get_latest_dates_from_bq(client, table_ref):
    """
    Query BigQuery for the most recent period_date per indicator_code.
    Returns a dict: { 'FEDFUNDS': datetime.date(2026, 7, 1), ... }
    """
    try:
        query = f"SELECT indicator_code, MAX(period_date) as latest_date FROM `{table_ref}` GROUP BY indicator_code"
        result = client.query(query).result()
        return {row.indicator_code: row.latest_date for row in result}
    except Exception as e:
        print(f"  [BQ] Could not fetch latest dates: {e}")
        return {}


def delete_overlap_rows(client, table_ref, indicator_code, from_date):
    """Safety dedup: delete rows for this indicator from from_date onward."""
    try:
        query = f"DELETE FROM `{table_ref}` WHERE indicator_code = '{indicator_code}' AND period_date >= '{from_date}'"
        client.query(query).result()
    except Exception:
        pass


def main(incremental=False, dry_run=False):
    mode_label = "INCREMENTAL" if incremental else "FULL BACKFILL (TRUNCATE)"
    print(f"==================================================")
    print(f"  FinWise AI Macroeconomic Data Ingestion Engine  ")
    print(f"  Project: {PROJECT_ID} | Dataset: {DATASET_ID}")
    print(f"  Mode: {mode_label}")
    print(f"==================================================")

    creds = get_credentials()
    client = bigquery.Client(project=PROJECT_ID, credentials=creds)
    table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"

    # Get latest dates per indicator for incremental mode
    if incremental:
        latest_dates = get_latest_dates_from_bq(client, table_ref)
        print(f"\n  Found existing data for {len(latest_dates)} indicators in BigQuery.")
    else:
        latest_dates = {}

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
        rows = fetch_fred_series(code, name, cat, unit)
        if incremental:
            latest = latest_dates.get(code)
            if latest:
                rows = [r for r in rows if r["period_date"] > latest]
        if rows:
            all_rows.extend(rows)

    # 2. Market Sentiment, Currency & Volatility Indicators (Yahoo Finance)
    market_indicators = [
        ("^VIX", "VIX", "CBOE Volatility Index (Market Fear)", "Market Sentiment", "Index"),
        ("DX-Y.NYB", "DXY", "US Dollar Currency Index", "Currencies", "Index"),
        ("INR=X", "USDINR", "US Dollar to Indian Rupee Exchange Rate", "Currencies", "INR per USD"),
        ("CL=F", "CRUDE_OIL", "WTI Crude Oil Spot Price", "Commodities", "USD per Barrel"),
        ("^TNX", "US10Y", "US 10-Year Treasury Note Yield", "Interest Rates", "Percent")
    ]

    for sym, code, name, cat, unit in market_indicators:
        rows = fetch_market_indicator(sym, code, name, cat, unit)
        if incremental:
            latest = latest_dates.get(code)
            if latest:
                rows = [r for r in rows if r["period_date"] > latest]
        if rows:
            all_rows.extend(rows)

    if not all_rows:
        print("\nNo new macro rows to ingest. All indicators are up to date.")
        return

    if dry_run:
        print(f"\n  [DRY RUN] Would append {len(all_rows)} macro rows to {table_ref}.")
        return

    df_final = pd.DataFrame(all_rows)
    print(f"\nTotal Macro Records Collected: {len(df_final):,} rows.")

    if incremental:
        # Dedup safety: delete overlapping rows per indicator before appending
        indicators_to_update = set(r["indicator_code"] for r in all_rows)
        for code in indicators_to_update:
            code_rows = [r for r in all_rows if r["indicator_code"] == code]
            min_date = min(r["period_date"] for r in code_rows)
            delete_overlap_rows(client, table_ref, code, min_date)
        write_mode = "WRITE_APPEND"
    else:
        write_mode = "WRITE_TRUNCATE"

    schema = [
        bigquery.SchemaField("indicator_code", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("indicator_name", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("category", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("period_date", "DATE", mode="REQUIRED"),
        bigquery.SchemaField("value", "FLOAT", mode="REQUIRED"),
        bigquery.SchemaField("unit", "STRING", mode="NULLABLE"),
    ]

    job_config = bigquery.LoadJobConfig(
        schema=schema,
        write_disposition=write_mode,
    )

    print(f"\nUploading {len(df_final):,} macro records to BigQuery table: {table_ref} ({write_mode})...")
    job = client.load_table_from_dataframe(df_final, table_ref, job_config=job_config)
    job.result()

    print(f"SUCCESS! Loaded {job.output_rows:,} records into {table_ref}.")

if __name__ == "__main__":
    import sys
    is_incremental = "--incremental" in sys.argv
    is_dry_run = "--dry-run" in sys.argv
    main(incremental=is_incremental, dry_run=is_dry_run)

