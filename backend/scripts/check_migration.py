#!/usr/bin/env python3
"""
Script para verificar se todas as migrações foram aplicadas corretamente
"""
import sys
from pathlib import Path

# Adiciona o diretório backend ao path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app import app
from models import db
from sqlalchemy import inspect

def check_migrations():
    """Verifica se todas as migrações necessárias foram aplicadas"""
    with app.app_context():
        print("=" * 60)
        print("VERIFICAÇÃO DE MIGRAÇÕES")
        print("=" * 60)
        
        inspector = inspect(db.engine)
        
        # Verifica campos de timer state no rundown
        print("\n📊 Verificando campos de Timer State na tabela 'rundowns'...")
        try:
            columns = [col['name'] for col in inspector.get_columns('rundowns')]
            
            required_timer_fields = {
                'timer_started_at': 'VARCHAR(50) ou TEXT',
                'timer_elapsed_base': 'INTEGER',
                'is_timer_running': 'BOOLEAN ou INTEGER',
                'current_item_index_json': 'TEXT'
            }
            
            all_ok = True
            for field, expected_type in required_timer_fields.items():
                if field in columns:
                    print(f"  ✅ {field}: OK")
                else:
                    print(f"  ❌ {field}: FALTANDO!")
                    all_ok = False
            
            if all_ok:
                print("\n✅ Todos os campos de Timer State estão presentes!")
            else:
                print("\n⚠️ FALTAM campos de Timer State!")
                print("   Execute: python scripts/migrations/add_timer_state_fields.py")
                
        except Exception as e:
            print(f"❌ Erro ao verificar rundowns: {e}")
            return False
        
        # Verifica campos de script nos items
        print("\n📊 Verificando campos de Script na tabela 'items'...")
        try:
            columns = [col['name'] for col in inspector.get_columns('items')]
            
            required_script_fields = {
                'script': 'TEXT',
                'talking_points': 'TEXT',
                'pronunciation_guide': 'TEXT',
                'presenter_notes': 'TEXT'
            }
            
            all_ok = True
            for field, expected_type in required_script_fields.items():
                if field in columns:
                    print(f"  ✅ {field}: OK")
                else:
                    print(f"  ❌ {field}: FALTANDO!")
                    all_ok = False
            
            if all_ok:
                print("\n✅ Todos os campos de Script estão presentes!")
            else:
                print("\n⚠️ FALTAM campos de Script!")
                print("   Execute: python scripts/migrations/add_script_fields.py")
                
        except Exception as e:
            print(f"❌ Erro ao verificar items: {e}")
            return False
        
        # Verifica company_id no rundown
        print("\n📊 Verificando campo company_id na tabela 'rundowns'...")
        try:
            columns = [col['name'] for col in inspector.get_columns('rundowns')]
            
            if 'company_id' in columns:
                print("  ✅ company_id: OK")
            else:
                print("  ❌ company_id: FALTANDO!")
                print("     Execute: python scripts/migrations/add_company_id_to_rundowns.py")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao verificar company_id: {e}")
            return False
        
        print("\n" + "=" * 60)
        print("✅ VERIFICAÇÃO CONCLUÍDA!")
        print("=" * 60)
        return True

if __name__ == '__main__':
    try:
        check_migrations()
    except Exception as e:
        print(f"❌ Erro ao executar verificação: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

