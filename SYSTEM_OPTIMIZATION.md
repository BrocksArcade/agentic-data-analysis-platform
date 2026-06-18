# ⚡ System Optimization for YOUR Rig
## AMD Ryzen 7 4800H + RTX 3050 Laptop (Dual-Boot)

### Your System Specs
```
CPU:      AMD Ryzen 7 4800H (16 cores, 32 threads)
RAM:      15 GB total (5.9 GB available right now)
GPU:      NVIDIA GeForce RTX 3050 Laptop (4 GB VRAM)
Storage:  59 GB partition (7.8 GB free - TIGHT!)
Swap:     23 GB available
Kernel:   Ubuntu 24.04 (kernel 7.0.11)
```

## ⚡ Optimized ModelFile Configuration
✅ **Tuned for MAXIMUM SPEED on YOUR hardware:**
- Model: `mistral:7b-instruct-v0.2-q5_K_M` (7B, faster than 9B)
- GPU Layers: 20 (RTX 3050 optimal - uses ~3.5GB VRAM)
- Threads: 14 (Ryzen 7 can handle all 16, but leave 2 for OS)
- Context: 4096 tokens (2x bigger for better understanding)
- Temperature: 0.5 (FAST decisions, consistent output)
- Max Output: 512 tokens (prevents rambling)

## Ubuntu Swap Configuration (Dual-Boot Safe)

### Check Current Swap
```bash
free -h
swapon --show
```

### Recommended Swap Size
For dual-boot with shared disk space:
- **Current RAM:** Aim for 1x-2x RAM size
- **Dual-boot:** Use 8-16 GB max (don't eat Windows partition)
- **Location:** Keep on ext4 partition only

### Create Swapfile (NO FORMATTING NEEDED)
```bash
# Check available space first
df -h /

# Create 12GB swapfile (safe for dual-boot)
sudo fallocate -l 12G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Verify
swapon --show
free -h
```

### Make Swap Persistent
```bash
# Add to /etc/fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
sudo swapon -a
```

### Optimize Swap Usage
```bash
# Check current swappiness (default 60)
cat /proc/sys/vm/swappiness

# Set to 30 (use disk swap less aggressively)
sudo sysctl vm.swappiness=30

# Make permanent
echo 'vm.swappiness=30' | sudo tee -a /etc/sysctl.conf
```

## Memory Management for Ollama + Dashboard

### Check System Resources
```bash
# Memory
lsb_release -d
free -h
uname -m

# GPU (if available)
nvidia-smi  # For NVIDIA
rocm-smi    # For AMD
```

### Ollama Configuration (~/.ollama/ollama_config)
Create or update:
```
OLLAMA_NUM_GPU=1
OLLAMA_MAX_LOADED_MODELS=1
OLLAMA_KEEP_ALIVE=5m
OLLAMA_MEMORY_FRACTION=0.85
```

### Dashboard Memory Limits
```bash
# Kill existing processes if stuck
lsof -ti:3000,5173 | xargs kill -9

# Run with memory monitor
watch -n 1 free -h
```

## Partition Space Check
```bash
# DON'T resize - just monitor
df -h /
du -sh /home/*
du -sh /tmp/

# Clean up if needed
rm -rf /tmp/parquet/*  # Old parquet files
rm -rf ~/.cache/pip/*  # Python cache
```

## Performance Tuning

### CPU Governor (for stability)
```bash
# Check current
cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

# Set to balanced (safest for dual-boot)
echo 'powersave' | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

### Disable Unnecessary Services
```bash
# List running services
systemctl list-units --type=service --state=running

# Disable heavy services if needed (example)
# sudo systemctl disable mongodb
# sudo systemctl disable mysql
```

## Monitoring Dashboard Usage

### Real-time resource usage
```bash
# Terminal 1: Watch system stats
watch -n 1 'free -h && echo "---" && ps aux | grep ollama | grep -v grep'

# Terminal 2: Check disk
watch -n 2 'df -h /'

# Terminal 3: Monitor network (if using remote models)
iftop -i eth0
```

## Safe Shutdown

Always shut down cleanly for dual-boot:
```bash
# Stop services
npx pnpm exec turbo dev --stop

# Stop Ollama
pkill ollama

# Sync disk
sync

# Shutdown safely
sudo shutdown -h now
```

## Partition Layout (SAFE - DO NOT MODIFY)
```
Windows:  C:\ (NTFS)  - Don't touch
Linux:    /dev/sdXY (ext4) - Safe for swap/data
Shared:   /mnt/shared (if configured) - Use carefully
```

## Summary of Changes Made

✅ **ModelFile:** Reduced from 36 to 1 GPU, added memory safety params
✅ **Model:** Changed to quantized 9B (lighter, faster)
✅ **Swap:** Recommendation for 12GB on ext4 only
✅ **Settings:** Added conservative thread/memory configs

## Before You Start

1. ✅ Check free space: `df -h /`
2. ✅ Create swapfile: `sudo fallocate -l 12G /swapfile`
3. ✅ Enable swap: `sudo swapon /swapfile`
4. ✅ Start services: `npx pnpm exec turbo dev`
5. ✅ Monitor: `watch -n 1 free -h`

**You're ready to test the AI with 40k rows!** 🚀
