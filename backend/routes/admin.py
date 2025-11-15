from flask import Blueprint, request, jsonify, g
from models import db, Plan, Invite, User, Company, UserRole
from auth_utils import jwt_required
from limit_utils import limit_check, update_company_limits, log_usage
import secrets
import datetime
from email_utils import send_invite_email

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# CRUD de Planos
@admin_bp.route('/plans', methods=['GET'])
@jwt_required(allowed_roles=['admin'])
def list_plans():
    plans = Plan.query.all()
    result = []
    for p in plans:
        result.append({
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'max_members': p.max_members,
            'features': p.features,
            'billing_cycle': p.billing_cycle
        })
    return jsonify({'plans': result})

@admin_bp.route('/plans', methods=['POST'])
@jwt_required(allowed_roles=['admin'])
def create_plan():
    data = request.get_json()
    plan = Plan(
        name=data.get('name'),
        price=data.get('price'),
        max_members=data.get('max_members'),
        features=data.get('features'),
        billing_cycle=data.get('billing_cycle', 'monthly')
    )
    db.session.add(plan)
    db.session.commit()
    return jsonify({'message': 'Plano criado com sucesso', 'id': plan.id}), 201

# CRUD de Convites
@admin_bp.route('/invites', methods=['POST'])
@jwt_required(allowed_roles=['admin'])
@limit_check('invite_user', 'user')
def create_invite():
    from flask import g
    try:
        current_user = g.current_user
        print(f"[DEBUG] Criar convite - Usuário: ID={current_user.id}, Role={current_user.role.value if hasattr(current_user.role, 'value') else current_user.role}, Company={current_user.company_id}")
        
        data = request.get_json()
        email = data.get('email')
        role = data.get('role')
        company_id = current_user.company_id  # Usa a empresa do usuário logado
        invited_by = current_user.id
        
        if not company_id:
            print(f"[DEBUG] Usuário {current_user.id} não tem company_id")
            return jsonify({'error': 'Usuário sem empresa associada'}), 403
        
        # Gera token único
        token = secrets.token_urlsafe(16)
        invite = Invite(
            email=email,
            company_id=company_id,
            role=UserRole(role),
            invited_by=invited_by,
            status='pending',
            sent_at=datetime.datetime.utcnow().isoformat(),
            token=token
        )
        db.session.add(invite)
        db.session.commit()
        
        # Envia e-mail
        email_ok = send_invite_email(email, token)
        if not email_ok:
            return jsonify({'error': 'Erro ao enviar e-mail de convite'}), 500
        
        # Loga o uso
        log_usage(company_id, current_user.id, 'invite_user', 'user', invite.id, {'email': email, 'role': role})
        
        return jsonify({'message': 'Convite criado e e-mail enviado', 'id': invite.id}), 201
    except Exception as e:
        import traceback
        print(f"[ERRO] Erro ao criar convite: {e}")
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': f'Erro ao criar convite: {str(e)}'}), 500

@admin_bp.route('/invites', methods=['GET'])
@jwt_required(allowed_roles=['admin'])
def list_invites():
    invites = Invite.query.all()
    result = []
    for i in invites:
        result.append({
            'id': i.id,
            'email': i.email,
            'role': i.role.value,
            'company_id': i.company_id,
            'status': i.status,
            'sent_at': i.sent_at
        })
    return jsonify({'invites': result})

# Gestão de membros
@admin_bp.route('/members', methods=['GET'])
@jwt_required(allowed_roles=['admin'])
def list_members():
    company_id = request.args.get('company_id')
    users = User.query.filter_by(company_id=company_id).all()
    result = []
    for u in users:
        result.append({
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'role': u.role.value,
            'status': u.status
        })
    return jsonify({'members': result})

@admin_bp.route('/members/<int:user_id>', methods=['PATCH'])
@jwt_required(allowed_roles=['admin'])
def update_member_role(user_id):
    data = request.get_json()
    new_role = data.get('role')
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    user.role = UserRole(new_role)
    db.session.commit()
    return jsonify({'message': 'Papel atualizado com sucesso'})

@admin_bp.route('/members/<int:user_id>', methods=['DELETE'])
@jwt_required(allowed_roles=['admin'])
def delete_member(user_id):
    from flask import g
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Verifica se o usuário pertence à mesma empresa
    if user.company_id != g.current_user.company_id:
        return jsonify({'error': 'Usuário não pertence à sua empresa'}), 403
    
    company_id = user.company_id
    db.session.delete(user)
    db.session.commit()
    
    # Atualiza limites e loga uso
    update_company_limits(company_id, 'remove_user', 'user', user_id, increment=False)
    log_usage(company_id, g.current_user.id, 'remove_user', 'user', user_id, {'deleted_user_email': user.email})
    
    return jsonify({'message': 'Usuário removido com sucesso'})

# Verificar/Desverificar pagamento da empresa
@admin_bp.route('/payment/verify', methods=['POST'])
@jwt_required(allowed_roles=['admin'])
def verify_payment():
    """Verifica pagamento de uma empresa (libera acesso)"""
    try:
        data = request.get_json()
        company_id = data.get('company_id')
        verified = data.get('verified', True)
        
        if not company_id:
            return jsonify({'error': 'company_id é obrigatório'}), 400
        
        # Verifica se a empresa pertence ao mesmo admin
        current_user = g.current_user
        company = Company.query.get(company_id)
        
        if not company:
            return jsonify({'error': 'Empresa não encontrada'}), 404
        
        # Apenas admins da mesma empresa podem verificar pagamento
        if company.id != current_user.company_id:
            return jsonify({'error': 'Você não tem permissão para verificar pagamento desta empresa'}), 403
        
        # Atualiza status de pagamento
        company.payment_verified = verified
        db.session.commit()
        
        return jsonify({
            'message': f'Pagamento {"verificado" if verified else "desverificado"} com sucesso',
            'company_id': company.id,
            'company_name': company.name,
            'payment_verified': company.payment_verified
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao verificar pagamento: {str(e)}'}), 500

@admin_bp.route('/payment/status', methods=['GET'])
@jwt_required()
def get_payment_status():
    """Retorna status de pagamento da empresa do usuário"""
    try:
        current_user = g.current_user
        if not current_user or not current_user.company_id:
            return jsonify({'error': 'Usuário sem empresa associada'}), 400
        
        company = Company.query.get(current_user.company_id)
        if not company:
            return jsonify({'error': 'Empresa não encontrada'}), 404
        
        return jsonify({
            'payment_verified': company.payment_verified,
            'company_id': company.id,
            'company_name': company.name,
            'status': company.status
        })
    except Exception as e:
        return jsonify({'error': f'Erro ao verificar status: {str(e)}'}), 500
