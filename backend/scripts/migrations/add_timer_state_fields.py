#!/usr/bin/env python3
"""
Migration: Adiciona campos para estado global do timer no rundown
Permite sincronização em tempo real entre todos os usuários
"""
import sys
import os
from pathlib import Path

# Adiciona o diretório backend ao path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from app import app
from models import db
from sqlalchemy import inspect, text

def migrate():
    """Adiciona campos de timer ao modelo Rundown"""
    with app.app_context():
        print("=" * 60)
        print("MIGRATION: Adicionando campos de estado do timer ao Rundown")
        print("=" * 60)
        
        try:
            # Verifica se as colunas já existem
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('rundowns')]
            
            # Detecta tipo de banco de dados
            db_url = str(db.engine.url)
            is_postgres = 'postgresql' in db_url.lower() or 'postgres' in db_url.lower()
            is_sqlite = 'sqlite' in db_url.lower()
            
            print(f"Tipo de banco detectado: {'PostgreSQL' if is_postgres else 'SQLite' if is_sqlite else 'Desconhecido'}")
            
            fields_to_add = {
                'timer_started_at': "VARCHAR(50)" if is_postgres else "TEXT",
                'timer_elapsed_base': "INTEGER DEFAULT 0",
                'is_timer_running': "BOOLEAN DEFAULT FALSE" if is_postgres else "INTEGER DEFAULT 0",
                'current_item_index_json': "TEXT"
            }
            
            for field_name, field_type in fields_to_add.items():
                if field_name not in columns:
                    print(f"Adicionando coluna {field_name}...")
                    try:
                        sql = f"ALTER TABLE rundowns ADD COLUMN {field_name} {field_type}"
                        print(f"   SQL: {sql}")
                        db.session.execute(text(sql))
                        db.session.commit()
                        print(f"✅ Coluna {field_name} adicionada com sucesso!")
                    except Exception as e:
                        error_msg = str(e)
                        print(f"⚠️ Erro ao adicionar {field_name}: {error_msg}")
                        # Se a coluna já existe (diferentes mensagens por tipo de banco)
                        if 'already exists' in error_msg.lower() or 'duplicate' in error_msg.lower() or 'exist' in error_msg.lower():
                            print(f"   ℹ️ Coluna {field_name} já existe, continuando...")
                        else:
                            db.session.rollback()
                else:
                    print(f"ℹ️ Coluna {field_name} já existe, pulando...")
            
            print("\n✅ Migração concluída com sucesso!")
            
        except Exception as e:
            print(f"❌ Erro durante migração: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()

if __name__ == '__main__':
    migrate()

