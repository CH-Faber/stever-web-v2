#!/bin/bash

# Script to install certbot on Ubuntu
# Run as: bash install-certbot.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if certbot is already installed
if command -v certbot &> /dev/null; then
    log_info "Certbot is already installed!"
    certbot --version
    exit 0
fi

log_info "Installing certbot..."

# Try installing with apt first
log_info "Attempting to install via apt..."
if sudo apt update && sudo apt install -y certbot python3-certbot-nginx; then
    log_info "Certbot installed successfully via apt!"
    certbot --version
    exit 0
fi

# If apt fails, try snap
log_warn "apt installation failed, trying snap..."
if command -v snap &> /dev/null; then
    log_info "Installing certbot via snap..."
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    log_info "Certbot installed successfully via snap!"
    certbot --version
    exit 0
else
    log_error "Neither apt nor snap installation succeeded."
    log_error "Please install certbot manually."
    exit 1
fi
