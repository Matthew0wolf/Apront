@echo off
echo ========================================
echo  LIBERANDO PORTA 5001 NO FIREWALL
echo ========================================
echo.
echo Este script precisa de privilegios de Administrador.
echo.

:: Verifica se esta rodando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Executando como Administrador
    echo.
) else (
    echo [ERRO] Nao esta rodando como Administrador!
    echo.
    echo Por favor:
    echo 1. Clique com botao direito neste arquivo
    echo 2. Selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo Criando regra no Firewall...
netsh advfirewall firewall add rule name="Backend Flask 5001" dir=in action=allow protocol=TCP localport=5001

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo  [SUCESSO] Porta 5001 liberada!
    echo ========================================
    echo.
    echo Agora:
    echo 1. Volte ao navegador
    echo 2. Pressione Ctrl + Shift + R para recarregar
    echo 3. A pagina deve funcionar!
    echo.
) else (
    echo.
    echo [ERRO] Nao foi possivel criar a regra
    echo.
)

pause

