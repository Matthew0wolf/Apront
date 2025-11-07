#!/usr/bin/env python3
"""
Script para migrar o banco de dados e adicionar permissões modulares
"""

from app import app
from models import db, User, UserRole

def migrate_permissions():
    """Adiciona colunas de permissões modulares aos usuários existentes"""
    
    with app.app_context():
        try:
            # Adiciona as novas colunas se não existirem
            print("[MIGRATION] Adicionando colunas de permissões modulares...")
            
            # Para usuários existentes, define permissões baseadas no role atual
            users = User.query.all()
            
            for user in users:
                print(f"[MIGRATION] Atualizando usuário: {user.name} (Role: {user.role.value})")
                
                if user.role == UserRole.admin:
                    # Admin tem todas as permissões
                    user.can_operate = True
                    user.can_present = True
                elif user.role == UserRole.operator:
                    # Operator pode operar e apresentar
                    user.can_operate = True
                    user.can_present = True
                elif user.role == UserRole.presenter:
                    # Presenter só pode apresentar
                    user.can_operate = False
                    user.can_present = True
                
                print(f"   [OK] Permissões: operate={user.can_operate}, present={user.can_present}")
            
            # Salva as mudanças
            db.session.commit()
            print("[SUCCESS] Migração concluída com sucesso!")
            
            # Mostra resumo
            print("\n[SUMMARY] Resumo da migração:")
            for user in users:
                permissions = user.get_effective_permissions()
                print(f"   {user.name}: {user.role.value} - {permissions}")
                
        except Exception as e:
            print(f"[ERROR] Erro na migração: {e}")
            db.session.rollback()
            raise

if __name__ == "__main__":
    migrate_permissions()
