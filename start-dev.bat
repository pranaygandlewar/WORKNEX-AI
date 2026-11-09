@echo off
echo ========================================================
echo Starting WORKNEX AI Enterprise Platform (Local Dev)
echo ========================================================

echo Seeding database if not already initialized...
call uv run python main.py seed

echo Starting FastAPI Backend & MCP Server on http://localhost:8000...
start "WORKNEX AI Backend" cmd /k "uv run python main.py server"

echo Starting React + Vite Frontend on http://localhost:5173...
start "WORKNEX AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo WORKNEX AI is launching!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo Swagger:  http://localhost:8000/docs
echo ========================================================
pause

