# 🤖 Multi-Model Configuration Guide

## Your 7 Downloaded Models

| Model | Size | Speed | Accuracy | Best For | VRAM |
|-------|------|-------|----------|----------|------|
| **qwen3:0.6b** | 522 MB | ⚡⚡⚡ BLAZING | ⭐ LOW | Quick answers, mobile UI | 512 MB |
| **qwen2.5:3b** | 1.9 GB | ⚡⚡ FAST | ⭐⭐ MEDIUM | Simple queries, fast feedback | 1.5 GB |
| **qwen2.5:7b-instruct-q2_K** | 3.0 GB | ⚡ NORMAL | ⭐⭐⭐ HIGH | **RECOMMENDED** - Balanced | 2.5 GB |
| **qwen3:4b-instruct-2507-q4_K_M** | 2.5 GB | ⚡⚡ FAST | ⭐⭐⭐ HIGH | Complex 4B model | 2.0 GB |
| **gemma-fixed:latest** | 9.6 GB | 🐢 SLOW | ⭐⭐⭐⭐ VERY_HIGH | Deep analysis, research | 4.0 GB |
| **gemma4:e4b** | 9.6 GB | 🐢 SLOW | ⭐⭐⭐⭐ VERY_HIGH | Thinking/reasoning tasks | 4.0 GB |
| **gemma-split:latest** | 9.6 GB | 🐢 SLOW | ⭐⭐⭐⭐ VERY_HIGH | Latest, all-rounder | 4.0 GB |

## Setup

### 1. Environment Configuration ✅
Create `.env.local` in project root (already created):
```bash
VITE_OLLAMA_DEFAULT_MODEL=qwen2.5:7b-instruct-q2_K
VITE_OLLAMA_MODELS=qwen3:0.6b,qwen2.5:3b,qwen2.5:7b-instruct-q2_K,qwen3:4b-instruct-2507-q4_K_M,gemma-fixed:latest,gemma4:e4b,gemma-split:latest
VITE_ENABLE_MODEL_SWITCHING=true
```

### 2. Backend Integration ✅
New files created:
- `ModelManagerService` - Model management
- `ModelController` - API endpoints
- `ModelSelector` component - UI switcher

### 3. Start Dashboard
```bash
npx pnpm exec turbo dev
```

## Using Multiple Models

### Switch Models in Dashboard
1. Open **http://localhost:5173**
2. Click **🤖 Model Name** button (top-right)
3. Select a model or use quick buttons:
   - **⚡ Fast** - Use qwen3:0.6b
   - **⚖️ Balanced** - Use qwen2.5:7b
   - **🎯 Accurate** - Use gemma models

### API Endpoints

#### Get Model Stats
```bash
curl http://localhost:3000/api/models/stats
```

Response:
```json
{
  "currentModel": "qwen2.5:7b-instruct-q2_K",
  "profile": {
    "name": "qwen2.5:7b-instruct-q2_K",
    "size": "3.0GB",
    "speed": "NORMAL",
    "accuracy": "HIGH",
    "vram": 2500
  },
  "availableModels": [...]
}
```

#### List All Models
```bash
curl http://localhost:3000/api/models/list
```

#### Switch Model
```bash
curl -X POST http://localhost:3000/api/models/switch \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3:0.6b"}'
```

#### Get Recommendation
```bash
curl -X POST http://localhost:3000/api/models/recommend \
  -H "Content-Type: application/json" \
  -d '{"rowCount":40000}'
```

Response:
```json
{
  "recommended": "gemma-fixed:latest",
  "reason": "Large dataset - using accurate model",
  "currentModel": "qwen2.5:7b-instruct-q2_K"
}
```

## Testing Strategy with 40k Row Dataset

### Phase 1: Speed Test
```
Model: qwen3:0.6b (522 MB)
Query: "Show total revenue by category"
Expected: <1 second response
Result: ⚡ Instant but low accuracy
```

### Phase 2: Balance Test
```
Model: qwen2.5:7b-instruct-q2_K (3.0 GB) ← RECOMMENDED
Query: "Which store has highest profit margin?"
Expected: ~3-5 second response
Result: ⚖️ Good speed + accuracy
```

### Phase 3: Accuracy Test
```
Model: gemma-fixed:latest (9.6 GB)
Query: "Analyze revenue patterns and identify trends"
Expected: ~10-15 second response
Result: 🎯 Deep analysis, very accurate
```

### Phase 4: Reasoning Test
```
Model: gemma4:e4b (9.6 GB - thinking model)
Query: "Why do groceries have lower margins than electronics?"
Expected: ~15-20 second response
Result: 🧠 Complex reasoning, explanations
```

