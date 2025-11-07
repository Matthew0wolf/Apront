"""
Sistema de logs de segurança
Sprint 10 - Auditoria e Segurança
"""

import logging
import json
import time
from datetime import datetime
from flask import request, g
from models import db, SystemEvent

# Configurar logger
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.INFO)

# Handler para arquivo
file_handler = logging.FileHandler('security.log')
file_handler.setLevel(logging.INFO)

# Formato estruturado (JSON)
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'event': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
        }
        
        # Adicionar dados extras se existirem
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'ip_address'):
            log_data['ip_address'] = record.ip_address
        if hasattr(record, 'action'):
            log_data['action'] = record.action
        if hasattr(record, 'resource'):
            log_data['resource'] = record.resource
        
        return json.dumps(log_data)

file_handler.setFormatter(JSONFormatter())
security_logger.addHandler(file_handler)


def log_security_event(event_type, action, resource_type=None, resource_id=None, metadata=None, severity='INFO'):
    """
    Registra evento de segurança
    
    Args:
        event_type: Tipo do evento (login, logout, permission_denied, etc)
        action: Ação realizada
        resource_type: Tipo de recurso afetado
        resource_id: ID do recurso
        metadata: Dados adicionais (dict)
        severity: INFO, WARNING, ERROR, CRITICAL
    """
    
    user = getattr(g, 'current_user', None)
    user_id = user.id if user else None
    company_id = user.company_id if user else None
    ip_address = request.remote_addr if request else None
    user_agent = request.headers.get('User-Agent', '') if request else ''
    
    # Log em arquivo
    extra = {
        'user_id': user_id,
        'ip_address': ip_address,
        'action': action,
        'resource': f"{resource_type}:{resource_id}" if resource_type else None
    }
    
    if severity == 'INFO':
        security_logger.info(event_type, extra=extra)
    elif severity == 'WARNING':
        security_logger.warning(event_type, extra=extra)
    elif severity == 'ERROR':
        security_logger.error(event_type, extra=extra)
    elif severity == 'CRITICAL':
        security_logger.critical(event_type, extra=extra)
    
    # Salvar no banco de dados (SystemEvent)
    try:
        event = SystemEvent(
            event_type=event_type,
            user_id=user_id,
            company_id=company_id,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_json=json.dumps(metadata) if metadata else None,
            created_at=datetime.now(),
            ip_address=ip_address[:50] if ip_address else None,
            user_agent=user_agent[:200] if user_agent else None
        )
        
        db.session.add(event)
        db.session.commit()
        
    except Exception as e:
        print(f"Erro ao salvar evento de segurança: {e}")
        db.session.rollback()


# Eventos pré-definidos

def log_login_success(user_id, email):
    """Log de login bem-sucedido"""
    log_security_event(
        'auth.login.success',
        'User logged in',
        'user',
        user_id,
        {'email': email},
        'INFO'
    )


def log_login_failure(email, reason='Invalid credentials'):
    """Log de tentativa de login falha"""
    log_security_event(
        'auth.login.failure',
        f'Failed login attempt: {reason}',
        metadata={'email': email, 'reason': reason},
        severity='WARNING'
    )


def log_permission_denied(action, resource_type=None, resource_id=None):
    """Log de acesso negado"""
    log_security_event(
        'security.permission_denied',
        f'Permission denied for action: {action}',
        resource_type,
        resource_id,
        {'action': action},
        'WARNING'
    )


def log_data_modification(action, resource_type, resource_id, changes=None):
    """Log de modificação de dados"""
    log_security_event(
        f'data.{action}',
        f'{action.capitalize()} {resource_type}',
        resource_type,
        resource_id,
        {'changes': changes} if changes else None,
        'INFO'
    )


def log_suspicious_activity(description, metadata=None):
    """Log de atividade suspeita"""
    log_security_event(
        'security.suspicious',
        description,
        metadata=metadata,
        severity='ERROR'
    )


def log_security_breach(description, metadata=None):
    """Log de violação de segurança"""
    log_security_event(
        'security.breach',
        description,
        metadata=metadata,
        severity='CRITICAL'
    )


# Middleware para logging automático

def init_security_logging(app):
    """Inicializa logging de segurança global"""
    
    @app.before_request
    def log_request():
        """Log de todas as requisições (apenas rotas sensíveis)"""
        
        # Apenas logar rotas de autenticação e modificação
        sensitive_paths = ['/api/auth/', '/api/user/', '/api/rundowns']
        
        if any(request.path.startswith(path) for path in sensitive_paths):
            g.request_start_time = time.time()
    
    @app.after_request
    def log_response(response):
        """Log de resposta (incluindo tempo de processamento)"""
        
        if hasattr(g, 'request_start_time'):
            elapsed = time.time() - g.request_start_time
            
            # Log de requisições lentas (> 1 segundo)
            if elapsed > 1.0:
                security_logger.warning(
                    f"Slow request: {request.method} {request.path} - {elapsed:.2f}s",
                    extra={
                        'user_id': g.current_user.id if hasattr(g, 'current_user') else None,
                        'ip_address': get_client_ip(),
                        'action': f"{request.method} {request.path}",
                        'resource': f"duration:{elapsed:.2f}s"
                    }
                )
        
        return response

