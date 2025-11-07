import sqlite3
import os

def update_database_schema():
    """Atualiza o schema do banco de dados para incluir as novas colunas do SaaS"""
    
    db_path = 'rundowns.db'
    
    if not os.path.exists(db_path):
        print("Banco de dados nao encontrado!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Atualiza tabela plans
        print("Atualizando tabela plans...")
        cursor.execute("ALTER TABLE plans ADD COLUMN description TEXT")
        cursor.execute("ALTER TABLE plans ADD COLUMN max_rundowns INTEGER DEFAULT 10")
        cursor.execute("ALTER TABLE plans ADD COLUMN max_storage_gb INTEGER DEFAULT 1")
        cursor.execute("ALTER TABLE plans ADD COLUMN is_active BOOLEAN DEFAULT 1")
        cursor.execute("ALTER TABLE plans ADD COLUMN created_at TEXT")
        cursor.execute("ALTER TABLE plans ADD COLUMN updated_at TEXT")
        
        # Atualiza tabela companies
        print("Atualizando tabela companies...")
        cursor.execute("ALTER TABLE companies ADD COLUMN domain TEXT")
        cursor.execute("ALTER TABLE companies ADD COLUMN updated_at TEXT")
        cursor.execute("ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'active'")
        cursor.execute("ALTER TABLE companies ADD COLUMN trial_ends_at TEXT")
        
        # Atualiza tabela subscriptions
        print("Atualizando tabela subscriptions...")
        cursor.execute("ALTER TABLE subscriptions ADD COLUMN payment_method TEXT")
        cursor.execute("ALTER TABLE subscriptions ADD COLUMN amount_paid REAL DEFAULT 0.0")
        cursor.execute("ALTER TABLE subscriptions ADD COLUMN external_subscription_id TEXT")
        cursor.execute("ALTER TABLE subscriptions ADD COLUMN updated_at TEXT")
        cursor.execute("ALTER TABLE subscriptions ADD COLUMN cancelled_at TEXT")
        
        # Cria tabela usage_logs
        print("Criando tabela usage_logs...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usage_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER,
                user_id INTEGER,
                action TEXT NOT NULL,
                resource_type TEXT,
                resource_id INTEGER,
                metadata_json TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (company_id) REFERENCES companies (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Cria tabela company_limits
        print("Criando tabela company_limits...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS company_limits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER UNIQUE,
                current_members INTEGER DEFAULT 0,
                current_rundowns INTEGER DEFAULT 0,
                current_storage_gb REAL DEFAULT 0.0,
                last_updated TEXT,
                FOREIGN KEY (company_id) REFERENCES companies (id)
            )
        """)
        
        conn.commit()
        print("Schema atualizado com sucesso!")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Algumas colunas ja existem, continuando...")
        else:
            print(f"Erro ao atualizar schema: {e}")
    except Exception as e:
        print(f"Erro inesperado: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    update_database_schema()
