# main.py
import os
import pandas as pd
import requests
import tarfile  # Use tarfile for .tar.gz archives
import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# --- App Initialization ---
app = FastAPI(title="Options Data API")
DATA_DIR = os.getenv('DATA_DIR', './flat_data')
validation_cache = {"timeframes": set(), "scrips": set()}

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Startup & Shutdown Events ---
@app.on_event("startup")
async def startup_event():
    """On startup, download data if needed, then scan the directory to build the cache."""
    if not os.path.exists(DATA_DIR):
        print("Data directory not found. Downloading...")
        DATA_URL = os.getenv("DATA_URL")
        if not DATA_URL:
            print("❌ DATA_URL environment variable is not set. Cannot download data.")
            return
        try:
            response = requests.get(DATA_URL)
            response.raise_for_status()
            
            # Use tarfile to open and extract the .tar.gz file in memory
            with tarfile.open(fileobj=io.BytesIO(response.content), mode="r:gz") as tar:
                tar.extractall('.')
            
            print("✅ Data downloaded and extracted.")
        except Exception as e:
            print(f"❌ Failed to download or extract data: {e}")
            return
    
    print("Scanning data directory to build cache...")
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.csv'):
            try:
                parts = os.path.splitext(filename)[0].split('_')
                timeframe = parts[-1]
                scrip_code = '_'.join(parts[:-1])
                validation_cache["timeframes"].add(timeframe)
                validation_cache["scrips"].add(scrip_code)
            except IndexError:
                print(f"  -> Skipping malformed filename: {filename}")
    
    print(f"✅ Cache populated with {len(validation_cache['timeframes'])} timeframes and {len(validation_cache['scrips'])} scrips.")

# --- API Endpoints ---
@app.get("/scrips")
async def get_all_scrips():
    """Returns a sorted list of all unique scrip codes."""
    return sorted(list(validation_cache["scrips"]))

@app.get("/ohlc/{timeframe}/{scrip_code}")
async def get_ohlc_data(timeframe: str, scrip_code: str):
    """Finds a specific CSV, reads it, and returns OHLC, volume, and OI data."""
    if timeframe not in validation_cache["timeframes"]:
        raise HTTPException(status_code=404, detail=f"Invalid timeframe specified: '{timeframe}'.")
    if scrip_code not in validation_cache["scrips"]:
        raise HTTPException(status_code=404, detail=f"Invalid scrip_code specified: '{scrip_code}'.")

    try:
        filename = f"{scrip_code}_{timeframe}.csv"
        file_path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Data file not found: {filename}")
        
        df = pd.read_csv(file_path)
        
        df_selected = df[['datetime', 'open', 'high', 'low', 'close', 'open_interest', 'volume']].copy()
        
        df_selected.rename(columns={'datetime': 'time'}, inplace=True)
        df_selected['time'] = pd.to_datetime(df_selected['time']).dt.strftime('%Y-%m-%dT%H:%M:%SZ')
        df_selected.fillna(0, inplace=True)
        
        return df_selected.to_dict(orient='records')
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing data file: {str(e)}")