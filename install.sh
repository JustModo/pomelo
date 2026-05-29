#!/usr/bin/env bash
set -euo pipefail


APP_ROOT="${APP_ROOT:-/opt/pomelo}"
GITHUB_REPO="so-sc/pomelo"
TAG="${TAG:-v1.1.0}"
TARBALL_URL="https://github.com/${GITHUB_REPO}/archive/refs/tags/${TAG}.tar.gz"

fail() {
  echo "Error: $1" >&2
  exit 1
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Missing required dependency: $1"
  fi
}

if [[ "$(uname -s)" != "Linux" ]]; then
  fail "This installer only supports Linux."
fi

need_cmd curl
need_cmd tar

if [[ ! -d "$APP_ROOT" ]]; then
  if [[ "$EUID" -ne 0 && ! -w "$(dirname "$APP_ROOT")" ]]; then
    fail "No write access to $(dirname "$APP_ROOT"). Re-run with sudo or set APP_ROOT to a writable path."
  fi
else
  if [[ "$EUID" -ne 0 && ! -w "$APP_ROOT" ]]; then
    fail "No write access to $APP_ROOT. Re-run with sudo or set APP_ROOT to a writable path."
  fi
fi

echo "Creating folder structure in $APP_ROOT..."
mkdir -p \
  "$APP_ROOT/app" \
  "$APP_ROOT/config" \
  "$APP_ROOT/data/database" \
  "$APP_ROOT/data/uploads" \
  "$APP_ROOT/data/backups"

touch \
  "$APP_ROOT/config/app.env" \
  "$APP_ROOT/config/config.json"

# --- [TEMP] REMOVE LATER: Temporary workaround to copy current directory instead of downloading ---
# echo "Downloading source tarball from $TARBALL_URL..."
# TMP_DIR=$(mktemp -d)
# curl -sL "$TARBALL_URL" -o "$TMP_DIR/source.tar.gz"
#
# echo "Extracting to $APP_ROOT/app..."
# tar -xzf "$TMP_DIR/source.tar.gz" -C "$APP_ROOT/app" --strip-components=1
# rm -rf "$TMP_DIR"

echo "Copying current directory to $APP_ROOT/app (excluding node_modules)..."
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tar -cf - --exclude='node_modules' -C "$REPO_DIR" . | tar -xf - -C "$APP_ROOT/app"
# --- [END TEMP] ---

echo "Making binaries executable..."
if [[ -f "$APP_ROOT/app/admin/bin/pomelo" ]]; then
  chmod +x "$APP_ROOT/app/admin/bin/pomelo"
fi
if [[ -f "$APP_ROOT/app/admin/bin/pomelod" ]]; then
  chmod +x "$APP_ROOT/app/admin/bin/pomelod"
fi

# Link CLI to /usr/local/bin for convenience if we have access
if [[ -f "$APP_ROOT/app/admin/bin/pomelo" ]]; then
  if [[ "$EUID" -eq 0 || -w /usr/local/bin ]]; then
    ln -sfn "$APP_ROOT/app/admin/bin/pomelo" /usr/local/bin/pomelo
  else
    echo "Skipping symlink creation in /usr/local/bin due to missing permissions."
  fi
fi

echo "Starting the daemon..."
cd "$APP_ROOT/app/admin"

export POMELO_ROOT="$APP_ROOT"
if [[ -f "bin/pomelod" ]]; then
  ./bin/pomelod --daemon
else
  echo "Warning: bin/pomelod not found, could not start daemon."
fi

echo ""
echo "Installation complete!"
echo "The Pomelo daemon is now running in the background."
echo "You can access the Admin UI at: http://127.0.0.1:8462"
echo "To manage services, use the 'pomelo' CLI."
