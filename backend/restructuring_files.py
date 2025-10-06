# restructure_files.py
import os
import glob
import shutil

SOURCE_DIR = './data'
DEST_DIR = './flat_data'

def restructure():
    """
    Renames all CSVs to include their timeframe and moves them
    to a single flat directory.
    """
    # --- NEW: Create a list to store failed files ---
    failed_files = []

    if not os.path.exists(DEST_DIR):
        os.makedirs(DEST_DIR)
        print(f"Created destination directory: {DEST_DIR}")

    search_pattern = os.path.join(SOURCE_DIR, '**', '*.csv')
    csv_files = glob.glob(search_pattern, recursive=True)

    if not csv_files:
        print(f"No CSV files found in {SOURCE_DIR}. Exiting.")
        return

    print(f"Found {len(csv_files)} files to process...")

    for file_path in csv_files:
        try:
            # e.g., file_path = './data/1min/SCRIPT.csv'

            # Get the parent folder name (e.g., '1min')
            timeframe = os.path.basename(os.path.dirname(file_path))

            # Get the filename without extension (e.g., 'SCRIPT')
            scrip_code = os.path.splitext(os.path.basename(file_path))[0]

            # Create the new filename
            new_filename = f"{scrip_code}_{timeframe}.csv"
            dest_path = os.path.join(DEST_DIR, new_filename)

            # Copy the file to the new location with the new name
            shutil.copy(file_path, dest_path)

            print(f"  -> Created: {new_filename}")

        except Exception as e:
            print(f"  -> FAILED to process {file_path}. Error: {e}")
            # --- NEW: Add the failed file to our list ---
            failed_files.append(file_path)

    print(f"\n✅ Restructuring complete. All files are in {DEST_DIR}")

    # --- NEW: Print the summary of failed files at the end ---
    if failed_files:
        print("\n----------------------------------")
        print("--- Summary of Failed Files ---")
        for f_path in failed_files:
            print(f_path)
        print("----------------------------------")


if __name__ == "__main__":
    restructure()