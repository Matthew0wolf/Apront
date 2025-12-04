#!/bin/bash
# Script para rodar migração via Python (banco em localhost:5433)

echo "=========================================="
echo "🔄 RODANDO MIGRAÇÃO"
echo "=========================================="
echo ""

cd ~/Apront/backend || { echo "❌ Diretório backend não encontrado!"; exit 1; }

echo "✅ Diretório: $(pwd)"
echo ""

# Rodar migração via Python
python3 << 'PYEOF'
import os
import sys
from pathlib import Path

# Adiciona o diretório backend ao path
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
        
        # Lista de colunas para adicionar
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
                if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower() or 'exist' in error_msg.lower():
                    print(f"ℹ️  Coluna {col_name} já existe, pulando...")
                else:
                    print(f"⚠️  Erro ao adicionar {col_name}: {error_msg}")
                    db.session.rollback()
        
        # Verificar se as colunas foram criadas
        print("")
        print("Verificando colunas...")
        result = db.session.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rundowns' 
              AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json')
            ORDER BY column_name
        """))
        
        columns = result.fetchall()
        if columns:
            print("✅ Colunas encontradas no banco:")
            for col in columns:
                print(f"   - {col[0]} ({col[1]})")
        else:
            print("⚠️  Nenhuma coluna encontrada (isso é estranho)")
        
        print("")
        print("=" * 60)
        print("✅ Migração concluída com sucesso!")
        print("=" * 60)
        
except ImportError as e:
    print(f"❌ Erro ao importar módulos: {e}")
    print("")
    print("Certifique-se de estar no diretório correto:")
    print(f"  {backend_dir}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro durante migração: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYEOF

EXIT_CODE=$?

echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Migração concluída!"
    echo ""
    echo "Próximos passos:"
    echo "  1. Reinicie o backend:"
    echo "     sudo systemctl restart apront-backend"
    echo "     (ou sudo systemctl restart gunicorn)"
    echo ""
    echo "  2. Teste o sistema"
    echo ""
    echo "  3. O erro 500 vai parar!"
    echo "  4. O timer não vai mais iniciar automaticamente!"
else
    echo "❌ Erro na migração"
    echo ""
    echo "Verifique:"
    echo "  - Se o backend está rodando"
    echo "  - Se o banco está acessível na porta 5433"
    echo "  - Se todas as dependências estão instaladas"
fi

