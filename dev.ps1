
# Data Analysis Platform - Development Server Startup

Write-Host "🚀 Starting Data Analysis Platform..." -ForegroundColor Green
Write-Host "`nThis will start 3 servers in parallel:` -ForegroundColor Cyan
Write-Host "  • Backend (NestJS):   http://localhost:3000" -ForegroundColor Blue
Write-Host "  • Frontend (React):   http://localhost:5173" -ForegroundColor Blue
Write-Host "  • Shared Types:       Watch mode active" -ForegroundColor Blue
Write-Host "`nPress Ctrl+C to stop all servers.`n" -ForegroundColor Yellow

# Run turbo dev with pnpm
npx pnpm exec turbo dev

Write-Host "`n✋ Development servers stopped." -ForegroundColor Yellow
