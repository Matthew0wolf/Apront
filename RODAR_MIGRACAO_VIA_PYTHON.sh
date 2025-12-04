#!/bin/bash
# Script para rodar migração via Python (quando banco é externo)

echo "=========================================="
echo "🔄 RODANDO MIGRAÇÃO VIA PYTHON"
echo "=========================================="
echo ""

cd ~/Apront/backend || { echo "❌ Diretório backend não encontrado!"; exit 1; }

echo "✅ Entrando no diretório: $(pwd)"
echo ""

# Verificar se Python está disponível
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 não encontrado!"
    exit 1
fi

echo "✅ Python3 encontrado: $(python3 --version)"
echo ""

# Criar script temporário para migração
cat > /tmp/migrate_timer.py << 'PYTHON_SCRIPT'
import os
import sys
from pathlib import Path

# Adiciona o diretório backend ao path
backend_dir = Path(__file__).parent.parent if '__file__' in globals() else Path.cwd()
if not backend_dir.exists():
    backend_dir = Path.home() / 'Apront' / 'backend'
sys.path.insert(0, str(backend_dir))

try:
    from app import app
    from models import db
    from sqlalchemy import text
    
    print("=" * 60)
    print("MIGRATION: Adicionando campos de estado do timer")
    print("=" * 60)
    
    with app.app_context():
        print("✅ Conectado ao banco de dados")
        print("")
        
        # SQL para adicionar colunas
        migrations = [
            ("timer_started_at", "VARCHAR(50)"),
            ("timer_elapsed_base", "INTEGER DEFAULT 0"),
            ("is_timer_running", "BOOLEAN DEFAULT FALSE"),
            ("current_item_index_json", "TEXT")
        ]
        
        for col_name, col_type in migrations:
            print(f"Adicionando coluna {col_name}...")
            try:
                sql = f"ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                db.session.execute(text(sql))
                db.session.commit()
                print(f"✅ Coluna {col_name} adicionada com sucesso!")
            except Exception as e:
                error_msg = str(e)
                if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower():
                    print(f"ℹ️  Coluna {col_name} já existe, pulando...")
                else:
                    print(f"⚠️  Erro ao adicionar {col_name}: {error_msg}")
                    db.session.rollback()
        
        print("")
        print("=" * 60)
        print("✅ Migração concluída com sucesso!")
        print("=" * 60)
        
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("")
    print("Certifique-se de estar no diretório correto e que todas")
    print("as dependências estão instaladas.")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro durante migração: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT

echo "📝 Script de migração criado"
echo ""

# Executar migração
echo "🔄 Executando migração..."
echo ""

python3 /tmp/migrate_timer.py

EXIT_CODE=$?

echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Migração concluída!"
    echo ""
    echo "Próximos passos:"
    echo "  1. Reinicie o backend"
    echo "  2. Teste o sistema"
else
    echo "❌ Erro na migração"
    echo ""
    echo "Tente verificar:"
    echo "  - Se o backend está rodando"
    echo "  - Se a DATABASE_URL está configurada"
    echo "  - Se todas as dependências estão instaladas"
fi

# Limpar script temporário
rm -f /tmp/migrate_timer.py

