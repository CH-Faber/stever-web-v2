#!/bin/bash

# Script to create a deployment user on Ubuntu
# Run as root: sudo bash create-deploy-user.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run this script as root or with sudo"
    echo "Usage: sudo bash create-deploy-user.sh"
    exit 1
fi

echo "=========================================="
echo "  Ubuntu Deployment User Setup Script"
echo "=========================================="
echo ""

# Get username
read -p "Enter username for deployment (default: deploy): " USERNAME
USERNAME=${USERNAME:-deploy}

# Check if user already exists
if id "$USERNAME" &>/dev/null; then
    log_warn "User $USERNAME already exists!"
    read -p "Do you want to reconfigure this user? (y/n): " RECONFIGURE
    if [ "$RECONFIGURE" != "y" ]; then
        log_info "Exiting..."
        exit 0
    fi
    USER_EXISTS=true
else
    USER_EXISTS=false
fi

# Create user if doesn't exist
if [ "$USER_EXISTS" = false ]; then
    log_step "Creating user $USERNAME..."
    adduser --gecos "" $USERNAME
    
    if [ $? -ne 0 ]; then
        log_error "Failed to create user"
        exit 1
    fi
    log_info "User $USERNAME created successfully"
fi

# Add to sudo group
log_step "Adding $USERNAME to sudo group..."
usermod -aG sudo $USERNAME
log_info "User $USERNAME added to sudo group"

# Setup SSH directory
log_step "Setting up SSH access..."
mkdir -p /home/$USERNAME/.ssh
chmod 700 /home/$USERNAME/.ssh

# Copy SSH keys from root if available
if [ -f /root/.ssh/authorized_keys ]; then
    log_info "Copying SSH keys from root user..."
    cp /root/.ssh/authorized_keys /home/$USERNAME/.ssh/authorized_keys
    chmod 600 /home/$USERNAME/.ssh/authorized_keys
    log_info "SSH keys copied"
else
    log_warn "No SSH keys found in /root/.ssh/authorized_keys"
    read -p "Do you want to add an SSH public key now? (y/n): " ADD_KEY
    if [ "$ADD_KEY" = "y" ]; then
        echo "Paste your SSH public key (from ~/.ssh/id_rsa.pub on your local machine):"
        read SSH_KEY
        echo "$SSH_KEY" > /home/$USERNAME/.ssh/authorized_keys
        chmod 600 /home/$USERNAME/.ssh/authorized_keys
        log_info "SSH key added"
    else
        log_warn "No SSH key added. User will need to login with password."
    fi
fi

# Set ownership
chown -R $USERNAME:$USERNAME /home/$USERNAME/.ssh

# Create project directory
log_step "Creating project directory..."
mkdir -p /var/www
chown -R $USERNAME:$USERNAME /var/www
log_info "Project directory /var/www created and owned by $USERNAME"

# Test sudo access
log_step "Testing sudo access..."
su - $USERNAME -c "sudo -n true" 2>/dev/null
if [ $? -eq 0 ]; then
    log_warn "User has passwordless sudo (this might be a security risk)"
else
    log_info "User will need password for sudo (recommended)"
fi

# Summary
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
log_info "User: $USERNAME"
log_info "Home: /home/$USERNAME"
log_info "Sudo: Yes"
log_info "SSH: $([ -f /home/$USERNAME/.ssh/authorized_keys ] && echo 'Configured' || echo 'Not configured')"
log_info "Project directory: /var/www (owned by $USERNAME)"
echo ""
echo "Next steps:"
echo "1. Test login from your local machine:"
echo "   ${BLUE}ssh $USERNAME@$(hostname -I | awk '{print $1}')${NC}"
echo ""
echo "2. Test sudo access:"
echo "   ${BLUE}sudo whoami${NC}"
echo ""
echo "3. Clone your project:"
echo "   ${BLUE}cd /var/www${NC}"
echo "   ${BLUE}git clone <your-repo-url> stever-web-v2${NC}"
echo ""
echo "4. Run deployment:"
echo "   ${BLUE}cd stever-web-v2${NC}"
echo "   ${BLUE}./nginx/deploy.sh full${NC}"
echo ""
log_warn "IMPORTANT: Test the new user login in a NEW terminal before closing this session!"
echo ""
