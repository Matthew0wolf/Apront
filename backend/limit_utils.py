import json
import datetime
from functools import wraps
from flask import request, jsonify, g
from models import db, Company, Plan, CompanyLimits, UsageLog, User

def check_company_limits(company_id, action, resource_type=None, resource_id=None):
    """Verifica se a empresa pode realizar uma ação baseada nos limites do plano"""
    try:
        # Busca a empresa e seu plano
        company = Company.query.get(company_id)
        if not company or not company.plan:
            return False, "Empresa ou plano não encontrado"
        
        # Busca ou cria os limites da empresa
        limits = CompanyLimits.query.filter_by(company_id=company_id).first()
        if not limits:
            limits = CompanyLimits(company_id=company_id)
            db.session.add(limits)
            db.session.commit()
        
        plan = company.plan
        
        # Verifica status da empresa
        if company.status != 'active':
            return False, "Empresa suspensa ou cancelada"
        
        # Verifica se está em trial e se expirou
        if company.trial_ends_at:
            trial_end = datetime.datetime.fromisoformat(company.trial_ends_at)
            if datetime.datetime.utcnow() > trial_end:
                return False, "Período de teste expirado"
        
        # Verifica limites específicos
        if action == 'invite_user':
            if limits.current_members >= plan.max_members:
                return False, f"Limite de {plan.max_members} membros atingido"
        
        elif action == 'create_rundown':
            if limits.current_rundowns >= plan.max_rundowns:
                return False, f"Limite de {plan.max_rundowns} projetos atingido"
        
        elif action == 'upload_file':
            # Aqui você implementaria verificação de storage
            pass
        
        return True, "Limite OK"
    
    except Exception as e:
        return False, f"Erro ao verificar limites: {str(e)}"

def update_company_limits(company_id, action, resource_type=None, resource_id=None, increment=True):
    """Atualiza os contadores de uso da empresa"""
    try:
        limits = CompanyLimits.query.filter_by(company_id=company_id).first()
        if not limits:
            limits = CompanyLimits(company_id=company_id)
            db.session.add(limits)
        
        # Atualiza contadores baseado na ação
        if action == 'invite_user':
            limits.current_members += 1 if increment else -1
        elif action == 'create_rundown':
            limits.current_rundowns += 1 if increment else -1
        elif action == 'delete_rundown':
            limits.current_rundowns = max(0, limits.current_rundowns - 1)
        elif action == 'remove_user':
            limits.current_members = max(0, limits.current_members - 1)
        
        limits.last_updated = datetime.datetime.utcnow().isoformat()
        db.session.commit()
        
        return True
    except Exception as e:
        db.session.rollback()
        return False

def log_usage(company_id, user_id, action, resource_type=None, resource_id=None, metadata=None):
    """Registra o uso para auditoria"""
    try:
        usage_log = UsageLog(
            company_id=company_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_json=json.dumps(metadata) if metadata else None,
            created_at=datetime.datetime.utcnow().isoformat()
        )
        db.session.add(usage_log)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        return False

def limit_check(action, resource_type=None):
    """Decorator para verificar limites antes de executar uma ação"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not hasattr(g, 'current_user') or not g.current_user:
                return jsonify({'error': 'Usuário não autenticado'}), 401
            
            company_id = g.current_user.company_id
            if not company_id:
                return jsonify({'error': 'Usuário não associado a uma empresa'}), 400
            
            # Verifica limites
            can_proceed, message = check_company_limits(company_id, action, resource_type)
            if not can_proceed:
                return jsonify({'error': message, 'limit_exceeded': True}), 403
            
            # Executa a função
            result = f(*args, **kwargs)
            
            # Se foi sucesso, atualiza limites e loga uso
            if hasattr(result, 'status_code') and result.status_code < 400:
                update_company_limits(company_id, action, resource_type)
                log_usage(company_id, g.current_user.id, action, resource_type)
            
            return result
        return wrapper
    return decorator

def get_company_usage_stats(company_id):
    """Retorna estatísticas de uso da empresa"""
    try:
        limits = CompanyLimits.query.filter_by(company_id=company_id).first()
        company = Company.query.get(company_id)
        
        if not limits or not company or not company.plan:
            return None
        
        return {
            'members': {
                'current': limits.current_members,
                'limit': company.plan.max_members,
                'percentage': (limits.current_members / company.plan.max_members) * 100
            },
            'rundowns': {
                'current': limits.current_rundowns,
                'limit': company.plan.max_rundowns,
                'percentage': (limits.current_rundowns / company.plan.max_rundowns) * 100
            },
            'storage': {
                'current': limits.current_storage_gb,
                'limit': company.plan.max_storage_gb,
                'percentage': (limits.current_storage_gb / company.plan.max_storage_gb) * 100
            },
            'plan': {
                'name': company.plan.name,
                'price': company.plan.price,
                'billing_cycle': company.plan.billing_cycle
            },
            'company_status': company.status,
            'trial_ends_at': company.trial_ends_at
        }
    except Exception as e:
        return None
