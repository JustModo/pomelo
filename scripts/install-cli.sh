#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Configuration
# ==============================================================================
APP_ROOT="${APP_ROOT:-/opt/pomelo}"
SERVICE_NAME="pomelod"

# ==============================================================================
# Terminal Colors & Logging
# ==============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC}    $1"; }
log_success() { echo -e "${GREEN}[  OK  ]${NC}  $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}    $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC}   $1" >&2; }
fatal()       { log_error "$1"; exit 1; }
log_step()    { echo ""; echo -e "${BOLD}${CYAN}──── $1 ────${NC}"; }

# Check for root or write access
if [[ "$EUID" -ne 0 ]]; then
  if [[ ! -w "$(dirname "$APP_ROOT")" ]] && [[ ! -d "$APP_ROOT" || ! -w "$APP_ROOT" ]]; then
    fatal "No write access to $APP_ROOT. Re-run with: ${BOLD}sudo bash scripts/install-cli.sh${NC}"
  fi
fi

# Check if Pomelo is installed
if [[ ! -d "$APP_ROOT/app" ]]; then
  fatal "Pomelo does not appear to be installed at $APP_ROOT. Please run install.sh first."
fi

# Ensure we are in the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

log_step "Stopping Pomelo Daemon"
if command -v systemctl &>/dev/null && systemctl is-active "$SERVICE_NAME" &>/dev/null; then
  log_info "Stopping $SERVICE_NAME via systemctl..."
  systemctl stop "$SERVICE_NAME" 2>/dev/null || true
  log_success "Daemon stopped."
else
  # Kill any stray processes just in case
  if pgrep -f "pomelod" > /dev/null; then
    log_info "Killing existing pomelod processes..."
    pkill -f "pomelod" || true
    log_success "Daemon processes killed."
  else
    log_info "Daemon is not currently running."
  fi
fi

log_step "Checking for pre-built binaries"
if [[ ! -f "admin/bin/pomelo" ]] || [[ ! -f "admin/bin/pomelod" ]] || [[ ! -d "admin/dist" ]]; then
  fatal "Build files not found in admin directory. Please run 'cd admin && pnpm install && pnpm build' first."
fi
log_success "Build files found."

log_step "Deploying new binaries to $APP_ROOT"

log_info "Removing old CLI files..."
rm -f "$APP_ROOT/app/admin/bin/pomelo" 2>/dev/null || true
rm -f "$APP_ROOT/app/admin/bin/pomelod" 2>/dev/null || true
rm -rf "$APP_ROOT/app/admin/dist" 2>/dev/null || true

log_info "Copying new files..."
mkdir -p "$APP_ROOT/app/admin/bin"
cp -r admin/bin/* "$APP_ROOT/app/admin/bin/"
cp -r admin/dist "$APP_ROOT/app/admin/"

log_info "Configuring permissions..."
chmod +x "$APP_ROOT/app/admin/bin/pomelo"
chmod +x "$APP_ROOT/app/admin/bin/pomelod"
log_success "Deployment complete."

log_step "Symlinking CLI"
if [[ -L "/usr/local/bin/pomelo" ]]; then
    log_info "Symlink /usr/local/bin/pomelo already exists."
else
    if [[ "$EUID" -eq 0 || -w /usr/local/bin ]]; then
        ln -sfn "$APP_ROOT/app/admin/bin/pomelo" /usr/local/bin/pomelo
        log_success "CLI linked to ${DIM}/usr/local/bin/pomelo${NC}"
    else
        log_warn "Skipping /usr/local/bin symlink (no write access). Add to PATH manually:"
        log_info "  export PATH=\"$APP_ROOT/app/admin/bin:\$PATH\""
    fi
fi

log_step "Starting Pomelo Daemon"
if command -v systemctl &>/dev/null && systemctl is-enabled "$SERVICE_NAME" &>/dev/null; then
  log_info "Starting $SERVICE_NAME via systemctl..."
  systemctl start "$SERVICE_NAME"
  
  sleep 1
  if systemctl is-active "$SERVICE_NAME" &>/dev/null; then
    log_success "Service ${BOLD}$SERVICE_NAME${NC} is active."
  else
    log_warn "Service may have failed to start. Check: ${DIM}systemctl status $SERVICE_NAME${NC}"
  fi
else
  log_info "Starting daemon in background..."
  export POMELO_ROOT="$APP_ROOT"
  "$APP_ROOT/app/admin/bin/pomelod" --daemon --root "$APP_ROOT"
  
  sleep 1
  log_success "Daemon started ${DIM}(will not survive reboot)${NC}"
fi

echo ""
log_success "CLI installation and restart complete!"
echo ""
