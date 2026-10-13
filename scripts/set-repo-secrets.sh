#!/usr/bin/env bash
# Set required repository secrets using the gh CLI.
# Usage: ./set-repo-secrets.sh owner/repo
# Requires: gh CLI authenticated with an account that has admin access to the repo.
set -euo pipefail
if [ $# -ne 1 ]; then
  echo "Usage: $0 owner/repo" >&2
  exit 2
fi
REPO="$1"
read -rp "Enter RELEASE_PAT (will be stored as secret RELEASE_PAT): " -s RELEASE_PAT
echo
read -rp "Enter path to keystore (or leave empty to skip keystore): " KS_PATH
if [ -n "$KS_PATH" ]; then
  if [ ! -f "$KS_PATH" ]; then
    echo "Keystore file not found: $KS_PATH" >&2
    exit 2
  fi
  KS_B64=$(base64 --wrap=0 "$KS_PATH")
  echo "$KS_B64" | gh secret set ANDROID_KEYSTORE_BASE64 --repo "$REPO" --body -
  read -rp "Enter KEYSTORE_PASSWORD: " -s KEYSTORE_PASSWORD
  echo
  gh secret set KEYSTORE_PASSWORD --repo "$REPO" --body "$KEYSTORE_PASSWORD"
  read -rp "Enter KEY_ALIAS: " KEY_ALIAS
  gh secret set KEY_ALIAS --repo "$REPO" --body "$KEY_ALIAS"
  read -rp "Enter KEY_PASSWORD (leave empty to use KEYSTORE_PASSWORD): " -s KEY_PASSWORD
  echo
  if [ -z "$KEY_PASSWORD" ]; then
    KEY_PASSWORD="$KEYSTORE_PASSWORD"
  fi
  gh secret set KEY_PASSWORD --repo "$REPO" --body "$KEY_PASSWORD"
else
  echo "Skipping keystore secrets." >&2
fi
# Set RELEASE_PAT if provided
if [ -n "$RELEASE_PAT" ]; then
  gh secret set RELEASE_PAT --repo "$REPO" --body "$RELEASE_PAT"
  echo "Set RELEASE_PAT secret for $REPO"
else
  echo "No RELEASE_PAT provided; release will use GITHUB_TOKEN fallback (requires repo Actions permission)."
fi
