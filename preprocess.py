import pandas as pd
import os
from pathlib import Path

def preprocess_ohlcv_dataframe(df):
    """
    Preprocess a single OHLCV DataFrame to ensure consistent 5-minute intervals.
    """
    # Convert datetime column to datetime format if it's not already
    if not pd.api.types.is_datetime64_any_dtype(df['datetime']):
        df['datetime'] = pd.to_datetime(df['datetime'])
    
    # Sort by datetime
    df = df.sort_values('datetime')
    
    # Remove duplicates
    df = df.drop_duplicates(subset=['datetime'])
    
    # Get first and last datetime
    start_time = df['datetime'].min()
    end_time = df['datetime'].max()
    
    # Generate full 5-minute time range between start and end
    all_times = []
    current_date = start_time.date()
    end_date = end_time.date()
    
    while current_date <= end_date:
        if current_date.weekday() < 5:  # Only weekdays
            for hour in range(9, 16):
                for minute in range(0, 60, 1):
                    if hour == 9 and minute < 15:
                        continue
                    if hour == 15 and minute > 25:
                        continue
                    
                    ts = pd.Timestamp(
                        year=current_date.year,
                        month=current_date.month,
                        day=current_date.day,
                        hour=hour,
                        minute=minute
                    )
                    if start_time <= ts <= end_time:
                        all_times.append(ts)
        current_date += pd.Timedelta(days=1)
    
    complete_df = pd.DataFrame({'datetime': all_times})
    merged_df = pd.merge(complete_df, df, on='datetime', how='left')
    
    # Forward fill + backward fill for missing values
    filled_df = merged_df.sort_values('datetime').ffill().bfill()
    
    return filled_df.drop_duplicates(subset=['datetime'])

def main():
    # Input and output folders
    input_folder = "E:/Clearmind/SEPT data with ui/DATA"   # change as needed
    output_folder = "1min"
    
    # Create output folder if not exists
    Path(output_folder).mkdir(parents=True, exist_ok=True)
    
    # Process all CSV files in input folder
    for file in os.listdir(input_folder):
        if file.endswith(".csv"):
            try:
                symbol = os.path.splitext(file)[0]
                input_file = os.path.join(input_folder, file)
                output_file = os.path.join(output_folder, file)
                
                print(f"Processing {symbol}...")
                
                df = pd.read_csv(input_file)
                
                required_columns = ['close', 'datetime', 'high', 'low', 'open', 
                                    'open_interest', 'volume', 'scrip_code', 
                                    'expiry_type', 'expiry_date']
                
                missing_columns = [c for c in required_columns if c not in df.columns]
                if missing_columns:
                    print(f"⚠️ Skipping {symbol}, missing columns: {missing_columns}")
                    continue
                
                processed_df = preprocess_ohlcv_dataframe(df)
                processed_df.to_csv(output_file, index=False)
                
                print(f"✅ Saved {symbol} -> {output_file}")
            
            except Exception as e:
                print(f"❌ Error processing {file}: {e}")

if __name__ == "__main__":
    main()
