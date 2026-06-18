#!/bin/bash

# Safe swap setup for dual-boot Ubuntu
# Does NOT touch partitions - only creates swapfile

set -e

echo "🔧 Ubuntu Swap Setup for Dual-Boot System"
echo "=========================================="
echo ""

# Check if running with sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use: sudo ./setup_swap.sh)"
   exit 1
fi

# Check current disk space
echo "📊 Current Disk Status:"
df -h /
echo ""

# Check current swap
echo "📈 Current Swap:"
free -h
echo ""

# Confirm before proceeding
read -p "Continue with swap setup? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Calculate swap size (12GB for dual-boot safety)
SWAP_SIZE="12G"

echo "🔄 Creating $SWAP_SIZE swapfile..."

# Create swapfile
if [ -f /swapfile ]; then
    echo "⚠️  /swapfile already exists"
    read -p "Remove and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        swapoff /swapfile 2>/dev/null || true
        rm -f /swapfile
    else
        echo "Skipping swapfile creation"
        goto_persist
    fi
fi

# Create and setup swapfile
fallocate -l $SWAP_SIZE /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

echo "✅ Swapfile created and activated"
echo ""

# Make persistent
persist_swap() {
    echo "🔒 Making swap persistent..."

    # Check if already in fstab
    if grep -q /swapfile /etc/fstab; then
        echo "⚠️  /swapfile already in /etc/fstab"
    else
        echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
        echo "✅ Added to /etc/fstab"
    fi
}

persist_swap

# Optimize swappiness
echo ""
echo "⚡ Optimizing swappiness..."
CURRENT_SWAP=$(cat /proc/sys/vm/swappiness)
echo "Current swappiness: $CURRENT_SWAP"

sysctl vm.swappiness=30
echo 'vm.swappiness=30' | tee -a /etc/sysctl.conf
echo "✅ Set to 30 (conservative for dual-boot)"

# Show final status
echo ""
echo "📊 Final Swap Status:"
swapon --show
echo ""
free -h

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify persistence: sudo swapon -a"
echo "2. Reboot and check: free -h"
echo "3. Start dashboard: npx pnpm exec turbo dev"
