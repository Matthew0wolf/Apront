from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Company, UserRole, Invite, VerificationToken, TeamMember
from email_utils import send_verification_token_email
from rate_limiter import rate_limit
from security_logger import log_login_success, log_login_failure, log_security_event
import jwt
import datetime
import random
import string

SECRET_KEY = 'sua_chave_super_secreta'  # Troque por uma chave segura em produção

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Aceitar convite e cadastrar usuário
@auth_bp.route('/accept-invite', methods=['POST'])
def accept_invite():
    data = request.get_json()
    token = data.get('token')
    name = data.get('name')
    password = data.get('password')
    
    print(f"DEBUG: Accept invite - Token: {token}, Name: {name}")
    
    if not all([token, name, password]):
        return jsonify({'error': 'Dados obrigatórios faltando'}), 400
    
    invite = Invite.query.filter_by(token=token, status='pending').first()
    if not invite:
        print(f"DEBUG: Convite não encontrado para token: {token}")
        return jsonify({'error': 'Convite inválido ou já utilizado'}), 400
    
    print(f"DEBUG: Convite encontrado - Email: {invite.email}, Company ID: {invite.company_id}")
    
    if User.query.filter_by(email=invite.email).first():
        return jsonify({'error': 'Usuário já cadastrado com este e-mail'}), 400
    
    user = User(
        name=name,
        email=invite.email,
        password_hash=generate_password_hash(password),
        role=invite.role,
        company_id=invite.company_id,
        joined_at=datetime.datetime.utcnow().isoformat()
    )
    db.session.add(user)
    db.session.flush()  # Para obter o ID do usuário
    
    # Cria registro na tabela team_members
    team_member = TeamMember(
        name=name,
        email=invite.email,
        role=invite.role.value,
        status='active',
        joined_at=datetime.datetime.utcnow().isoformat(),
        last_active='Agora',
        avatar=name[0:2].upper()  # Iniciais do nome
    )
    db.session.add(team_member)
    
    invite.status = 'accepted'
    db.session.commit()
    
    print(f"DEBUG: Usuário criado - Name: {user.name}, Company ID: {user.company_id}")
    print(f"DEBUG: TeamMember criado - Name: {team_member.name}, Role: {team_member.role}")
    
    return jsonify({'message': 'Usuário cadastrado com sucesso'})

# Iniciar processo de registro (envia token de verificação)
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    company_name = data.get('company')
    if not all([name, email, password, company_name]):
        return jsonify({'error': 'Dados obrigatórios faltando'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email já cadastrado'}), 400
    
    # Gera token de verificação de 6 dígitos
    verification_token = ''.join(random.choices(string.digits, k=6))
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    
    # Remove tokens antigos para este email
    VerificationToken.query.filter_by(email=email).delete()
    
    # Cria novo token de verificação
    token_record = VerificationToken(
        email=email,
        token=verification_token,
        expires_at=expires_at.isoformat(),
        created_at=datetime.datetime.utcnow().isoformat()
    )
    db.session.add(token_record)
    
    db.session.commit()
    
    # Envia email com o token
    email_sent = send_verification_token_email(email, verification_token, name)
    
    if email_sent:
        return jsonify({
            'message': 'Token de verificação enviado para seu email',
            'email': email
        })
    else:
        # Se falhar o envio, retorna o token para debug
        return jsonify({
            'message': 'Erro ao enviar email. Use o token abaixo para continuar:',
            'token': verification_token,
            'email': email,
            'debug': True
        })

# Verificar token e completar cadastro
@auth_bp.route('/verify-token', methods=['POST'])
def verify_token():
    data = request.get_json()
    email = data.get('email')
    token = data.get('token')
    name = data.get('name')
    password = data.get('password')
    company_name = data.get('company')
    
    if not all([email, token, name, password, company_name]):
        return jsonify({'error': 'Dados obrigatórios faltando'}), 400
    
    # Verifica token
    token_record = VerificationToken.query.filter_by(
        email=email, 
        token=token, 
        used=False
    ).first()
    
    if not token_record:
        return jsonify({'error': 'Token inválido'}), 400
    
    # Verifica se token não expirou
    if datetime.datetime.utcnow() > datetime.datetime.fromisoformat(token_record.expires_at):
        return jsonify({'error': 'Token expirado'}), 400
    
    # Marca token como usado
    token_record.used = True
    
    # Cria empresa
    company = Company(name=company_name, created_at=datetime.datetime.utcnow().isoformat())
    db.session.add(company)
    db.session.commit()
    
    # Cria usuário admin
    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=UserRole.admin,
        company_id=company.id,
        joined_at=datetime.datetime.utcnow().isoformat()
    )
    db.session.add(user)
    db.session.flush()  # Para obter o ID do usuário
    
    # Cria registro na tabela team_members para o admin
    team_member = TeamMember(
        name=name,
        email=email,
        role=UserRole.admin.value,
        status='active',
        joined_at=datetime.datetime.utcnow().isoformat(),
        last_active='Agora',
        avatar=name[0:2].upper()  # Iniciais do nome
    )
    db.session.add(team_member)
    db.session.commit()
    
    return jsonify({'message': 'Usuário e empresa criados com sucesso'})

# Login
@auth_bp.route('/login', methods=['POST'])
@rate_limit('auth')  # Limite de 5 tentativas por minuto
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Validação básica
    if not email or not password:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        # Log de falha
        log_login_failure(email, 'Invalid credentials')
        return jsonify({'error': 'Credenciais inválidas'}), 401
    
    # Log de sucesso
    log_login_success(user.id, email)
    
    payload = {
        'user_id': user.id,
        'company_id': user.company_id,
        'role': user.role.value,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'token': token, 
        'user': {
            'id': user.id, 
            'name': user.name, 
            'email': user.email, 
            'role': user.role.value, 
            'avatar': user.avatar,
            'can_operate': user.can_operate,
            'can_present': user.can_present
        }
    })

# Refresh token
@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Token não fornecido'}), 400
    
    try:
        # Decodifica o token (mesmo que expirado)
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'], options={'verify_exp': False})
        user_id = payload.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Busca o usuário
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 401
        
        # Gera novo token
        new_payload = {
            'user_id': user.id,
            'company_id': user.company_id,
            'role': user.role.value,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
        }
        new_token = jwt.encode(new_payload, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'token': new_token, 
            'user': {
                'id': user.id, 
                'name': user.name, 
                'email': user.email, 
                'role': user.role.value, 
                'avatar': user.avatar
            }
        })
        
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token inválido'}), 401
    except Exception as e:
        return jsonify({'error': 'Erro interno'}), 500