@echo off
echo ========================================
echo LIBERANDO PORTA 5001 NO FIREWALL
echo ========================================
echo.
echo Este script vai criar uma regra no Firewall do Windows
echo para permitir conexoes na porta 5001 (Backend Flask)
echo.
echo IMPORTANTE: Execute como ADMINISTRADOR!
echo (Clique com botao direito e "Executar como administrador")
echo.
pause

echo.
echo Criando regra no Firewall...
netsh advfirewall firewall add rule name="Backend Flask 5001" dir=in action=allow protocol=TCP localport=5001

if %errorlevel% == 0 (
    echo.
    echo ========================================
    echo [SUCESSO] Porta 5001 liberada!
    echo ========================================
    echo.
    echo Agora voce pode:
    echo 1. Iniciar o backend: python backend/app.py
    echo 2. Acessar de outros dispositivos: http://SEU_IP:5001
    echo.
) else (
    echo.
    echo ========================================
    echo [ERRO] Nao foi possivel criar a regra
    echo ========================================
    echo.
    echo Possivel causa: Script nao executado como Administrador
    echo.
    echo SOLUCAO:
    echo 1. Clique com botao direito neste arquivo
    echo 2. Selecione "Executar como administrador"
    echo 3. Tente novamente
    echo.
)

pause

