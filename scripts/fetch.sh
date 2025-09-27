#!/bin/bash
# Usage: ./fetch.sh user@host:/remote/path/to/file local_filename

REMOTE=dhananjaypai@raspberrypi.local:/home/dhananjaypai/ETHGlobal/scripts/capture_with_proof.jpg
DEST_DIR=$(pwd)

echo "Fetching file from $REMOTE to $DEST_DIR"
# Copy from remote server into current directory with desired name
scp "$REMOTE" "$DEST_DIR/"
