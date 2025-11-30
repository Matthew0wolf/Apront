# Script para configurar o arquivo .env corretamente
# Uso: .\configurar_env.ps1

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   🔧 Configurando arquivo .env" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar se env.example.txt existe
if (-not (Test-Path "env.example.txt")) {
    Write-Host "❌ Arquivo env.example.txt não encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar se .env já existe
if (Test-Path ".env") {
    Write-Host "⚠️  Arquivo .env já existe!" -ForegroundColor Yellow
    $resposta = Read-Host "   Deseja sobrescrever? (S/N)"
    if ($resposta -ne "S" -and $resposta -ne "s") {
        Write-Host "   Operação cancelada" -ForegroundColor Gray
        exit 0
    }
    Remove-Item .env -Force
}

# Copiar arquivo
Write-Host "📋 Copiando env.example.txt para .env..." -ForegroundColor Yellow
Copy-Item env.example.txt .env

Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
Write-Host ""

# Verificar conteúdo
$content = Get-Content .env -Raw
if ($content -match "DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5433/apront_db") {
    Write-Host "✅ DATABASE_URL configurada corretamente (porta 5433)" -ForegroundColor Green
} else {
    Write-Host "⚠️  DATABASE_URL pode estar incorreta" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Iniciar PostgreSQL: cd ..; docker-compose up -d postgres" -ForegroundColor Gray
Write-Host "   2. Testar conexão: python testar_conexao_postgres.py" -ForegroundColor Gray
Write-Host ""

