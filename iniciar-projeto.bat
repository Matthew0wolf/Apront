@echo off
echo ========================================
echo    INICIANDO SISTEMA APRONT COMPLETO
echo ========================================
echo.
echo Iniciando Backend e Frontend...
echo.
echo Backend sera iniciado na porta 5001
echo Frontend sera iniciado na porta 3000
echo.
echo Pressione Ctrl+C para encerrar ambos os servidores
echo.

REM Iniciar Backend em nova janela
start "Backend - Sistema Apront" cmd /k "cd backend && python app.py"

REM Aguardar um pouco para o backend iniciar
timeout /t 3 /nobreak >nul

REM Iniciar Frontend em nova janela
start "Frontend - Sistema Apront" cmd /k "npm run dev"

echo.
echo ========================================
echo    Servidores iniciados!
echo ========================================
echo.
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo As janelas dos servidores foram abertas separadamente.
echo Feche as janelas ou pressione Ctrl+C para encerrar.
echo.
pause

