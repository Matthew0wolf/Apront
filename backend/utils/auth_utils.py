"""
Utilitários de Autenticação e Autorização
Funções para JWT, validação de permissões, etc.
"""

import jwt
from flask import request, jsonify, g
from functools import wraps
from models import User

# Chave secreta para JWT (deve vir de variável de ambiente em produção)
SECRET_KEY = 'sua_chave_super_secreta'


def jwt_required(allowed_roles=None, permission=None):
    """
    Decorator para proteger rotas que necessitam autenticação
    
    Uso:
        @jwt_required()
        def protected_route():
            current_user = g.current_user
            ...
        
        @jwt_required(allowed_roles=['admin', 'operator'])
        def admin_only_route():
            ...
        
        @jwt_required(permission='operate')
        def operate_route():
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = None
            
            # Obter token do header Authorization
            if 'Authorization' in request.headers:
                auth_header = request.headers['Authorization']
                try:
                    # Formato: "Bearer <token>"
                    token = auth_header.split(' ')[1]
                except IndexError:
                    return jsonify({'error': 'Token inválido'}), 401
            
            if not token:
                return jsonify({'error': 'Token não fornecido'}), 401
            
            try:
                # Decodificar token
                payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
                
                # Buscar usuário
                user_id = payload.get('user_id')
                user = User.query.get(user_id)
                
                if not user:
                    return jsonify({'error': 'Usuário não encontrado'}), 401
                
                # Adicionar usuário ao contexto global
                g.current_user = user
                
                # Verificar role se especificado
                if allowed_roles:
                    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
                    if user_role not in allowed_roles:
                        return jsonify({'error': 'Permissão negada'}), 403
                
                # Verificar permission se especificado
                if permission:
                    if hasattr(user, 'has_permission') and not user.has_permission(permission):
                        return jsonify({'error': f'Permissão negada: {permission}'}), 403
                
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expirado'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Token inválido'}), 401
            except Exception as e:
                return jsonify({'error': f'Erro na autenticação: {str(e)}'}), 401
            
            # Executar função protegida
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_role(*allowed_roles):
    """
    Decorator para restringir acesso por role
    
    Uso:
        @require_role('admin', 'operator')
        def admin_only_route():
            ...
    """
    def decorator(func):
        @wraps(func)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = g.current_user
            
            if user.role.value not in allowed_roles:
                return jsonify({'error': 'Permissão negada'}), 403
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_permission(permission):
    """
    Decorator para restringir acesso por permissão específica
    
    Uso:
        @require_permission('operate')
        def operate_route():
            ...
    """
    def decorator(func):
        @wraps(func)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = g.current_user
            
            if not user.has_permission(permission):
                return jsonify({'error': f'Permissão negada: {permission}'}), 403
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

