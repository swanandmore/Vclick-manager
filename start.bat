@echo off
title LensSync - Media Club Real-Time Server & Web App
echo ========================================================
echo Starting LensSync - College Media Club Real-Time App
echo ========================================================
echo.
echo [1/2] Starting WebSocket and API Server on port 5000...
start cmd /k "cd /d %~dp0server && node server.js"
echo [2/2] Starting Vite Frontend on port 3000...
start cmd /k "cd /d %~dp0client && npm.cmd run dev"
echo.
echo App launching at http://localhost:3000
echo Open this link in any browser or on your phone!
echo ========================================================