
from flask import Blueprint, request, jsonify, g
from models import db, TeamMember, User
from auth_utils import jwt_required

team_bp = Blueprint('team', __name__, url_prefix='/api/team')

@team_bp.route('', methods=['GET'])
@jwt_required()
def get_team():
    # Busca usuários da mesma empresa do usuário logado
    company_id = g.current_user.company_id
    
    # Se não tem company_id, retorna apenas o usuário atual
    if not company_id:
        return {'team': [{
            'id': str(g.current_user.id),
            'name': g.current_user.name,
            'email': g.current_user.email,
            'role': g.current_user.role.value,
            'status': 'active',
            'joinedAt': g.current_user.joined_at or '2024-01-01',
            'lastActive': 'Agora',
            'avatar': g.current_user.avatar
        }]}
    
    users = User.query.filter_by(company_id=company_id).all()
    
    result = []
    for user in users:
        result.append({
            'id': str(user.id),
            'name': user.name,
            'email': user.email,
            'role': user.role.value,
            'can_operate': user.can_operate,
            'can_present': user.can_present,
            'status': 'active',  # Usuários logados são sempre ativos
            'joinedAt': user.joined_at or '2024-01-01',
            'lastActive': 'Agora',  # Simplificado para demonstração
            'avatar': user.avatar  # Avatar real do usuário
        })
    return {'team': result}

@team_bp.route('/<int:member_id>', methods=['PATCH'])
@jwt_required(allowed_roles=['admin'])
def update_team_member_permissions(member_id):
    data = request.get_json()
    
    # Impede que admin altere seu próprio role
    if member_id == g.current_user.id:
        return jsonify({'error': 'Não é possível alterar suas próprias permissões'}), 403
    
    # Busca o usuário na mesma empresa
    company_id = g.current_user.company_id
    
    if not company_id:
        return jsonify({'error': 'Não é possível atualizar usuários sem empresa'}), 403
    
    user = User.query.filter_by(id=member_id, company_id=company_id).first()
    
    if not user:
        return jsonify({'error': 'Membro não encontrado'}), 404
    
    # Atualiza permissões modulares
    if 'can_operate' in data:
        user.can_operate = bool(data['can_operate'])
    
    if 'can_present' in data:
        user.can_present = bool(data['can_present'])
    
    # Atualiza role se fornecido (mas não permite alterar para admin)
    if 'role' in data:
        new_role = data['role']
        if new_role not in ['operator', 'presenter']:
            return jsonify({'error': 'Role inválida. Apenas operator e presenter são permitidos'}), 400
        
        from models import UserRole
        user.role = UserRole(new_role)
    
    db.session.commit()
    
    # Emite evento WebSocket para notificar outros clientes sobre a mudança
    try:
        from websocket_server import socketio
        socketio.emit('permissions_updated', {
            'user_id': user.id,
            'permissions': {
                'can_operate': user.can_operate,
                'can_present': user.can_present,
                'role': user.role.value
            }
        }, room=f'company_{company_id}')
        print(f'[WEBSOCKET] Permissões atualizadas para usuário {user.name} (ID: {user.id})')
    except Exception as e:
        print(f'[WEBSOCKET] Erro ao emitir evento: {e}')
    
    return jsonify({
        'message': 'Permissões atualizadas com sucesso',
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role.value,
            'can_operate': user.can_operate,
            'can_present': user.can_present,
            'avatar': user.avatar
        }
    })

@team_bp.route('/<int:member_id>', methods=['DELETE'])
@jwt_required(allowed_roles=['admin'])
def delete_team_member(member_id):
    # Busca o usuário na mesma empresa
    company_id = g.current_user.company_id
    
    # Se não tem company_id, não permite deletar
    if not company_id:
        return jsonify({'error': 'Não é possível remover membros sem empresa'}), 403
    
    user = User.query.filter_by(id=member_id, company_id=company_id).first()
    
    if not user:
        return jsonify({'error': 'Membro não encontrado'}), 404
    
    # Não permite deletar o próprio usuário
    if user.id == g.current_user.id:
        return jsonify({'error': 'Não é possível remover a si mesmo'}), 400
    
    # Remove o usuário
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'Membro removido com sucesso'})
