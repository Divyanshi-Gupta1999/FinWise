"""
FinWise AI — Cloud Function Entry Point
=========================================
Google Cloud Function (2nd gen, Python 3.11+) that wraps the daily
BigQuery ingestion pipeline. Triggered via Cloud Scheduler HTTP.

Deploy with:
  ./deploy/deploy.sh
"""

import functions_framework
import json
import sys
import os

# Add parent directories to path so pipeline modules can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@functions_framework.http
def daily_ingest(request):
    """
    HTTP Cloud Function entry point.
    Runs the full daily pipeline and returns a JSON summary.
    
    Query params:
      ?dry-run=true   — Preview mode, no writes
    """
    from pipelines.ingest_daily import run_all

    dry_run = request.args.get("dry-run", "false").lower() == "true"

    try:
        result = run_all(dry_run=dry_run)
        status_code = 200 if result.get("overall_success") else 500
        return (json.dumps(result, default=str), status_code, {"Content-Type": "application/json"})
    except Exception as e:
        error_response = {
            "pipeline": "finwise-daily-ingest",
            "overall_success": False,
            "error": str(e),
        }
        return (json.dumps(error_response), 500, {"Content-Type": "application/json"})
