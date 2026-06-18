# ⚡ QUICK START - RTX 3050 Optimized Setup

## Your System
```
✅ AMD Ryzen 7 4800H (16 cores)
✅ NVIDIA RTX 3050 (3.9GB VRAM allocated)
✅ 15GB RAM (use 8-10GB for Ollama)
✅ 59GB partition (7.8GB free)
⚠️  Storage is TIGHT - cleanup if needed
```

## 1️⃣ Clean Up Storage (OPTIONAL but recommended)
```bash
# Check what's taking space
du -sh ~/* | sort -h | tail -5

# Safe to delete
rm -rf ~/.cache/pip
rm -rf /tmp/*
rm -rf ~/.npm
```

## 2️⃣ Set Up Swap (Handle 40k rows smoothly)
```bash
# Check current
free -h

# Create 12GB swapfile
sudo fallocate -l 12G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make persistent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=30
```

## 3️⃣ Configure CUDA for RTX 3050
```bash
# Install CUDA runtime (if not already)
# https://developer.nvidia.com/cuda-downloads

# Verify GPU
nvidia-smi

# Set Ollama to use GPU
export CUDA_VISIBLE_DEVICES=0
```

## 4️⃣ Start Development Stack
```bash
# From project root
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Kill old processes
lsof -ti:3000,5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start servers
npx pnpm exec turbo dev

# In another terminal, monitor resources
watch -n 1 'free -h && echo "---" && nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader'
```

## 5️⃣ Upload & Test Data
1. Open **http://localhost:5173**
2. Click **"New Dataset"**
3. Upload `sample_data.csv` (40k rows, 5.12 MB)
4. Ask AI questions to test limits:
   - "Show total revenue by category"
   - "Which store has highest profit margin?"
   - "Create a scatter plot of price vs quantity"
   - "What's the average discount by payment method?"

## ⚡ Performance Tips

### Monitor During Testing
```bash
# Terminal 1: Watch system
watch -n 1 'echo "=== RAM ===" && free -h && echo "=== GPU ===" && nvidia-smi'

# Terminal 2: Watch disk
watch -n 2 'df -h / && du -sh /tmp'

# Terminal 3: Watch processes
watch -n 1 'ps aux | grep -E "ollama|node|vite" | grep -v grep'
```

### Speed Up Queries
```bash
# In dashboard, ask for:
# ✅ "Top 10 products by revenue" (fast, specific)
# ✅ "Average price per category" (aggregated)
# ❌ Avoid: "Analyze all patterns" (slow, vague)
```

### If System Slows Down
```bash
# Check swap usage
free -h

# Kill non-essential services
sudo systemctl stop snapd        # (optional)
pkill firefox                     # (optional)

# Restart Ollama/dashboard
npx pnpm exec turbo dev --kill
sleep 2
npx pnpm exec turbo dev
```

## 📊 Expected Performance

| Task | Speed |
|------|-------|
| AI Chat (small) | ~1-2 sec |
| Widget Build | ~2-3 sec |
| Chart Generation | ~3-5 sec |
| 40k Row Analysis | ~10-15 sec |

**Ryzen 7 4800H + RTX 3050 = FAST** ⚡

## 🛑 Safe Shutdown
```bash
# Always stop services cleanly
# (prevents dual-boot issues)

# Stop frontend/backend
^C in turbo dev terminal

# Stop Ollama
pkill ollama

# Sync disk
sync

# Shutdown
sudo shutdown -h now
```

## 📝 Troubleshooting

### "Not enough VRAM"
- Reduce `gpu_memory` to 3500 in ModelFile
- Or use `mistral:7b-q4_K_M` (smaller model)

### "Swap increasing"
- System is using disk (slower but safe)
- Keep an eye on it
- May need to reduce concurrent operations

### "Port already in use"
```bash
# Kill existing processes
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### "Storage full"
```bash
# Current: 7.8GB free (TIGHT for large operations)
# Delete: ~/.cache, /tmp, old parquet files
df -h /
```

---

## Ready to test? 🚀
```bash
npx pnpm exec turbo dev
# Then open http://localhost:5173
```

Good luck pushing the AI to its limits! 💪
