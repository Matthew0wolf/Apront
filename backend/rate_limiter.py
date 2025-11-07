"""
Rate Limiting para proteção contra abuso
Sprint 10 - Melhorias de Segurança
"""

from functools import wraps
from flask import request, jsonify, g
from cache_utils import redis_client, REDIS_AVAILABLE
from datetime import datetime, timedelta
import time

# Configurações de rate limiting
RATE_LIMITS = {
    'default': {'requests': 60, 'window': 60},  # 60 req/min
    'auth': {'requests': 5, 'window': 60},       # 5 req/min (login, registro)
    'api': {'requests': 100, 'window': 60},      # 100 req/min (API geral)
    'heavy': {'requests': 10, 'window': 60},     # 10 req/min (operações pesadas)
}


def get_client_ip():
    """Obtém IP real do cliente (considerando proxy/load balancer)"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr


def check_rate_limit(identifier, limit_type='default'):
    """
    Verifica se o rate limit foi excedido
    
    Args:
        identifier: IP, user_id, ou outro identificador único
        limit_type: Tipo de limite a aplicar
    
    Returns:
        (bool, dict): (is_allowed, info)
    """
    if not REDIS_AVAILABLE:
        # Se Redis não disponível, permitir (não bloquear)
        return True, {'remaining': 999}
    
    limit_config = RATE_LIMITS.get(limit_type, RATE_LIMITS['default'])
    max_requests = limit_config['requests']
    window_seconds = limit_config['window']
    
    # Chave no Redis
    key = f"rate_limit:{limit_type}:{identifier}"
    
    try:
        # Incrementar contador
        current = redis_client.incr(key)
        
        # Se é a primeira requisição, definir expiração
        if current == 1:
            redis_client.expire(key, window_seconds)
        
        # Verificar se excedeu
        if current > max_requests:
            # Obter tempo restante até reset
            ttl = redis_client.ttl(key)
            
            return False, {
                'exceeded': True,
                'limit': max_requests,
                'window': window_seconds,
                'retry_after': ttl,
                'current': current
            }
        
        return True, {
            'exceeded': False,
            'limit': max_requests,
            'remaining': max_requests - current,
            'reset_in': redis_client.ttl(key)
        }
        
    except Exception as e:
        print(f"Erro no rate limiting: {e}")
        # Em caso de erro, permitir (fail-safe)
        return True, {'error': str(e)}


def rate_limit(limit_type='default', key_func=None):
    """
    Decorator para aplicar rate limiting em rotas
    
    Uso:
        @rate_limit('auth')
        def login():
            ...
        
        @rate_limit('api', key_func=lambda: g.current_user.id)
        def get_data():
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Determinar identificador
            if key_func:
                try:
                    identifier = key_func()
                except:
                    identifier = get_client_ip()
            else:
                # Usar IP por padrão
                identifier = get_client_ip()
            
            # Verificar limite
            is_allowed, info = check_rate_limit(identifier, limit_type)
            
            if not is_allowed:
                # Rate limit excedido
                response = jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Muitas requisições. Tente novamente em {info["retry_after"]} segundos.',
                    'retry_after': info['retry_after'],
                    'limit': info['limit'],
                    'window': info['window']
                })
                response.status_code = 429  # Too Many Requests
                response.headers['Retry-After'] = str(info['retry_after'])
                response.headers['X-RateLimit-Limit'] = str(info['limit'])
                response.headers['X-RateLimit-Remaining'] = '0'
                response.headers['X-RateLimit-Reset'] = str(int(time.time()) + info['retry_after'])
                
                return response
            
            # Adicionar headers informativos
            response = func(*args, **kwargs)
            
            # Se é uma Response do Flask, adicionar headers (se não houve erro)
            if hasattr(response, 'headers') and 'limit' in info:
                response.headers['X-RateLimit-Limit'] = str(info['limit'])
                response.headers['X-RateLimit-Remaining'] = str(info.get('remaining', 0))
            
            return response
        
        return wrapper
    return decorator


# Funções de bloqueio temporário (para segurança adicional)

def block_ip(ip, duration_minutes=60):
    """Bloqueia um IP por um período"""
    if not REDIS_AVAILABLE:
        return False
    
    key = f"blocked_ip:{ip}"
    redis_client.setex(key, duration_minutes * 60, '1')
    print(f"🚫 IP bloqueado: {ip} por {duration_minutes} minutos")
    return True


def is_ip_blocked(ip):
    """Verifica se um IP está bloqueado"""
    if not REDIS_AVAILABLE:
        return False
    
    key = f"blocked_ip:{ip}"
    return redis_client.exists(key) > 0


def unblock_ip(ip):
    """Desbloqueia um IP"""
    if not REDIS_AVAILABLE:
        return False
    
    key = f"blocked_ip:{ip}"
    redis_client.delete(key)
    print(f"✅ IP desbloqueado: {ip}")
    return True


# Middleware global de rate limiting
def init_rate_limiting(app):
    """Inicializa rate limiting global na aplicação"""
    
    @app.before_request
    def check_global_rate_limit():
        # Verificar se IP está bloqueado
        client_ip = get_client_ip()
        
        if is_ip_blocked(client_ip):
            return jsonify({
                'error': 'IP blocked',
                'message': 'Seu IP foi bloqueado devido a atividade suspeita. Contate o suporte.'
            }), 403
        
        # Rate limit global básico (muito generoso)
        is_allowed, info = check_rate_limit(client_ip, 'api')
        
        if not is_allowed:
            response = jsonify({
                'error': 'Too many requests',
                'message': f'Limite de requisições excedido. Tente novamente em {info["retry_after"]}s.'
            })
            response.status_code = 429
            return response

