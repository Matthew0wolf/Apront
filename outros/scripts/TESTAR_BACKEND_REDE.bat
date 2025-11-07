@echo off
echo ========================================
echo TESTE DE CONECTIVIDADE DO BACKEND
echo ========================================
echo.

echo [1] Verificando se o backend esta rodando localmente...
curl -s http://localhost:5001/ >nul 2>&1
if %errorlevel% == 0 (
    echo     [OK] Backend rodando em localhost:5001
) else (
    echo     [ERRO] Backend NAO esta rodando em localhost:5001
    echo     Execute: python backend/app.py
    echo.
    pause
    exit /b 1
)

echo.
echo [2] Obtendo IP local da maquina...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found_ip
)
:found_ip
set IP=%IP: =%
echo     IP encontrado: %IP%

echo.
echo [3] Testando acesso ao backend pelo IP da rede...
curl -s http://%IP%:5001/ >nul 2>&1
if %errorlevel% == 0 (
    echo     [OK] Backend acessivel em http://%IP%:5001
) else (
    echo     [ERRO] Backend NAO acessivel pelo IP %IP%:5001
    echo.
    echo     POSSIVEIS CAUSAS:
    echo     1. Firewall bloqueando conexoes na porta 5001
    echo     2. Backend nao configurado para aceitar conexoes externas
    echo     3. Backend nao esta rodando com host='0.0.0.0'
    echo.
    echo     SOLUCOES:
    echo     1. Abra o Firewall do Windows e permita porta 5001
    echo     2. Verifique se app.py tem: socketio.run(app, host='0.0.0.0', port=5001)
)

echo.
echo [4] Testando JSON da API...
curl -s http://localhost:5001/api/rundowns 2>nul | findstr "error" >nul
if %errorlevel% == 0 (
    echo     [INFO] API retornou resposta (pode ser erro de autenticacao, ok)
) else (
    echo     [OK] API respondendo
)

echo.
echo ========================================
echo TESTE CONCLUIDO
echo ========================================
echo.
echo Acesse o frontend em: http://%IP%:3000
echo Backend deve estar em: http://%IP%:5001
echo.
pause

