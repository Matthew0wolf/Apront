"""
Script de migração para adicionar campos de script e teleprompter
Sprint 1 - Backend: Estrutura de dados para scripts
"""

import sqlite3
from datetime import datetime

def migrate_database():
    """Adiciona campos de script à tabela items e cria tabela rehearsals"""
    
    db_path = 'backend/rundowns.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print(">> Iniciando migracao do banco de dados...")
    print("=" * 60)
    
    try:
        # 1. Adicionar campos de script à tabela items
        print("\n>> Adicionando campos de script a tabela 'items'...")
        
        script_fields = [
            ('script', 'TEXT'),
            ('talking_points', 'TEXT'),
            ('pronunciation_guide', 'TEXT'),
            ('presenter_notes', 'TEXT')
        ]
        
        for field_name, field_type in script_fields:
            try:
                cursor.execute(f'ALTER TABLE items ADD COLUMN {field_name} {field_type}')
                print(f"   [OK] Campo '{field_name}' adicionado com sucesso")
            except sqlite3.OperationalError as e:
                if 'duplicate column name' in str(e).lower():
                    print(f"   [!] Campo '{field_name}' ja existe, pulando...")
                else:
                    raise e
        
        # 2. Criar tabela rehearsals
        print("\n>> Criando tabela 'rehearsals'...")
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS rehearsals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                duration INTEGER,
                planned_duration INTEGER,
                difference INTEGER,
                recorded_at TEXT NOT NULL,
                notes TEXT,
                FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ''')
        print("   [OK] Tabela 'rehearsals' criada com sucesso")
        
        # 3. Criar índices para melhor performance
        print("\n>> Criando indices...")
        
        indices = [
            ('idx_rehearsals_item', 'rehearsals', 'item_id'),
            ('idx_rehearsals_user', 'rehearsals', 'user_id'),
            ('idx_rehearsals_recorded', 'rehearsals', 'recorded_at')
        ]
        
        for index_name, table_name, column_name in indices:
            try:
                cursor.execute(f'CREATE INDEX IF NOT EXISTS {index_name} ON {table_name}({column_name})')
                print(f"   [OK] Indice '{index_name}' criado com sucesso")
            except sqlite3.OperationalError as e:
                print(f"   [!] Erro ao criar indice '{index_name}': {e}")
        
        # 4. Commit das mudanças
        conn.commit()
        
        print("\n" + "=" * 60)
        print("[OK] Migracao concluida com sucesso!")
        print("\nResumo das alteracoes:")
        print("  - 4 novos campos adicionados a tabela 'items'")
        print("  - 1 nova tabela 'rehearsals' criada")
        print("  - 3 indices criados para otimizacao")
        print("\nNovos campos na tabela 'items':")
        print("  - script: Script completo do apresentador")
        print("  - talking_points: Pontos-chave (JSON)")
        print("  - pronunciation_guide: Guia de pronuncia")
        print("  - presenter_notes: Notas privadas")
        print("\nNova tabela 'rehearsals':")
        print("  - Armazena ensaios/treinos dos apresentadores")
        print("  - Registra duracao, diferencas e notas")
        
    except Exception as e:
        print(f"\n[ERRO] Erro durante a migracao: {e}")
        conn.rollback()
        raise e
    
    finally:
        cursor.close()
        conn.close()
        print("\nConexao com banco de dados fechada.")


def verify_migration():
    """Verifica se a migração foi aplicada corretamente"""
    
    db_path = 'backend/rundowns.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("\n" + "=" * 60)
    print(">> Verificando migracao...")
    print("=" * 60)
    
    try:
        # Verificar campos da tabela items
        cursor.execute("PRAGMA table_info(items)")
        items_columns = {row[1] for row in cursor.fetchall()}
        
        required_fields = {'script', 'talking_points', 'pronunciation_guide', 'presenter_notes'}
        missing_fields = required_fields - items_columns
        
        if missing_fields:
            print(f"\n[!] Campos faltando na tabela 'items': {missing_fields}")
        else:
            print("\n[OK] Todos os campos de script estao presentes na tabela 'items'")
        
        # Verificar se tabela rehearsals existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='rehearsals'")
        rehearsals_exists = cursor.fetchone() is not None
        
        if rehearsals_exists:
            print("[OK] Tabela 'rehearsals' existe")
            
            # Verificar estrutura da tabela rehearsals
            cursor.execute("PRAGMA table_info(rehearsals)")
            rehearsal_columns = [row[1] for row in cursor.fetchall()]
            print(f"   Colunas: {', '.join(rehearsal_columns)}")
        else:
            print("[!] Tabela 'rehearsals' nao encontrada")
        
        # Contar registros
        cursor.execute("SELECT COUNT(*) FROM items")
        items_count = cursor.fetchone()[0]
        print(f"\n>> Total de items no banco: {items_count}")
        
        if rehearsals_exists:
            cursor.execute("SELECT COUNT(*) FROM rehearsals")
            rehearsals_count = cursor.fetchone()[0]
            print(f">> Total de ensaios registrados: {rehearsals_count}")
        
    except Exception as e:
        print(f"\n[ERRO] Erro durante verificacao: {e}")
    
    finally:
        cursor.close()
        conn.close()
        print("\n" + "=" * 60)


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("MIGRACAO - SISTEMA DE TELEPROMPTER/SCRIPT")
    print("Sprint 1: Adicionar campos de script no banco de dados")
    print("=" * 60 + "\n")
    
    # Executar migração
    migrate_database()
    
    # Verificar migração
    verify_migration()
    
    print("\n[OK] Processo concluido! O banco esta pronto para o sistema de teleprompter.\n")

