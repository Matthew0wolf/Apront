"""
Script para migrar dados do SQLite para PostgreSQL
Sprint 3 - Migração de Banco de Dados

Como usar:
1. Certifique-se que o PostgreSQL está rodando (docker-compose up postgres)
2. Execute: python migrate_to_postgres.py
3. Confirme a migração quando solicitado
"""

import sqlite3
import psycopg2
from psycopg2.extras import execute_batch
import os
import json
from datetime import datetime

# Configurações
SQLITE_DB = 'rundowns.db'
# Usa variável de ambiente ou padrão (porta 5433 para Docker)
POSTGRES_URL = os.getenv('DATABASE_URL', 'postgresql://apront_user:apront_password_2024@localhost:5433/apront_db')

def get_sqlite_connection():
    """Conecta ao banco SQLite"""
    if not os.path.exists(SQLITE_DB):
        print(f"❌ Erro: Arquivo {SQLITE_DB} não encontrado!")
        return None
    return sqlite3.connect(SQLITE_DB)

def get_postgres_connection():
    """Conecta ao banco PostgreSQL"""
    try:
        conn = psycopg2.connect(POSTGRES_URL)
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar no PostgreSQL: {e}")
        print(f"URL: {POSTGRES_URL}")
        return None

def create_tables_postgres(pg_conn):
    """Cria todas as tabelas no PostgreSQL"""
    print("📋 Criando tabelas no PostgreSQL...")
    
    cursor = pg_conn.cursor()
    
    # As tabelas serão criadas automaticamente pelo SQLAlchemy
    # mas vamos garantir que o schema esteja correto
    
    from models import db
    from app import app
    
    with app.app_context():
        db.create_all()
    
    print("✅ Tabelas criadas com sucesso!")

def migrate_table(sqlite_conn, pg_conn, table_name, columns):
    """Migra uma tabela específica"""
    print(f"📦 Migrando tabela: {table_name}")
    
    sqlite_cursor = sqlite_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    # Buscar dados do SQLite
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cursor.fetchall()
    
    if not rows:
        print(f"   ⚠️  Tabela {table_name} está vazia")
        return 0
    
    # Preparar query de inserção
    placeholders = ', '.join(['%s'] * len(columns))
    insert_query = f"""
        INSERT INTO {table_name} ({', '.join(columns)})
        VALUES ({placeholders})
        ON CONFLICT DO NOTHING
    """
    
    # Inserir dados
    try:
        execute_batch(pg_cursor, insert_query, rows, page_size=100)
        pg_conn.commit()
        print(f"   ✅ {len(rows)} registros migrados")
        return len(rows)
    except Exception as e:
        print(f"   ❌ Erro ao migrar {table_name}: {e}")
        pg_conn.rollback()
        return 0

def migrate_all_data():
    """Migra todos os dados do SQLite para PostgreSQL"""
    print("=" * 60)
    print("🚀 MIGRAÇÃO SQLITE → POSTGRESQL")
    print("=" * 60)
    print()
    
    # Conectar aos bancos
    print("🔌 Conectando aos bancos de dados...")
    sqlite_conn = get_sqlite_connection()
    if not sqlite_conn:
        return False
    
    pg_conn = get_postgres_connection()
    if not pg_conn:
        sqlite_conn.close()
        return False
    
    print("✅ Conexões estabelecidas!")
    print()
    
    # Listar tabelas do SQLite
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"📊 Tabelas encontradas: {len(tables)}")
    for table in tables:
        print(f"   - {table}")
    print()
    
    # Confirmar migração
    response = input("⚠️  Deseja continuar com a migração? (sim/não): ")
    if response.lower() not in ['sim', 's', 'yes', 'y']:
        print("❌ Migração cancelada pelo usuário")
        sqlite_conn.close()
        pg_conn.close()
        return False
    
    print()
    print("🔄 Iniciando migração...")
    print()
    
    total_migrated = 0
    
    # Definir ordem de migração (respeitando foreign keys)
    migration_order = [
        ('plans', ['id', 'name', 'description', 'price', 'max_members', 'max_rundowns', 'max_storage_gb', 'features', 'billing_cycle', 'is_active', 'created_at', 'updated_at']),
        ('companies', ['id', 'name', 'domain', 'plan_id', 'created_at', 'updated_at', 'status', 'trial_ends_at']),
        ('users', ['id', 'name', 'email', 'password_hash', 'role', 'company_id', 'joined_at', 'last_active', 'status', 'avatar', 'updated_at', 'can_operate', 'can_present']),
        ('rundowns', ['id', 'name', 'type', 'created', 'last_modified', 'status', 'duration', 'team_members', 'company_id']),
        ('rundown_members', ['id', 'rundown_id', 'user_id', 'role']),
        ('folders', ['id', 'title', 'ordem', 'rundown_id']),
        ('items', ['id', 'title', 'duration', 'description', 'type', 'status', 'icon_type', 'icon_data', 'color', 'urgency', 'reminder', 'ordem', 'folder_id', 'script', 'talking_points', 'pronunciation_guide', 'presenter_notes']),
        ('invites', ['id', 'email', 'company_id', 'role', 'invited_by', 'status', 'sent_at', 'token']),
        ('subscriptions', ['id', 'company_id', 'plan_id', 'status', 'payment_method', 'payment_date', 'next_billing_date', 'amount_paid', 'external_subscription_id', 'created_at', 'updated_at', 'cancelled_at']),
    ]
    
    for table_name, columns in migration_order:
        # Verificar se a tabela existe no SQLite
        cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")
        if cursor.fetchone():
            migrated = migrate_table(sqlite_conn, pg_conn, table_name, columns)
            total_migrated += migrated
        else:
            print(f"   ⚠️  Tabela {table_name} não existe no SQLite")
    
    print()
    print("=" * 60)
    print(f"✅ MIGRAÇÃO CONCLUÍDA!")
    print(f"📊 Total de registros migrados: {total_migrated}")
    print("=" * 60)
    
    # Fechar conexões
    sqlite_conn.close()
    pg_conn.close()
    
    return True

def verify_migration():
    """Verifica se a migração foi bem-sucedida"""
    print()
    print("🔍 Verificando migração...")
    
    pg_conn = get_postgres_connection()
    if not pg_conn:
        return False
    
    cursor = pg_conn.cursor()
    
    # Contar registros em tabelas principais
    tables_to_check = ['users', 'companies', 'rundowns', 'items']
    
    print()
    print("📊 Contagem de registros:")
    for table in tables_to_check:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   {table}: {count} registros")
        except Exception as e:
            print(f"   ❌ Erro ao verificar {table}: {e}")
    
    pg_conn.close()
    print()
    return True

if __name__ == '__main__':
    print()
    print("🔧 MIGRAÇÃO DE BANCO DE DADOS")
    print("SQLite → PostgreSQL")
    print()
    
    # Verificar se o arquivo SQLite existe
    if not os.path.exists(SQLITE_DB):
        print(f"❌ Arquivo {SQLITE_DB} não encontrado!")
        print(f"   Certifique-se de estar no diretório 'backend'")
        exit(1)
    
    # Executar migração
    success = migrate_all_data()
    
    if success:
        verify_migration()
        print()
        print("✅ Migração finalizada com sucesso!")
        print()
        print("📝 Próximos passos:")
        print("   1. Atualize o app.py para usar PostgreSQL")
        print("   2. Reinicie o backend: docker-compose restart backend")
        print("   3. Teste a aplicação")
        print()
    else:
        print()
        print("❌ Migração falhou!")
        print()

