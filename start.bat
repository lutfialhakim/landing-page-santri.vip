@echo off
title Santri VIP Micro-CMS Server
echo ===================================================
echo Menjalankan Server Santri VIP...
echo Web Publik  : http://localhost:3456/
echo Panel Admin : http://localhost:3456/admin
echo Login       : admin / santri123
echo ===================================================
echo Tekan Ctrl+C untuk menghentikan server.
echo.
"%~dp0server.exe"
pause
