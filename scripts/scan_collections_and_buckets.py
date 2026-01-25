#!/usr/bin/env python3
import sys
import re
import json
from pathlib import Path

RE_COLLECTION = re.compile(r"\.collection\s*\(\s*['\"]([^'\"]+)['\"]\s*\)")
RE_COLLECTION_FN = re.compile(r"collection\s*\(\s*['\"]([^'\"]+)['\"]\s*\)")
RE_BUCKET = re.compile(r"bucket\s*\(\s*['\"]([^'\"]+)['\"]\s*\)")
RE_BUCKET_KV = re.compile(r"bucket\s*=\s*['\"]([^'\"]+)['\"]")
RE_BUCKET_COMMENT = re.compile(r"bucket:\s*['\"]?([a-zA-Z0-9_\-\.]+)['\"]?")

def scan_files(root: Path):
    collections = set()
    buckets = set()
    for ext in ('**/*.py', '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.yaml', '**/*.yml'):
        for path in root.glob(ext):
            try:
                txt = path.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                continue
            for m in RE_COLLECTION.finditer(txt):
                collections.add(m.group(1))
            for m in RE_COLLECTION_FN.finditer(txt):
                collections.add(m.group(1))
            for m in RE_BUCKET.finditer(txt):
                buckets.add(m.group(1))
            for m in RE_BUCKET_KV.finditer(txt):
                buckets.add(m.group(1))
            for m in RE_BUCKET_COMMENT.finditer(txt):
                buckets.add(m.group(1))
    return sorted(collections), sorted(buckets)

def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
    cols, bks = scan_files(root)
    out = {"collections": cols, "buckets": bks}
    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()
