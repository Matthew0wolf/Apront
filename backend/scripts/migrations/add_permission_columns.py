#!/usr/bin/env python3
"""
Script para adicionar colunas de permissões modulares ao banco de dados
"""

from app import app
from models import db

def add_permission_columns():
    """Adiciona as colunas de permissões modulares"""
    
    with app.app_context():
        try:
            print("[MIGRATION] Adicionando colunas de permissões modulares...")
            
            # Adiciona as colunas usando SQL direto
            with db.engine.connect() as conn:
                conn.execute(db.text("ALTER TABLE users ADD COLUMN can_operate BOOLEAN DEFAULT 0"))
                print("[OK] Coluna can_operate adicionada")
                
                conn.execute(db.text("ALTER TABLE users ADD COLUMN can_present BOOLEAN DEFAULT 0"))
                print("[OK] Coluna can_present adicionada")
                
                conn.commit()
            
            print("[SUCCESS] Colunas adicionadas com sucesso!")
            
        except Exception as e:
            if "duplicate column name" in str(e):
                print("[INFO] Colunas já existem, pulando...")
            else:
                print(f"[ERROR] Erro ao adicionar colunas: {e}")
                raise

if __name__ == "__main__":
    add_permission_columns()
