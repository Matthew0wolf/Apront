# Script para copiar .env da VPS para o PC local
# Execute: .\scripts\copiar_env_da_vps.ps1

$VPS_IP = "72.60.56.28"
$VPS_USER = "root"
$LOCAL_PATH = "backend\.env"

Write-Host "========================================"
Write-Host "Copiando .env da VPS para PC local"
Write-Host "========================================"
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "backend")) {
    Write-Host "❌ Erro: Diretório 'backend' não encontrado!"
    Write-Host "Execute este script da raiz do projeto (onde está o diretório backend/)"
    exit 1
}

Write-Host "1. Conectando na VPS e copiando .env do container..."
Write-Host ""

# Copiar .env do container Docker na VPS
$envContent = ssh "${VPS_USER}@${VPS_IP}" "docker exec apront-backend cat /app/.env"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao conectar na VPS ou acessar o container!"
    Write-Host "Verifique:"
    Write-Host "  - Conexão SSH com a VPS"
    Write-Host "  - Container 'apront-backend' está rodando"
    exit 1
}

# Salvar conteúdo no arquivo local
$envContent | Out-File -FilePath $LOCAL_PATH -Encoding utf8 -NoNewline

Write-Host "2. Verificando se arquivo foi criado..."
if (Test-Path $LOCAL_PATH) {
    Write-Host "✅ Arquivo criado em: $LOCAL_PATH"
    Write-Host ""
    Write-Host "3. Conteúdo do arquivo:"
    Write-Host "----------------------------------------"
    Get-Content $LOCAL_PATH
    Write-Host "----------------------------------------"
    Write-Host ""
    Write-Host "✅ .env copiado com sucesso!"
} else {
    Write-Host "❌ Erro: Arquivo não foi criado!"
    exit 1
}

Write-Host ""
Write-Host "⚠️  IMPORTANTE:"
Write-Host "   - O arquivo .env está no .gitignore (não será commitado)"
Write-Host "   - Isso é correto por segurança!"
Write-Host "   - Use env.example.txt para referência no Git"

