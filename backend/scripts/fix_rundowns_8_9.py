#!/usr/bin/env python3
"""
Script para corrigir rundowns 8 e 9 que foram criados sem company_id
"""
import sys
from pathlib import Path

# Adiciona o diretório backend ao path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app import app
from models import db, Rundown, RundownMember, User

def fix_rundowns():
    with app.app_context():
        print("=" * 60)
        print("Corrigindo rundowns 8 e 9")
        print("=" * 60)
        
        # Busca os rundowns 8 e 9
        rundown_8 = Rundown.query.get(8)
        rundown_9 = Rundown.query.get(9)
        
        if rundown_8:
            print(f"\nRundown 8: {rundown_8.name}")
            print(f"  Company ID atual: {rundown_8.company_id}")
            
            if not rundown_8.company_id:
                # Tenta encontrar company_id através dos membros
                membro = RundownMember.query.filter_by(rundown_id=8).first()
                if membro:
                    user = User.query.get(membro.user_id)
                    if user and user.company_id:
                        rundown_8.company_id = user.company_id
                        print(f"  -> Atualizado para Company {user.company_id}")
                    else:
                        print(f"  -> ERRO: Usuário {membro.user_id} não tem company_id")
                else:
                    print(f"  -> ERRO: Rundown 8 não tem membros associados")
            else:
                print(f"  -> OK: Já tem company_id")
        
        if rundown_9:
            print(f"\nRundown 9: {rundown_9.name}")
            print(f"  Company ID atual: {rundown_9.company_id}")
            
            if not rundown_9.company_id:
                # Tenta encontrar company_id através dos membros
                membro = RundownMember.query.filter_by(rundown_id=9).first()
                if membro:
                    user = User.query.get(membro.user_id)
                    if user and user.company_id:
                        rundown_9.company_id = user.company_id
                        print(f"  -> Atualizado para Company {user.company_id}")
                    else:
                        print(f"  -> ERRO: Usuário {membro.user_id} não tem company_id")
                else:
                    print(f"  -> ERRO: Rundown 9 não tem membros associados")
            else:
                print(f"  -> OK: Já tem company_id")
        
        db.session.commit()
        print("\n" + "=" * 60)
        print("Correção concluída!")
        print("=" * 60)

if __name__ == '__main__':
    fix_rundowns()

