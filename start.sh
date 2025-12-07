#!/bin/bash

echo "Starting Kalendarz Apartamentów..."

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 3

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  Aplikacja uruchomiona!                                ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Frontend: http://localhost:5173                       ║"
echo "║  Backend:  http://localhost:3000                       ║"
echo "║                                                        ║"
echo "║  Aby zatrzymać: Naciśnij Ctrl+C                        ║"
echo "╚════════════════════════════════════════════════════════╝"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
