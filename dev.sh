#!/bin/bash

echo "🚀 Starting Data Analysis Platform..."
echo ""
echo "This will start 3 servers in parallel:"
echo "  • Backend (NestJS):   http://localhost:3000"
echo "  • Frontend (React):   http://localhost:5173"
echo "  • Shared Types:       Watch mode active"
echo ""
echo "Press Ctrl+C to stop all servers."
echo ""

cd "$(dirname "$0")"
npx pnpm exec turbo dev

echo ""
echo "✋ Development servers stopped."
