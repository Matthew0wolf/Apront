@echo off
REM Script para backup manual ou agendado (Windows)
REM Sprint 9 - Backup Automático

echo ================================================
echo   BACKUP DO BANCO DE DADOS - APRONT
echo ================================================
echo.

cd /d "%~dp0"

REM Criar diretório de backups se não existir
if not exist "backups" mkdir backups

REM Executar backup
python backup_database.py --compress

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo   BACKUP CONCLUIDO COM SUCESSO!
    echo ================================================
    echo.
) else (
    echo.
    echo ================================================
    echo   ERRO NO BACKUP!
    echo ================================================
    echo.
    exit /b 1
)

REM Manter janela aberta se executado manualmente
if "%1"=="" pause

