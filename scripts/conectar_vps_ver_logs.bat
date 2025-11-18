@echo off
REM Script para conectar na VPS e verificar logs de erro de e-mail
REM IP da VPS: 72.60.56.28

echo ========================================
echo Conectar na VPS para verificar logs
echo IP: 72.60.56.28
echo ========================================
echo.

REM Verifica se o SSH está disponível
where ssh >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: SSH nao encontrado!
    echo Instale o OpenSSH ou use um cliente SSH como PuTTY
    echo.
    echo Para instalar OpenSSH no Windows:
    echo   - Abra PowerShell como Administrador
    echo   - Execute: Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
    pause
    exit /b 1
)

echo Opcoes disponiveis:
echo.
echo 1. Conectar via SSH (voce precisara informar usuario e senha)
echo 2. Ver logs do Docker Compose (backend)
echo 3. Ver logs de seguranca (security.log)
echo 4. Ver logs de email em tempo real
echo 5. Ver ultimas 100 linhas dos logs do backend
echo 6. Verificar status dos containers Docker
echo.
set /p opcao="Escolha uma opcao (1-6): "

if "%opcao%"=="1" (
    echo.
    echo Conectando via SSH...
    echo NOTA: Voce precisara informar o usuario (geralmente 'root' ou um usuario especifico)
    echo.
    ssh root@72.60.56.28
)

if "%opcao%"=="2" (
    echo.
    echo Verificando logs do Docker Compose (backend)...
    echo.
    ssh root@72.60.56.28 "cd /caminho/do/projeto && docker compose logs backend | tail -100"
)

if "%opcao%"=="3" (
    echo.
    echo Verificando logs de seguranca...
    echo.
    ssh root@72.60.56.28 "cd /caminho/do/projeto && tail -100 backend/security.log"
)

if "%opcao%"=="4" (
    echo.
    echo Monitorando logs de email em tempo real...
    echo Pressione Ctrl+C para parar
    echo.
    ssh root@72.60.56.28 "cd /caminho/do/projeto && docker compose logs -f backend | grep -i email"
)

if "%opcao%"=="5" (
    echo.
    echo Ultimas 100 linhas dos logs do backend...
    echo.
    ssh root@72.60.56.28 "cd /caminho/do/projeto && docker compose logs --tail=100 backend"
)

if "%opcao%"=="6" (
    echo.
    echo Verificando status dos containers...
    echo.
    ssh root@72.60.56.28 "cd /caminho/do/projeto && docker compose ps"
)

pause

