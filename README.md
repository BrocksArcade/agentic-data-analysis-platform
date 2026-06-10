# Agentic Data Analysis Platform

A modern full-stack application for analyzing CSV data using an AI agent with a dark-themed chat interface.

## Architecture

This is a **monorepo** built with **pnpm workspaces** and **Turbo**:

```
DuckDbproject/
├── apps/
│   ├── backend/          (NestJS + Socket.IO + DuckDB)
│   └── frontend/         (React + TypeScript + Tailwind CSS)
├── packages/
│   └── shared/           (TypeScript types & interfaces)
└── turbo.json            (Monorepo configuration)
```

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (installed globally or via `npm install -g pnpm`)

### Installation

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm exec turbo build

# Start all dev servers
pnpm exec turbo dev
```

### Individual Commands

**Backend:**
```bash
cd apps/backend
pnpm dev      # Start NestJS dev server (port 3000)
pnpm build    # Build for production
```

**Frontend:**
```bash
cd apps/frontend
pnpm dev      # Start Vite dev server (port 5173)
pnpm build    # Build for production
```

**Shared Types:**
```bash
cd packages/shared
pnpm build    # Compile TypeScript types
```

## System Architecture

### Backend (`apps/backend`)

**Tech Stack:**
- NestJS (Framework)
- Socket.IO (WebSocket communication)
- DuckDB (Data querying)
- Ollama (LLM inference)
- TypeScript

**Key Modules:**
- `DataModule` - Handles file uploads, database operations
- `AgentModule` - Manages AI agent orchestration and tool execution
- `MainGateway` - WebSocket gateway for real-time communication

**API Endpoints:**
- WebSocket at `http://localhost:3000`
- HTTP prefix: `/api`

**Database:**
- DuckDB persistent file at `/data/main.duckdb`
- Tables: `conversations` (stores conversation metadata and parquet files)

### Frontend (`apps/frontend`)

**Tech Stack:**
- React 18 (UI framework)
- TypeScript (Type safety)
- Tailwind CSS (Dark theme styling)
- Vite (Build tool)
- Socket.IO Client (WebSocket communication)

**UI Components:**
- `Sidebar` - Conversation list and navigation
- `ChatArea` - Message display and input area
- `MessageBubble` - Individual message styling
- `InputArea` - Message/file input with sending

**Features:**
- Dark modern interface (Gemini/ChatGPT style)
- Real-time WebSocket communication
- File upload support
- Upload progress tracking
- Conversation history management

### Shared Types (`packages/shared`)

**Exports:**
- `ChartContract` - Universal chart visualization schema
- `SessionMemory` - In-memory conversation state
- `Message` - Message interface
- `ToolCall` - LLM tool invocation interface

## Development Workflow

### With Turbo (Recommended)

```bash
# Start all servers simultaneously (watches all packages)
pnpm exec turbo dev

# Build all packages
pnpm exec turbo build

# Output:
# Backend runs on:  http://localhost:3000
# Frontend runs on: http://localhost:5173
```

### Environment Variables

Create `.env` in the root directory:

```env
# Server
PORT=3000

# DuckDB
DUCKDB_PATH=/data/main.duckdb

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Node
NODE_ENV=development
```

## Backend Features

### Tool System

7 specialized tools with base class pattern:

1. **describe_schema** - Get table structure and types
2. **sample_data** - Get sample rows from data
3. **get_row_count** - Get total row count
4. **run_sql** - Execute SQL queries with guardrails
5. **remember_mapping** - Save column term mappings
6. **remember_fact** - Save data discoveries
7. **final_answer** - Return visualization with chart contract

All tools extend `BaseTool` for consistent error handling and execution.

### Agent Loop

- Maximum 10 iterations per query
- Up to 3 SQL failures before forced error response
- Full message history tracking
- Automatic summary generation after memory updates
- Structured JSON tool calling

### Data Flow

```
1. User uploads CSV → Browser converts to Parquet
2. Frontend sends chunks via WebSocket → Backend stores in DuckDB
3. User asks question → Agent processes with tools
4. Agent queries data with SQL guardrails
5. Response formatted as Chart Contract → Frontend displays
```

## Frontend Features

### Chat Interface

- Modern dark theme
- User/assistant message bubbles
- Animated loading indicator
- Real-time progress tracking
- Responsive layout

### WebSocket Events

**Client → Server:**
- `upload:start` - Initialize file upload
- `upload:chunk` - Send parquet data chunk
- `upload:complete` - Finalize upload
- `agent:query` - Send question to agent
- `conversation:open` - Load existing conversation

**Server → Client:**
- `upload:progress` - Upload progress updates
- `upload:ready` - Upload complete
- `agent:thinking` - Agent processing steps
- `agent:result` - Final visualization
- `agent:error` - Error messages

## Build Output

```
@platform/shared:  ~2 KB (compiled TypeScript)
backend:           ~5 MB (NestJS bundle)
frontend:          192.96 KB (61.56 KB gzipped)
```

## Key Technologies

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | NestJS + Socket.IO + DuckDB |
| Communication | WebSocket (Socket.IO) |
| LLM | Ollama |
| Monorepo | pnpm + Turbo |
| Types | TypeScript |

## Next Steps

1. **Frontend Enhancements:**
   - Add CSV to Parquet conversion in browser
   - Implement chart rendering (ApexCharts/Recharts)
   - Add conversation persistence

2. **Backend Improvements:**
   - Implement proper database migration system
   - Add user authentication
   - Implement conversation search/filtering

3. **Features:**
   - Multi-turn conversation memory
   - Export analysis results
   - Data visualization templates
   - Real-time collaboration

## Scripts Reference

```bash
# Root level (run all packages)
pnpm exec turbo build    # Build all
pnpm exec turbo dev      # Dev all
pnpm exec turbo lint     # Lint all

# Backend
npm run dev              # Watch mode
npm run build            # Compile
npm run start            # Run production

# Frontend
npm run dev              # Vite dev server
npm run build            # Vite build
npm run preview          # Preview production build

# Shared
npm run build            # TypeScript compile
npm run dev              # TypeScript watch
```

## License

MIT
