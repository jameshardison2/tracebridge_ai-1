import os
import zipfile
import urllib.request
import json
import ijson
import shutil

URL = "https://download.open.fda.gov/device/510k/device-510k-0001-of-0001.json.zip"
ZIP_PATH = "device-510k.zip"
EXTRACT_DIR = "fda_temp"
OUTPUT_FILE = "spark-deliverables/Evaluation_Dataset/fda_510k_filtered.jsonl"

TARGET_COMMITTEES = [
    "Software", 
    "Cardiovascular", 
    "Orthopedic", 
    "Radiology", 
    "General Hospital", 
    "Neurology", 
    "Anesthesiology"
]

def download_data():
    print("Downloading openFDA 510(k) dataset (~245MB)...")
    os.system(f"curl -k -L -o {ZIP_PATH} {URL}")
    print("Download complete.")

def extract_data():
    print("Extracting ZIP file...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(EXTRACT_DIR)
    print("Extraction complete.")

def filter_and_write():
    print(f"Filtering for categories: {', '.join(TARGET_COMMITTEES)}...")
    json_filename = None
    for f in os.listdir(EXTRACT_DIR):
        if f.endswith('.json'):
            json_filename = os.path.join(EXTRACT_DIR, f)
            break
            
    if not json_filename:
        raise Exception("No JSON file found in extracted zip.")

    matched_records = 0
    total_records = 0
    
    with open(json_filename, 'rb') as f_in, open(OUTPUT_FILE, 'w', encoding='utf-8') as f_out:
        # ijson parses the "results" array iteratively
        objects = ijson.items(f_in, 'results.item')
        for record in objects:
            total_records += 1
            committee = record.get("advisory_committee_description", "")
            if not committee:
                openfda = record.get("openfda", {})
                committee = openfda.get("medical_specialty_description", "")
                if isinstance(committee, list) and len(committee) > 0:
                    committee = committee[0]
            
            if not isinstance(committee, str):
                continue
                
            committee_upper = committee.upper()
            
            # Check if it matches any target
            is_match = any(target.upper() in committee_upper for target in TARGET_COMMITTEES)
            
            if is_match:
                f_out.write(json.dumps(record) + '\n')
                matched_records += 1
                
            if total_records % 10000 == 0:
                print(f"Processed {total_records} records... (Matches found: {matched_records})")

    print(f"Filtering complete! Found {matched_records} matches out of {total_records} total records.")
    return matched_records

def cleanup():
    print("Cleaning up intermediate files...")
    if os.path.exists(ZIP_PATH):
        os.remove(ZIP_PATH)
    if os.path.exists(EXTRACT_DIR):
        shutil.rmtree(EXTRACT_DIR)
    
    # Remove the old fda_precedents.jsonl if it exists to avoid confusion
    old_file = "spark-deliverables/Evaluation_Dataset/fda_precedents.jsonl"
    if os.path.exists(old_file):
        os.remove(old_file)
        
    print("Cleanup complete.")

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    download_data()
    extract_data()
    filter_and_write()
    cleanup()
