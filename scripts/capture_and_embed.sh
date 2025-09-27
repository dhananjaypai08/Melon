#!/usr/bin/env bash
set -euo pipefail

# -------------------------
# Config
# -------------------------
VENV_DIR="env"
REQ_FILE="requirements.txt"
PY_FILE="hardware_proof.py"
PYTHON_BIN="python3"

# -------------------------
# Run Python program
# -------------------------
echo "[+] Running $PY_FILE..."
$PYTHON_BIN "$PY_FILE"
