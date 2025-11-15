#!/usr/bin/env python3
"""
Migration: Adiciona company_id aos rundowns existentes
CRÍTICO: Esta migration corrige um problema de segurança onde rundowns não eram isolados por empresa
"""
import sys
import os
from pathlib import Path

# Adiciona o diretório backend ao path
# O script está em backend/scripts/migrations/, então sobe 2 níveis para chegar em backend/
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Importa diretamente (já estamos no diretório backend)
from app import app
from models import db, Rundown, RundownMember, User

def migrate():
    """Adiciona company_id aos rundowns baseado nos usuários associados"""
    with app.app_context():
        print("=" * 60)
        print("MIGRATION: Adicionando company_id aos rundowns")
        print("=" * 60)
        
        # Primeiro, verifica se a coluna já existe
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('rundowns')]
        
        if 'company_id' not in columns:
            print("Adicionando coluna company_id à tabela rundowns...")
            try:
                # Adiciona a coluna (SQLite não suporta ALTER TABLE ADD COLUMN com NOT NULL diretamente)
                # Primeiro adiciona sem NOT NULL
                db.session.execute(text("ALTER TABLE rundowns ADD COLUMN company_id INTEGER"))
                db.session.commit()
                print("Coluna company_id adicionada com sucesso!")
            except Exception as e:
                print(f"Erro ao adicionar coluna (pode já existir): {e}")
                db.session.rollback()
        
        # Busca todos os rundowns sem company_id
        rundowns_sem_company = Rundown.query.filter(Rundown.company_id == None).all()
        
        if not rundowns_sem_company:
            print("Nenhum rundown sem company_id encontrado. Migration não necessária.")
            return
        
        print(f"Encontrados {len(rundowns_sem_company)} rundowns sem company_id")
        print()
        
        atualizados = 0
        sem_company = []
        
        for rundown in rundowns_sem_company:
            # Tenta encontrar company_id através dos membros do rundown
            membro = RundownMember.query.filter_by(rundown_id=rundown.id).first()
            
            if membro:
                user = User.query.get(membro.user_id)
                if user and user.company_id:
                    rundown.company_id = user.company_id
                    atualizados += 1
                    print(f"  Rundown {rundown.id} ({rundown.name}) -> Company {user.company_id}")
                else:
                    sem_company.append(rundown.id)
            else:
                sem_company.append(rundown.id)
        
        if sem_company:
            print()
            print(f"ATENCAO: {len(sem_company)} rundowns sem membros ou usuarios sem company:")
            for rid in sem_company:
                r = Rundown.query.get(rid)
                print(f"  - Rundown {rid}: {r.name if r else 'N/A'}")
            print()
            resposta = input("Deseja deletar esses rundowns órfãos? (s/N): ").strip().lower()
            if resposta == 's':
                for rid in sem_company:
                    r = Rundown.query.get(rid)
                    if r:
                        db.session.delete(r)
                        print(f"  Deletado rundown {rid}")
        
        db.session.commit()
        print()
        print(f"Migration concluida: {atualizados} rundowns atualizados")
        print("=" * 60)

if __name__ == '__main__':
    migrate()

