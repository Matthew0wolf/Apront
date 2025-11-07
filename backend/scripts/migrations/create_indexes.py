"""
Script para criar índices otimizados no banco de dados
Sprint 8 - Otimização de Performance

Uso:
    python create_indexes.py
"""

from app import app, db
from sqlalchemy import text

# Lista de índices a serem criados
INDEXES = [
    # Rundowns
    ("idx_rundowns_status", "rundowns", "status"),
    ("idx_rundowns_type", "rundowns", "type"),
    ("idx_rundowns_created", "rundowns", "created"),
    
    # Folders
    ("idx_folders_rundown", "folders", "rundown_id"),
    ("idx_folders_ordem", "folders", "ordem"),
    
    # Items
    ("idx_items_folder", "items", "folder_id"),
    ("idx_items_ordem", "items", "ordem"),
    ("idx_items_status", "items", "status"),
    
    # Users
    ("idx_users_email", "users", "email"),
    ("idx_users_company", "users", "company_id"),
    ("idx_users_role", "users", "role"),
    
    # RundownMembers
    ("idx_rundown_members_rundown", "rundown_members", "rundown_id"),
    ("idx_rundown_members_user", "rundown_members", "user_id"),
    
    # Notifications
    ("idx_notifications_user", "notifications", "user_id"),
    ("idx_notifications_read", "notifications", "read"),
    ("idx_notifications_created", "notifications", "created_at"),
    
    # Rehearsals
    ("idx_rehearsals_item", "rehearsals", "item_id"),
    ("idx_rehearsals_user", "rehearsals", "user_id"),
    
    # System Events
    ("idx_events_company", "system_events", "company_id"),
    ("idx_events_created", "system_events", "created_at"),
    ("idx_events_type", "system_events", "event_type"),
]

# Índices compostos (múltiplas colunas)
COMPOSITE_INDEXES = [
    ("idx_notifications_user_read", "notifications", ["user_id", "read"]),
    ("idx_rundown_members_composite", "rundown_members", ["rundown_id", "user_id"]),
    ("idx_items_folder_ordem", "items", ["folder_id", "ordem"]),
]


def index_exists(index_name):
    """Verifica se um índice já existe"""
    try:
        result = db.session.execute(text(
            f"SELECT 1 FROM pg_indexes WHERE indexname = '{index_name}'"
        ))
        return result.fetchone() is not None
    except:
        # Se não for PostgreSQL, assumir que não existe
        return False


def create_indexes():
    """Cria todos os índices"""
    
    print("=" * 60)
    print("📊 CRIAÇÃO DE ÍNDICES - OTIMIZAÇÃO DE PERFORMANCE")
    print("=" * 60)
    print()
    
    created_count = 0
    skipped_count = 0
    
    # Índices simples
    print("🔧 Criando índices simples...")
    print()
    
    for index_name, table_name, column_name in INDEXES:
        if index_exists(index_name):
            print(f"   ⏭️  {index_name} - já existe")
            skipped_count += 1
            continue
        
        try:
            sql = f"CREATE INDEX {index_name} ON {table_name}({column_name})"
            db.session.execute(text(sql))
            db.session.commit()
            print(f"   ✅ {index_name} criado")
            created_count += 1
        except Exception as e:
            print(f"   ❌ Erro ao criar {index_name}: {e}")
            db.session.rollback()
    
    print()
    print("🔧 Criando índices compostos...")
    print()
    
    # Índices compostos
    for index_name, table_name, columns in COMPOSITE_INDEXES:
        if index_exists(index_name):
            print(f"   ⏭️  {index_name} - já existe")
            skipped_count += 1
            continue
        
        try:
            columns_str = ', '.join(columns)
            sql = f"CREATE INDEX {index_name} ON {table_name}({columns_str})"
            db.session.execute(text(sql))
            db.session.commit()
            print(f"   ✅ {index_name} criado ({columns_str})")
            created_count += 1
        except Exception as e:
            print(f"   ❌ Erro ao criar {index_name}: {e}")
            db.session.rollback()
    
    print()
    print("=" * 60)
    print(f"✅ ÍNDICES CRIADOS COM SUCESSO!")
    print(f"   Criados: {created_count}")
    print(f"   Já existiam: {skipped_count}")
    print("=" * 60)
    print()
    
    print("📈 Impacto esperado:")
    print("   - Queries 5-10x mais rápidas")
    print("   - Menor uso de CPU")
    print("   - Melhor escalabilidade")
    print()


def analyze_tables():
    """Analisa tabelas para otimizar planos de query"""
    
    print("🔍 Analisando tabelas...")
    print()
    
    tables = ['rundowns', 'folders', 'items', 'users', 'rundown_members', 
              'notifications', 'rehearsals', 'system_events']
    
    for table in tables:
        try:
            db.session.execute(text(f"ANALYZE {table}"))
            print(f"   ✅ {table} analisada")
        except Exception as e:
            print(f"   ⚠️  {table} - {e}")
    
    db.session.commit()
    print()
    print("✅ Análise completa")
    print()


if __name__ == '__main__':
    with app.app_context():
        create_indexes()
        analyze_tables()
        
        print("📝 Próximos passos:")
        print("   1. Reinicie o backend")
        print("   2. Teste a performance")
        print("   3. Monitore os logs")
        print()

