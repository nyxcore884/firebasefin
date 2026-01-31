import os

log_path = "firebase-debug.log"
if os.path.exists(log_path):
    with open(log_path, 'r') as f:
        lines = f.readlines()
        # Find the last "Error: An unexpected error has occurred"
        last_error_idx = -1
        for i, line in enumerate(reversed(lines)):
            if "Error: An unexpected error has occurred" in line:
                last_error_idx = len(lines) - 1 - i
                break
        
        if last_error_idx != -1:
            # Print 50 lines before and after
            start = max(0, last_error_idx - 50)
            end = min(len(lines), last_error_idx + 50)
            for i in range(start, end):
                print(lines[i].strip())
        else:
            print("No error found in log.")
else:
    print("Log file not found.")