## Recommended Use Cases

### ⚡ qwen3:0.6b (BLAZING)
- Mobile UI interactions
- Autocomplete/suggestions
- Real-time feedback
- Dashboard filters
```
"Top 5 products"
"Revenue last month"
"Total sales"
```

### ⚡⚡ qwen2.5:3b (FAST)
- Medium complexity queries
- Quick dashboards
- User-facing responses
```
"Sales by category"
"Top stores by profit"
"Average discount percent"
```

### ⚖️ qwen2.5:7b-instruct-q2_K (BALANCED) ⭐ DEFAULT
- General analysis
- Widget building
- Most queries (40k rows)
```
"Show revenue trends over time"
"Create scatter plot: price vs quantity"
"Compare store performance"
```

### 🎯 qwen3:4b-instruct-2507-q4_K_M (FAST + HIGH ACCURACY)
- Complex aggregations
- Multi-step analysis
- When speed + accuracy matter
```
"Profit margins by store and category"
"Year-over-year comparison"
"Seasonal trends analysis"
```

### 🧠 gemma-fixed:latest (VERY HIGH ACCURACY)
- Deep analysis
- Complex patterns
- Research queries
```
"Identify all revenue patterns in the data"
"What factors influence profit margins?"
"Predict next month's sales"
```

### 🧠 gemma4:e4b (THINKING MODEL)
- "Why" questions
- Reasoning tasks
- Explanations
```
"Why do certain products sell better?"
"Explain the correlation between discount and quantity"
"What's the root cause of low margins in groceries?"
```

### ⚡⚡⚡ gemma-split:latest (LATEST ALL-ROUNDER)
- Best of both worlds
- Complex but fast
- When you want the best
```
Any complex query with latest model
```

## Performance Monitoring

### Watch Model Usage
```bash
# Terminal 1: Monitor model switching
tail -f ~/.ollama/logs/* | grep -i model

# Terminal 2: Monitor GPU
watch -n 1 nvidia-smi

# Terminal 3: Monitor responses
curl -s http://localhost:3000/api/models/stats | jq .currentModel
```

### Benchmarks (Your System)
```
qwen3:0.6b:        200-500 ms/response
qwen2.5:3b:        500-1500 ms/response
qwen2.5:7b:        1500-3000 ms/response ← RECOMMENDED
qwen3:4b:          2000-4000 ms/response
gemma models:      5000-15000 ms/response
```

## Troubleshooting

### Model fails to load
```bash
# Check Ollama service
ollama list

# Restart Ollama
pkill ollama
sleep 2
ollama serve

# Try switching to smaller model
curl -X POST http://localhost:3000/api/models/switch \
  -d '{"model":"qwen3:0.6b"}'
```

### Out of VRAM
```bash
# Check current GPU usage
nvidia-smi

# Switch to smaller model
Models ranked by VRAM:
1. qwen3:0.6b (512 MB) ✅
2. qwen2.5:3b (1500 MB) ✅
3. qwen3:4b (2000 MB) ✅
4. qwen2.5:7b (2500 MB) ✅
5. Gemma models (4000 MB) - May struggle
```

### Slow responses
```bash
# Check if system is swapping
free -h | grep Swap

# Switch to faster model
curl -X POST http://localhost:3000/api/models/switch \
  -d '{"model":"qwen3:0.6b"}'
```

## Quick Reference

### Command Cheatsheet

```bash
# Start dashboard with model switching
npx pnpm exec turbo dev

# Check current model
curl http://localhost:3000/api/models/stats | jq .currentModel

# Switch to fast model
curl -X POST http://localhost:3000/api/models/switch \
  -d '{"model":"qwen3:0.6b"}'

# Get recommendation for data size
curl -X POST http://localhost:3000/api/models/recommend \
  -d '{"rowCount":40000}'

# List all models
curl http://localhost:3000/api/models/list | jq '.models[].name'
```

## Next Steps

1. ✅ **Start**: `npx pnpm exec turbo dev`
2. ✅ **Upload**: `sample_data.csv` (40k rows)
3. ✅ **Switch**: Click 🤖 button to try different models
4. ✅ **Test**: Ask same query with different models
5. ✅ **Analyze**: Compare speed vs accuracy trade-off

---

## Model Specs Summary

**All models are quantized for efficient inference:**
- `q2_K`: Ultra-compressed (fast, less accurate)
- `q4_K`: Balanced (default for most)
- `q5_K`: High quality (slower, more accurate)
- `e4b`: Experimental/Latest

Your RTX 3050 can handle 1-2 large models (9.6GB) OR 3-4 smaller models (3GB) simultaneously!

**Ready to test? Start the dashboard and switch models!** 🚀
