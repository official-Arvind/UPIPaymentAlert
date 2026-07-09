#!/usr/bin/env bash
# Encode a Java keystore to base64 for copying into GitHub secrets.
set -euo pipefail
if [ $# -ne 1 ]; then
  echo "Usage: $0 path/to/release.keystore"
  exit 2
fi
KS="$1"
if [ ! -f "$KS" ]; then
  echo "Keystore not found: $KS" >&2
  exit 2
fi
base64 --wrap=0 "$KS"
