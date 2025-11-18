# Script PowerShell para conectar na VPS e verificar logs de erro de e-mail
# IP da VPS: 72.60.56.28

$VPS_IP = "72.60.56.28"
$VPS_USER = "root"  # Altere se necessário

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Conectar na VPS para verificar logs" -ForegroundColor Cyan
Write-Host "IP: $VPS_IP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se o SSH está disponível
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshAvailable) {
    Write-Host "ERRO: SSH nao encontrado!" -ForegroundColor Red
    Write-Host "Instale o OpenSSH:" -ForegroundColor Yellow
    Write-Host "  Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ou use um cliente SSH como PuTTY" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "Opcoes disponiveis:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Conectar via SSH (interativo)"
Write-Host "2. Ver logs do Docker Compose (backend) - ultimas 100 linhas"
Write-Host "3. Ver logs de seguranca (security.log) - ultimas 100 linhas"
Write-Host "4. Ver logs de email em tempo real (monitoramento)"
Write-Host "5. Ver logs de email filtrados (ultimas 50 linhas)"
Write-Host "6. Verificar status dos containers Docker"
Write-Host "7. Ver erros recentes (ultimas 50 linhas)"
Write-Host "8. Testar configuracao SMTP"
Write-Host "9. Reiniciar backend"
Write-Host ""
$opcao = Read-Host "Escolha uma opcao (1-9)"

# Função para executar comando SSH
function Invoke-SSHCommand {
    param(
        [string]$Command
    )
    $fullCommand = "ssh $VPS_USER@$VPS_IP `"$Command`""
    Write-Host "Executando: $fullCommand" -ForegroundColor Gray
    Write-Host ""
    Invoke-Expression $fullCommand
}

switch ($opcao) {
    "1" {
        Write-Host ""
        Write-Host "Conectando via SSH..." -ForegroundColor Yellow
        Write-Host "NOTA: Voce precisara informar a senha" -ForegroundColor Yellow
        Write-Host ""
        ssh $VPS_USER@$VPS_IP
    }
    
    "2" {
        Write-Host ""
        Write-Host "Verificando logs do Docker Compose (backend)..." -ForegroundColor Yellow
        Write-Host ""
        # Ajuste o caminho do projeto conforme necessário
        $command = "cd /root/Apront && docker compose logs --tail=100 backend"
        Invoke-SSHCommand -Command $command
    }
    
    "3" {
        Write-Host ""
        Write-Host "Verificando logs de seguranca..." -ForegroundColor Yellow
        Write-Host ""
        $command = "cd /root/Apront && tail -100 backend/security.log"
        Invoke-SSHCommand -Command $command
    }
    
    "4" {
        Write-Host ""
        Write-Host "Monitorando logs de email em tempo real..." -ForegroundColor Yellow
        Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
        Write-Host ""
        $command = "cd /root/Apront && docker compose logs -f backend | grep -i '\[EMAIL\]'"
        Invoke-SSHCommand -Command $command
    }
    
    "5" {
        Write-Host ""
        Write-Host "Logs de email filtrados (ultimas 50 linhas)..." -ForegroundColor Yellow
        Write-Host ""
        $command = "cd /root/Apront && docker compose logs backend | grep -i '\[EMAIL\]' | tail -50"
        Invoke-SSHCommand -Command $command
    }
    
    "6" {
        Write-Host ""
        Write-Host "Verificando status dos containers..." -ForegroundColor Yellow
        Write-Host ""
        $command = "cd /root/Apront && docker compose ps"
        Invoke-SSHCommand -Command $command
    }
    
    "7" {
        Write-Host ""
        Write-Host "Erros recentes (ultimas 50 linhas)..." -ForegroundColor Yellow
        Write-Host ""
        $command = "cd /root/Apront && docker compose logs backend | grep -i error | tail -50"
        Invoke-SSHCommand -Command $command
    }
    
    "8" {
        Write-Host ""
        Write-Host "Testando configuracao SMTP..." -ForegroundColor Yellow
        Write-Host ""
        $command = @"
cd /root/Apront && docker compose exec -T backend python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('SMTP_SERVER:', os.getenv('SMTP_SERVER'))
print('SMTP_PORT:', os.getenv('SMTP_PORT'))
print('SMTP_USERNAME:', os.getenv('SMTP_USERNAME'))
print('SMTP_PASSWORD:', 'DEFINIDO' if os.getenv('SMTP_PASSWORD') else 'NAO DEFINIDO')
print('FROM_EMAIL:', os.getenv('FROM_EMAIL'))
"
"@
        Invoke-SSHCommand -Command $command
    }
    
    "9" {
        Write-Host ""
        Write-Host "Reiniciando backend..." -ForegroundColor Yellow
        Write-Host ""
        $command = "cd /root/Apront && docker compose restart backend"
        Invoke-SSHCommand -Command $command
        Write-Host ""
        Write-Host "Aguardando 3 segundos..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        Write-Host "Verificando logs apos reiniciar..." -ForegroundColor Yellow
        $command = "cd /root/Apront && docker compose logs --tail=20 backend"
        Invoke-SSHCommand -Command $command
    }
    
    default {
        Write-Host "Opcao invalida!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Comando executado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Read-Host "Pressione Enter para sair"

