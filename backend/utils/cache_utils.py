"""
Utilitários para cache com Redis
Sprint 8 - Melhorias de Performance
"""

import os
import json
import redis
from functools import wraps
from datetime import timedelta

# Configurar Redis
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    # Testar conexão
    redis_client.ping()
    REDIS_AVAILABLE = True
    print("OK: Redis conectado e disponivel")
except:
    redis_client = None
    REDIS_AVAILABLE = False
    print("AVISO: Redis nao disponivel - cache desabilitado")


def cache_key(prefix, *args, **kwargs):
    """Gera chave de cache consistente"""
    parts = [prefix]
    parts.extend(str(arg) for arg in args)
    parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    return ':'.join(parts)


def get_cache(key):
    """Obtém valor do cache"""
    if not REDIS_AVAILABLE:
        return None
    
    try:
        value = redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        print(f"Erro ao ler cache: {e}")
        return None


def set_cache(key, value, ttl=300):
    """
    Define valor no cache
    ttl: time-to-live em segundos (padrão: 5 minutos)
    """
    if not REDIS_AVAILABLE:
        return False
    
    try:
        json_value = json.dumps(value)
        redis_client.setex(key, ttl, json_value)
        return True
    except Exception as e:
        print(f"Erro ao escrever cache: {e}")
        return False


def delete_cache(key):
    """Remove valor do cache"""
    if not REDIS_AVAILABLE:
        return False
    
    try:
        redis_client.delete(key)
        return True
    except Exception as e:
        print(f"Erro ao deletar cache: {e}")
        return False


def delete_cache_pattern(pattern):
    """Remove todas as chaves que correspondem ao padrão"""
    if not REDIS_AVAILABLE:
        return 0
    
    try:
        keys = redis_client.keys(pattern)
        if keys:
            return redis_client.delete(*keys)
        return 0
    except Exception as e:
        print(f"Erro ao deletar pattern: {e}")
        return 0


def cached(ttl=300, key_prefix='cache'):
    """
    Decorator para cachear resultado de funções
    
    Uso:
        @cached(ttl=600, key_prefix='rundowns')
        def get_rundown(rundown_id):
            # ... query pesada ...
            return data
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Gerar chave de cache
            key = cache_key(key_prefix, func.__name__, *args, **kwargs)
            
            # Tentar obter do cache
            cached_value = get_cache(key)
            if cached_value is not None:
                print(f"Cache HIT: {key}")
                return cached_value
            
            # Se não está no cache, executar função
            print(f"Cache MISS: {key}")
            result = func(*args, **kwargs)
            
            # Salvar no cache
            set_cache(key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


# Funções específicas para o Apront

def invalidate_rundown_cache(rundown_id):
    """Invalida cache de um rundown específico"""
    pattern = f"*rundown*{rundown_id}*"
    count = delete_cache_pattern(pattern)
    print(f"Invalidados {count} cache(s) do rundown {rundown_id}")


def invalidate_user_cache(user_id):
    """Invalida cache de um usuário específico"""
    pattern = f"*user*{user_id}*"
    count = delete_cache_pattern(pattern)
    print(f"Invalidados {count} cache(s) do usuario {user_id}")


def invalidate_company_cache(company_id):
    """Invalida cache de uma empresa"""
    pattern = f"*company*{company_id}*"
    count = delete_cache_pattern(pattern)
    print(f"Invalidados {count} cache(s) da empresa {company_id}")


def get_cache_stats():
    """Obtém estatísticas do cache"""
    if not REDIS_AVAILABLE:
        return {
            'available': False,
            'keys': 0,
            'memory_used': 0
        }
    
    try:
        info = redis_client.info('stats')
        memory = redis_client.info('memory')
        
        return {
            'available': True,
            'keys': redis_client.dbsize(),
            'memory_used': memory.get('used_memory_human', '0'),
            'hits': info.get('keyspace_hits', 0),
            'misses': info.get('keyspace_misses', 0),
            'hit_rate': info.get('keyspace_hits', 0) / max(info.get('keyspace_hits', 0) + info.get('keyspace_misses', 1), 1) * 100
        }
    except Exception as e:
        print(f"Erro ao obter stats: {e}")
        return {'available': False, 'error': str(e)}

