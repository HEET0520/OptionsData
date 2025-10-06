import pandas as pd
import os
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ====== RESAMPLER ======
def resample_ohlcv(df, frequency, offset="15min"):
    df = df.set_index("datetime")

    aggregation = {
        "open": "first",
        "high": "max",
        "low": "min",
        "close": "last",
        "volume": "sum",
        "open_interest": "sum",
        "scrip_code": "last"
    }

    df_resampled = (
        df.resample(frequency, origin="epoch", offset=offset)
        .agg(aggregation)
        .dropna()
    )

    return df_resampled.reset_index()


# ====== PROCESS ALL FILES IN FOLDER ======
def process_folder(input_folder, timeframes):
    files = [f for f in os.listdir(input_folder) if f.endswith(".csv")]
    total_files = len(files)
    logger.info(f"Found {total_files} files to process in {input_folder}")

    for i, filename in enumerate(files, 1):
        input_file_path = os.path.join(input_folder, filename)

        logger.info(f"Processing {i}/{total_files}: {filename}")

        try:
            df = pd.read_csv(input_file_path)
            df["datetime"] = pd.to_datetime(df["datetime"])
            df = df.sort_values("datetime")

            logger.info(f"  Original: {df.shape}")

            # Process for each timeframe
            for label, freq in timeframes.items():
                output_folder = os.path.join(os.path.dirname(input_folder), label)
                os.makedirs(output_folder, exist_ok=True)

                df_resampled = resample_ohlcv(df, frequency=freq)

                output_file_path = os.path.join(output_folder, filename)
                df_resampled.to_csv(output_file_path, index=False)

                logger.info(f"    ✓ {label}: {df_resampled.shape} → {output_file_path}")

        except Exception as e:
            logger.error(f"  ✗ Error processing {filename}: {e}")


# ====== MAIN ======
def main():
    # just point to your 1min folder
    input_folder = "backend/data/1min"

    # Define target timeframes
    timeframes = {
        "5min": "5min",
        "30min": "30min",
        "1hour": "60min",
        "1d": "1D"
    }

    if not os.path.exists(input_folder):
        logger.error(f"Input folder not found: {input_folder}")
        return

    logger.info(f"Processing {input_folder}")
    process_folder(input_folder, timeframes)


if __name__ == "__main__":
    main()
