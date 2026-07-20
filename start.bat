@echo off
cd /d "%~dp0"
echo Starting Vocabular Coach...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
