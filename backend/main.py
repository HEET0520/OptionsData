# main.py (File Lookup Version)
import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# --- 1. App Initialization ---
app = FastAPI(
    title="Options Data API",
    description="An API to serve OHLC options data by looking up individual CSV files."
)

DATA_DIR = './flat_data'

# --- In-memory cache for validation ---
validation_cache = {
    "timeframes": set(),
    "scrips": set()
}

# --- 2. CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. Startup Event ---
@app.on_event("startup")
async def startup_event():
    """
    On app startup, scan the flat_data directory to populate the validation cache.
    """
    print("Scanning data directory to build cache...")
    if not os.path.exists(DATA_DIR):
        print(f"❌ Data directory not found: {DATA_DIR}. Please run the restructure_files.py script.")
        return

    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.csv'):
            try:
                # e.g., filename = 'SCRIP_CODE_1min.csv'
                parts = os.path.splitext(filename)[0].split('_')
                timeframe = parts[-1]
                scrip_code = '_'.join(parts[:-1])
                
                validation_cache["timeframes"].add(timeframe)
                validation_cache["scrips"].add(scrip_code)
            except IndexError:
                print(f"  -> Skipping malformed filename: {filename}")
    
    print(f"✅ Cache populated with {len(validation_cache['timeframes'])} timeframes and {len(validation_cache['scrips'])} scrips.")
    print("CACHE CONTENTS:", validation_cache)

# --- 4. API Endpoints ---
@app.get("/scrips")
async def get_all_scrips():
    """Returns a sorted list of all unique scrip codes from the cache."""
    return sorted(list(validation_cache["scrips"]))

@app.get("/ohlc/{timeframe}/{scrip_code}")
async def get_ohlc_data(timeframe: str, scrip_code: str):
    """
    Endpoint that finds and reads a specific CSV file.
    """
    # --- Input validation using the cache ---
    if timeframe not in validation_cache["timeframes"]:
        raise HTTPException(status_code=404, detail=f"Invalid timeframe specified: '{timeframe}'.")
        
    if scrip_code not in validation_cache["scrips"]:
        raise HTTPException(status_code=404, detail=f"Invalid scrip_code specified: '{scrip_code}'.")

    try:
        # Construct the filename to look for
        filename = f"{scrip_code}_{timeframe}.csv"
        file_path = os.path.join(DATA_DIR, filename)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Data file not found: {filename}")
        
        # Read the specific CSV file
        df = pd.read_csv(file_path)
        
        # Select and format the required columns
        df_selected = df[['datetime', 'open', 'high', 'low', 'close']].copy()
        df_selected.rename(columns={'datetime': 'time'}, inplace=True)
        
        # Convert to ISO format for JSON compatibility
        df_selected['time'] = pd.to_datetime(df_selected['time']).dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        return df_selected.to_dict(orient='records')
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing data file: {str(e)}")