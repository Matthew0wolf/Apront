"""
Utilitários de Autenticação e Autorização
Funções para JWT, validação de permissões, etc.
"""

import jwt
from flask import request, jsonify, g
from functools import wraps
from models import User
import os

# Chave secreta para JWT (deve vir de variável de ambiente em produção)
SECRET_KEY = os.getenv('JWT_SECRET_KEY') or os.getenv('SECRET_KEY') or 'sua_chave_super_secreta'


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
                    print(f"❌ jwt_required: Formato de token inválido no header Authorization")
                    response = jsonify({'error': 'Token inválido', 'detail': 'Formato incorreto no header Authorization'})
                    response.headers['Access-Control-Allow-Origin'] = '*'
                    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                    return response, 401
            
            if not token:
                print(f"❌ jwt_required: Token não fornecido na requisição {request.path}")
                response = jsonify({'error': 'Token não fornecido', 'detail': 'Header Authorization ausente ou vazio'})
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                return response, 401
            
            try:
                # Decodificar token
                payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
                
                # Buscar usuário
                user_id = payload.get('user_id')
                if not user_id:
                    print(f"❌ jwt_required: user_id não encontrado no payload do token")
                    response = jsonify({'error': 'Token inválido', 'detail': 'user_id ausente no token'})
                    response.headers['Access-Control-Allow-Origin'] = '*'
                    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                    return response, 401
                
                user = User.query.get(user_id)
                
                if not user:
                    print(f"❌ jwt_required: Usuário {user_id} não encontrado no banco de dados")
                    response = jsonify({'error': 'Usuário não encontrado', 'detail': f'Usuário {user_id} não existe'})
                    response.headers['Access-Control-Allow-Origin'] = '*'
                    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                    return response, 401
                
                # Adicionar usuário ao contexto global
                g.current_user = user
                
                # Verificar role se especificado
                if allowed_roles:
                    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
                    if user_role not in allowed_roles:
                        print(f"❌ jwt_required: Role {user_role} não permitida. Roles permitidas: {allowed_roles}")
                        response = jsonify({'error': 'Permissão negada', 'detail': f'Role {user_role} não tem acesso'})
                        response.headers['Access-Control-Allow-Origin'] = '*'
                        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                        return response, 403
                
                # Verificar permission se especificado
                if permission:
                    if hasattr(user, 'has_permission') and not user.has_permission(permission):
                        print(f"❌ jwt_required: Usuário {user_id} não tem permissão {permission}")
                        response = jsonify({'error': f'Permissão negada: {permission}'})
                        response.headers['Access-Control-Allow-Origin'] = '*'
                        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                        return response, 403
                
            except jwt.ExpiredSignatureError as e:
                print(f"❌ jwt_required: Token expirado para rota {request.path}")
                response = jsonify({'error': 'Token expirado', 'detail': 'O token JWT expirou. Faça login novamente.'})
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                return response, 401
            except jwt.InvalidTokenError as e:
                print(f"❌ jwt_required: Token inválido para rota {request.path}: {str(e)}")
                response = jsonify({'error': 'Token inválido', 'detail': f'Token JWT inválido: {str(e)[:100]}'})
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                return response, 401
            except Exception as e:
                print(f"❌ jwt_required: Erro inesperado na autenticação para rota {request.path}: {str(e)}")
                import traceback
                traceback.print_exc()
                response = jsonify({'error': f'Erro na autenticação', 'detail': str(e)[:200]})
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
                return response, 401
            
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


def payment_required(func):
    """
    Decorator para verificar se a empresa tem pagamento verificado
    Bloqueia acesso se payment_verified = False
    
    IMPORTANTE: Deve ser aplicado ANTES de @jwt_required() na ordem dos decorators
    Mas internamente verifica se o usuário já está autenticado
    
    Uso:
        @payment_required
        @jwt_required()
        def protected_route():
            ...
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Verifica se o usuário já está autenticado (definido por jwt_required)
        if not hasattr(g, 'current_user') or not g.current_user:
            # Se não estiver autenticado, deixa o jwt_required tratar
            # Mas adiciona headers CORS para evitar erro de CORS
            return func(*args, **kwargs)
        
        user = g.current_user
        
        if not user or not user.company_id:
            return jsonify({
                'error': 'Acesso bloqueado',
                'message': 'Usuário sem empresa associada. Entre em contato com o administrador.'
            }), 403
        
        # Buscar empresa
        from models import Company
        company = Company.query.get(user.company_id)
        
        if not company:
            return jsonify({
                'error': 'Acesso bloqueado',
                'message': 'Empresa não encontrada. Entre em contato com o administrador.'
            }), 403
        
        # Verificar pagamento
        if not company.payment_verified:
            response = jsonify({
                'error': 'Acesso bloqueado',
                'message': 'Pagamento não verificado. Entre em contato com o administrador para liberar o acesso.',
                'payment_required': True,
                'company_id': company.id,
                'company_name': company.name
            })
            # Adiciona headers CORS mesmo em erro
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            return response, 403
        
        # Pagamento verificado, permite acesso
        return func(*args, **kwargs)
    
    return wrapper

