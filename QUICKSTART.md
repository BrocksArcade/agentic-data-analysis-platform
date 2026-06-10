# Quick Start Guide

## Prerequisites

- **Node.js** 18+ installed
- **pnpm** installed globally: `npm install -g pnpm`

## First Time Setup

```bash
# 1. Install all dependencies
pnpm install

# 2. Build all packages
pnpm exec turbo build

# 3. Create data directories
mkdir -p /data /tmp/parquet
```

## Starting Development Servers

### Option 1: PowerShell (Windows)
```powershell
# From project root:
.\dev.ps1

# Or use pnpm directly:
npx pnpm exec turbo dev
```

### Option 2: Bash/Terminal (macOS/Linux)
```bash
# From project root:
./dev.sh

# Or use pnpm directly:
pnpm exec turbo dev
```

### Option 3: Individual Servers

**Terminal 1 - Backend (NestJS):**
```bash
cd apps/backend
pnpm dev
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend (React):**
```bash
cd apps/frontend
pnpm dev
# Runs on http://localhost:5173
```

**Terminal 3 - Shared Types (Optional):**
```bash
cd packages/shared
pnpm dev
# Watches for TypeScript changes
```

## What to Expect

When you run `pnpm exec turbo dev`:

```
@platform/shared:dev: ✓ Compilation successful
backend:dev: ✓ Nest has successfully started
frontend:dev: ✓ Vite ready in 447ms
```

Then visit: **http://localhost:5173**

## Environment Configuration

The `.env` file is already created with defaults:

```env
PORT=3000
DUCKDB_PATH=/data/main.duckdb
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
NODE_ENV=development
```

**To customize:**
1. Edit `.env` in the project root
2. Restart the dev servers

## Project Structure Quick Reference

```
📦 DuckDbproject
├── 📂 apps/
│   ├── 📂 backend/        (NestJS + DuckDB + WebSocket)
│   └── 📂 frontend/       (React + Tailwind CSS)
├── 📂 packages/
│   └── 📂 shared/         (TypeScript types)
├── 🔧 turbo.json          (Monorepo config)
├── 📄 pnpm-workspace.yaml (Workspace config)
├── 📝 README.md           (Full documentation)
├── 📝 .env                (Environment variables)
└── 🎬 dev.ps1 / dev.sh    (Startup scripts)
```

## Development Tips

### Rebuilding a Single Package
```bash
pnpm exec turbo build --filter=backend
pnpm exec turbo build --filter=frontend
pnpm exec turbo build --filter=@platform/shared
```

### Running Linting
```bash
# Lint all packages
pnpm exec turbo lint

# Lint specific package
pnpm exec turbo lint --filter=frontend
```

### Clearing Build Cache
```bash
# Remove all dist folders
rm -r apps/*/dist packages/*/dist

# Rebuild everything
pnpm exec turbo build
```

## Troubleshooting

### Issue: "Cannot find module '@platform/shared'"
**Solution:** Rebuild the shared package first
```bash
cd packages/shared && pnpm build && cd ../..
pnpm exec turbo build
```

### Issue: "Port 3000 already in use"
**Solution:** Either stop the process using that port or change it in `.env`:
```env
PORT=3001
```

### Issue: "DuckDB file not found"
**Solution:** Create the data directory
```bash
mkdir -p /data
```

### Issue: Vite build errors
**Solution:** Clear node_modules and reinstall
```bash
rm -rf node_modules && pnpm install
```

## Building for Production

```bash
# Build all packages
pnpm exec turbo build

# Output:
# - apps/backend/dist/    (NestJS compiled)
# - apps/frontend/dist/   (React optimized bundle)
```

## Frontend Features

- **Dark Theme** - Gemini/ChatGPT style UI
- **Real-time Chat** - WebSocket powered
- **File Upload** - CSV data import
- **Progress Tracking** - Upload status updates
- **Responsive Design** - Works on all devices

## Backend Features

- **WebSocket Gateway** - Real-time communication
- **AI Agent** - 7 specialized tools
- **DuckDB Integration** - SQL data querying
- **SQL Guardrails** - Security constraints
- **Ollama Support** - Local LLM inference

## Available Commands

| Command | Purpose |
|---------|---------|
| `pnpm exec turbo dev` | Start all dev servers |
| `pnpm exec turbo build` | Build all packages |
| `pnpm exec turbo lint` | Lint all packages |
| `pnpm install` | Install dependencies |
| `pnpm exec turbo --help` | Show turbo options |

## Next Steps

1. ✅ Run `pnpm exec turbo dev`
2. ✅ Open http://localhost:5173
3. ✅ Create a new chat conversation
4. ✅ Ask the agent a question
5. ✅ Check the backend console for logs

## Documentation

- **Full docs:** See [README.md](./README.md)
- **Backend details:** See [apps/backend](./apps/backend)
- **Frontend details:** See [apps/frontend](./apps/frontend)

## Getting Help

- Check the console logs for errors
- Verify all ports (3000, 5173) are available
- Ensure `.env` file exists with correct paths
- Try rebuilding: `pnpm exec turbo build --force`

---

**Happy coding! 🚀**
