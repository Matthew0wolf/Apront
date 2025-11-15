#!/usr/bin/env python3
"""
Script para deletar uma empresa e todos os seus dados relacionados.

USO:
    python delete_company.py "Nome da Empresa"
    
EXEMPLO:
    python delete_company.py "apront"
    
ATENÇÃO: Esta operação é IRREVERSÍVEL!
"""

import sys
import os
from pathlib import Path

# Adiciona o diretório backend ao path
backend_dir = Path(__file__).parent.parent.absolute()
sys.path.insert(0, str(backend_dir))

from app import app
from models import (
    db, Company, User, Rundown, Invite, Subscription, 
    UsageLog, CompanyLimits, Notification, SystemEvent,
    TemplateLike, TemplateRating, Rehearsal, NotificationPreferences,
    RundownMember
)

def delete_company(company_name):
    """Deleta uma empresa e todos os seus dados relacionados."""
    
    with app.app_context():
        # 1. Encontrar a empresa
        company = Company.query.filter_by(name=company_name).first()
        
        if not company:
            print(f"❌ Empresa '{company_name}' não encontrada!")
            print("\n📋 Empresas disponíveis:")
            companies = Company.query.all()
            for c in companies:
                print(f"   - {c.name} (ID: {c.id})")
            return False
        
        company_id = company.id
        print(f"🔍 Empresa encontrada: {company.name} (ID: {company_id})")
        
        # 2. Listar dados que serão deletados
        users_count = User.query.filter_by(company_id=company_id).count()
        rundowns_count = Rundown.query.filter_by(company_id=company_id).count()
        invites_count = Invite.query.filter_by(company_id=company_id).count()
        subscriptions_count = Subscription.query.filter_by(company_id=company_id).count()
        notifications_count = Notification.query.filter_by(company_id=company_id).count()
        usage_logs_count = UsageLog.query.filter_by(company_id=company_id).count()
        system_events_count = SystemEvent.query.filter_by(company_id=company_id).count()
        company_limits = CompanyLimits.query.filter_by(company_id=company_id).first()
        
        print(f"\n📊 Dados que serão deletados:")
        print(f"   - Usuários: {users_count}")
        print(f"   - Rundowns: {rundowns_count}")
        print(f"   - Convites: {invites_count}")
        print(f"   - Assinaturas: {subscriptions_count}")
        print(f"   - Notificações: {notifications_count}")
        print(f"   - Logs de uso: {usage_logs_count}")
        print(f"   - Eventos do sistema: {system_events_count}")
        print(f"   - Limites da empresa: {'Sim' if company_limits else 'Não'}")
        
        # 3. Confirmar deleção
        print(f"\n⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!")
        confirm = input(f"\n❓ Tem certeza que deseja deletar a empresa '{company_name}'? (digite 'SIM' para confirmar): ")
        
        if confirm != 'SIM':
            print("❌ Operação cancelada.")
            return False
        
        print(f"\n🗑️  Iniciando deleção...")
        
        try:
            # 4. Deletar dados relacionados aos usuários (antes de deletar os usuários)
            user_ids = [u.id for u in User.query.filter_by(company_id=company_id).all()]
            
            if user_ids:
                print(f"   🗑️  Deletando dados relacionados aos {len(user_ids)} usuários...")
                
                # Template likes e ratings
                TemplateLike.query.filter(TemplateLike.user_id.in_(user_ids)).delete(synchronize_session=False)
                TemplateRating.query.filter(TemplateRating.user_id.in_(user_ids)).delete(synchronize_session=False)
                print(f"      ✅ Template likes/ratings deletados")
                
                # Rehearsals
                Rehearsal.query.filter(Rehearsal.user_id.in_(user_ids)).delete(synchronize_session=False)
                print(f"      ✅ Ensaios deletados")
                
                # Notification preferences
                NotificationPreferences.query.filter(NotificationPreferences.user_id.in_(user_ids)).delete(synchronize_session=False)
                print(f"      ✅ Preferências de notificação deletadas")
                
                # Notifications (por user_id)
                Notification.query.filter(Notification.user_id.in_(user_ids)).delete(synchronize_session=False)
                print(f"      ✅ Notificações dos usuários deletadas")
                
                # System events (por user_id)
                SystemEvent.query.filter(SystemEvent.user_id.in_(user_ids)).delete(synchronize_session=False)
                print(f"      ✅ Eventos do sistema dos usuários deletados")
                
                # Rundown members
                RundownMember.query.filter(RundownMember.user_id.in_(user_ids)).delete(synchronize_session=False)
                print(f"      ✅ Membros de rundowns deletados")
            
            # 5. Deletar rundowns (cascade deleta folders, items, etc)
            if rundowns_count > 0:
                print(f"   🗑️  Deletando {rundowns_count} rundowns...")
                Rundown.query.filter_by(company_id=company_id).delete()
                print(f"      ✅ Rundowns deletados")
            
            # 6. Deletar invites
            if invites_count > 0:
                print(f"   🗑️  Deletando {invites_count} convites...")
                Invite.query.filter_by(company_id=company_id).delete()
                print(f"      ✅ Convites deletados")
            
            # 7. Deletar subscriptions (cascade já faz isso, mas garantimos)
            if subscriptions_count > 0:
                print(f"   🗑️  Deletando {subscriptions_count} assinaturas...")
                Subscription.query.filter_by(company_id=company_id).delete()
                print(f"      ✅ Assinaturas deletadas")
            
            # 8. Deletar notifications (por company_id)
            if notifications_count > 0:
                print(f"   🗑️  Deletando {notifications_count} notificações...")
                Notification.query.filter_by(company_id=company_id).delete()
                print(f"      ✅ Notificações deletadas")
            
            # 9. Deletar usage logs
            if usage_logs_count > 0:
                print(f"   🗑️  Deletando {usage_logs_count} logs de uso...")
                UsageLog.query.filter_by(company_id=company_id).delete()
                print(f"      ✅ Logs de uso deletados")
            
            # 10. Deletar system events (por company_id)
            if system_events_count > 0:
                print(f"   🗑️  Deletando {system_events_count} eventos do sistema...")
                SystemEvent.query.filter_by(company_id=company_id).delete()
                print(f"      ✅ Eventos do sistema deletados")
            
            # 11. Deletar company limits
            if company_limits:
                print(f"   🗑️  Deletando limites da empresa...")
                db.session.delete(company_limits)
                print(f"      ✅ Limites deletados")
            
            # 12. Deletar usuários (cascade já faz isso, mas garantimos)
            if users_count > 0:
                print(f"   🗑️  Deletando {users_count} usuários...")
                User.query.filter_by(company_id=company_id).delete()
                print(f"      ✅ Usuários deletados")
            
            # 13. Deletar a empresa
            print(f"   🗑️  Deletando empresa...")
            db.session.delete(company)
            
            # 14. Commit
            db.session.commit()
            
            print(f"\n✅ Empresa '{company_name}' e todos os seus dados foram deletados com sucesso!")
            return True
            
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Erro ao deletar empresa: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("❌ Uso: python delete_company.py 'Nome da Empresa'")
        print("\nExemplo:")
        print("   python delete_company.py 'apront'")
        sys.exit(1)
    
    company_name = sys.argv[1]
    success = delete_company(company_name)
    sys.exit(0 if success else 1)

