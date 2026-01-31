import os
import sys
from google.cloud import storage

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def verify_storage():
    try:
        client = storage.Client()
        project_id = client.project
        print(f"Verifying Storage for Project: {project_id}")
        
        buckets = list(client.list_buckets())
        print(f"\nActive Buckets ({len(buckets)}):")
        
        for bucket in buckets:
            blobs = list(client.list_blobs(bucket))
            status = "EMPTY" if len(blobs) == 0 else f"{len(blobs)} files"
            print(f"  [x] {bucket.name} - {status}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_storage()
