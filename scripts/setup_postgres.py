import os
import sys
import urllib.request
import zipfile
import subprocess
import time

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTGRES_DIR = os.path.join(PROJECT_ROOT, "postgres")
ZIP_PATH = os.path.join(PROJECT_ROOT, "postgres.zip")
DOWNLOAD_URL = "https://sbp.enterprisedb.com/getfile.jsp?fileid=1260422"

def reporthook(blocknum, blocksize, totalsize):
    readsofar = blocknum * blocksize
    if totalsize > 0:
        percent = readsofar * 1e2 / totalsize
        s = f"\rDownloading: {percent:5.1f}% [{readsofar} / {totalsize} bytes]"
        sys.stdout.write(s)
        sys.stdout.flush()
    else:
        sys.stdout.write(f"\rDownloading: {readsofar} bytes")
        sys.stdout.flush()

def download_postgres():
    if os.path.exists(ZIP_PATH):
        print(f"Zip file already exists at {ZIP_PATH}, skipping download.")
        return
    print(f"Downloading PostgreSQL binary zip from {DOWNLOAD_URL}...")
    urllib.request.urlretrieve(DOWNLOAD_URL, ZIP_PATH, reporthook)
    print("\nDownload complete.")

def extract_postgres():
    if os.path.exists(POSTGRES_DIR):
        print(f"PostgreSQL directory already exists at {POSTGRES_DIR}, skipping extraction.")
        return
    
    print("Extracting zip archive...")
    temp_extract = os.path.join(PROJECT_ROOT, "temp_extract")
    os.makedirs(temp_extract, exist_ok=True)
    
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(temp_extract)
        
    # EDB zip contains a top-level 'pgsql' folder
    extracted_pgsql = os.path.join(temp_extract, "pgsql")
    if os.path.exists(extracted_pgsql):
        os.rename(extracted_pgsql, POSTGRES_DIR)
        print(f"Moved extracted pgsql to {POSTGRES_DIR}")
    else:
        print("Error: Could not find pgsql folder inside the zip archive.")
        sys.exit(1)
        
    # Clean up temp
    os.rmdir(temp_extract)
    print("Extraction complete. Cleaning up zip...")
    try:
        os.remove(ZIP_PATH)
        print("Removed postgres.zip")
    except Exception as e:
        print(f"Could not remove zip file: {e}")

def init_db():
    data_dir = os.path.join(POSTGRES_DIR, "data")
    if os.path.exists(data_dir):
        print(f"Data directory already exists at {data_dir}, skipping initdb.")
        return
        
    print("Initializing database cluster...")
    initdb_bin = os.path.join(POSTGRES_DIR, "bin", "initdb.exe")
    cmd = [initdb_bin, "-D", data_dir, "-U", "postgres", "-A", "trust"]
    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("Database cluster initialized successfully.")
    else:
        print("Error initializing database cluster:")
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)

def start_db():
    data_dir = os.path.join(POSTGRES_DIR, "data")
    pg_ctl_bin = os.path.join(POSTGRES_DIR, "bin", "pg_ctl.exe")
    log_file = os.path.join(POSTGRES_DIR, "server.log")
    
    # Check if running
    status_cmd = [pg_ctl_bin, "status", "-D", data_dir]
    status_res = subprocess.run(status_cmd, capture_output=True)
    if status_res.returncode == 0:
        print("PostgreSQL server is already running.")
        return
        
    print("Starting PostgreSQL server...")
    start_cmd = [pg_ctl_bin, "start", "-D", data_dir, "-o", "-p 5432", "-l", log_file]
    result = subprocess.run(start_cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("PostgreSQL server started.")
        time.sleep(3) # Wait for it to spin up
    else:
        print("Error starting PostgreSQL server:")
        print(result.stdout)
        print(result.stderr)
        sys.exit(1)

def create_database():
    createdb_bin = os.path.join(POSTGRES_DIR, "bin", "createdb.exe")
    cmd = [createdb_bin, "-U", "postgres", "-h", "localhost", "-p", "5432", "yieldsense_db"]
    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print("Database 'yieldsense_db' created successfully.")
    elif "already exists" in result.stderr or "already exists" in result.stdout:
        print("Database 'yieldsense_db' already exists.")
    else:
        print("Error creating database:")
        print(result.stdout)
        print(result.stderr)

if __name__ == "__main__":
    download_postgres()
    extract_postgres()
    init_db()
    start_db()
    create_database()
    print("\n--- PostgreSQL Local Portable Instance setup complete! ---")
