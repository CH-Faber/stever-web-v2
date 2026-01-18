#!/bin/bash

# Deployment script for stever-web-v2
# Usage: ./deploy.sh [update|full]

set -e

PROJECT_DIR="/var/www/stever-web-v2"
NGINX_CONF="mc.faberhu.top"
PM2_APP_NAME="stever-web-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    log_error "Please do not run this script as root"
    exit 1
fi

# Full deployment
full_deploy() {
    log_info "Starting full deployment..."
    
    # Check if project directory exists
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "Project directory $PROJECT_DIR does not exist"
        exit 1
    fi
    
    cd "$PROJECT_DIR"
    
    # Pull latest code
    log_info "Pulling latest code from git..."
    git pull
    
    # Install and build server
    log_info "Building server..."
    cd server
    npm install
    npm run build
    
    # Install and build client
    log_info "Building client..."
    cd ../client
    npm install
    npm run build
    
    # Setup Nginx if not already configured
    if [ ! -f "/etc/nginx/sites-enabled/$NGINX_CONF" ]; then
        log_info "Setting up Nginx configuration..."
        sudo cp "$PROJECT_DIR/nginx/$NGINX_CONF.conf" "/etc/nginx/sites-available/$NGINX_CONF"
        sudo ln -s "/etc/nginx/sites-available/$NGINX_CONF" "/etc/nginx/sites-enabled/"
        sudo nginx -t && sudo systemctl reload nginx
    fi
    
    # Start or restart PM2 process
    cd "$PROJECT_DIR/server"
    if pm2 list | grep -q "$PM2_APP_NAME"; then
        log_info "Restarting PM2 process..."
        pm2 restart "$PM2_APP_NAME"
    else
        log_info "Starting PM2 process..."
        pm2 start dist/server/src/index.js --name "$PM2_APP_NAME"
        pm2 save
    fi
    
    log_info "Full deployment completed successfully!"
    pm2 status
}

# Update deployment (for code changes)
update_deploy() {
    log_info "Starting update deployment..."
    
    cd "$PROJECT_DIR"
    
    # Pull latest code
    log_info "Pulling latest code from git..."
    git pull
    
    # Build server
    log_info "Building server..."
    cd server
    npm install
    npm run build
    
    # Build client
    log_info "Building client..."
    cd ../client
    npm install
    npm run build
    
    # Restart PM2 process
    log_info "Restarting backend service..."
    pm2 restart "$PM2_APP_NAME"
    
    # Reload Nginx
    log_info "Reloading Nginx..."
    sudo systemctl reload nginx
    
    log_info "Update deployment completed successfully!"
    pm2 status
}

# Show usage
show_usage() {
    echo "Usage: $0 [full|update]"
    echo ""
    echo "Commands:"
    echo "  full    - Full deployment (first time setup)"
    echo "  update  - Update deployment (pull and rebuild)"
    echo ""
    echo "Example:"
    echo "  $0 update"
}

# Main script
case "$1" in
    full)
        full_deploy
        ;;
    update)
        update_deploy
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
