#!/usr/bin/env python3
"""
Helper script to download the official all-MiniLM-L6-v2 ONNX model weights
for local development.

Usage:
    python backend/scripts/download_model.py
"""

import os
import sys
import urllib.request
from pathlib import Path

MODEL_URL = "https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx"
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models" / "all-MiniLM-L6-v2"
MODEL_FILE = MODEL_DIR / "model.onnx"


def download_model(force: bool = False):
    if MODEL_FILE.exists() and not force:
        size_mb = MODEL_FILE.stat().st_size / (1024 * 1024)
        print(f"[OK] Model already exists at: {MODEL_FILE} ({size_mb:.2f} MB)")
        return

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    temp_file = MODEL_DIR / "model.onnx.tmp"

    print(f"Downloading all-MiniLM-L6-v2 ONNX model from:")
    print(f"  {MODEL_URL}")
    print(f"Destination:")
    print(f"  {MODEL_FILE}")

    try:
        def reporthook(count, block_size, total_size):
            if total_size > 0:
                percent = int(count * block_size * 100 / total_size)
                downloaded_mb = (count * block_size) / (1024 * 1024)
                total_mb = total_size / (1024 * 1024)
                sys.stdout.write(f"\rDownloading... {percent}% ({downloaded_mb:.1f}/{total_mb:.1f} MB)")
                sys.stdout.flush()

        urllib.request.urlretrieve(MODEL_URL, temp_file, reporthook=reporthook)
        print()

        # Sanity check file size (> 80 MB expected)
        downloaded_size = temp_file.stat().st_size
        if downloaded_size < 50 * 1024 * 1024:
            raise ValueError(f"Downloaded file unexpectedly small ({downloaded_size} bytes). Corrupted download.")

        temp_file.replace(MODEL_FILE)
        size_mb = MODEL_FILE.stat().st_size / (1024 * 1024)
        print(f"[SUCCESS] ONNX model successfully saved ({size_mb:.2f} MB).")

    except Exception as e:
        if temp_file.exists():
            temp_file.unlink()
        print(f"\n[ERROR] Failed to download ONNX model: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    download_model()
