from flask import Blueprint, jsonify, request
from models import db, Rundown, RundownMember, Folder
from flask import g
from auth_utils import jwt_required
from limit_utils import limit_check, update_company_limits, log_usage
from websocket_server import broadcast_rundown_update, broadcast_rundown_list_changed
from sqlalchemy.orm import joinedload
from cache_utils import cached, invalidate_rundown_cache, get_cache, set_cache

rundown_bp = Blueprint('rundown', __name__, url_prefix='/api/rundowns')

@rundown_bp.route('', methods=['GET'])
@jwt_required()
def get_rundowns():
    # Admin vê todos; demais apenas atribuídos
    user = getattr(g, 'current_user', None)
    
    # Tentar obter do cache (se usuário específico)
    if user:
        cache_key = f"rundowns:user:{user.id}"
        cached_data = get_cache(cache_key)
        if cached_data:
            return {'rundowns': cached_data}
    
    # Query simplificada (sem eager loading por enquanto)
    if user and hasattr(user.role, 'value') and user.role.value != 'admin':
        assigned_ids = [rm.rundown_id for rm in RundownMember.query.filter_by(user_id=user.id).all()]
        if assigned_ids:
            rundowns = Rundown.query.filter(Rundown.id.in_(assigned_ids)).all()
        else:
            rundowns = []
    else:
        rundowns = Rundown.query.all()
    
    result = []
    for r in rundowns:
        folders = []
        for f in r.folders:
            items = []
            for i in f.items:
                items.append({
                    'id': str(i.id),
                    'title': i.title,
                    'duration': i.duration,
                    'description': i.description,
                    'type': i.type,
                    'status': i.status,
                    'iconType': i.icon_type,
                    'iconData': i.icon_data,
                    'color': i.color,
                    'urgency': i.urgency,
                    'reminder': i.reminder
                })
            folders.append({
                'id': str(f.id),
                'title': f.title,
                'type': 'folder',
                'children': items
            })
        result.append({
            'id': str(r.id),
            'name': r.name,
            'type': r.type,
            'created': r.created,
            'lastModified': r.last_modified,
            'status': r.status,
            'duration': r.duration,
            'teamMembers': r.team_members,
            'items': folders
        })
    
    # Cachear resultado (5 minutos)
    if user:
        set_cache(f"rundowns:user:{user.id}", result, ttl=300)
    
    return {'rundowns': result}


# Criar novo projeto
@rundown_bp.route('', methods=['POST'])
@jwt_required()
@limit_check('create_rundown', 'rundown')
def create_rundown():
    from flask import g
    import datetime
    
    data = request.get_json()
    name = data.get('name')
    type_ = data.get('type')
    created = data.get('created') or datetime.datetime.utcnow().isoformat()
    last_modified = data.get('lastModified') or datetime.datetime.utcnow().isoformat()
    status = data.get('status', 'Novo')
    duration = data.get('duration', '0')
    team_members = data.get('teamMembers', 1)
    
    rundown = Rundown(
        name=name,
        type=type_,
        created=created,
        last_modified=last_modified,
        status=status,
        duration=duration,
        team_members=team_members
    )
    db.session.add(rundown)
    db.session.flush()
    
    # Atribui membros: sempre inclui o criador
    creator_id = g.current_user.id
    db.session.add(RundownMember(rundown_id=rundown.id, user_id=creator_id, role='owner'))
    
    members = data.get('members', [])  # lista de user_ids
    for uid in members:
        if uid != creator_id:
            db.session.add(RundownMember(rundown_id=rundown.id, user_id=uid))
    
    db.session.commit()
    
    # Loga o uso
    log_usage(g.current_user.company_id, g.current_user.id, 'create_rundown', 'rundown', rundown.id, {'name': rundown.name})
    
    try:
        broadcast_rundown_list_changed()
    except Exception:
        pass
    return jsonify({'message': 'Rundown criado com sucesso', 'id': rundown.id}), 201


# Editar projeto existente
@rundown_bp.route('/<int:rundown_id>', methods=['PATCH'])
def update_rundown(rundown_id):
    rundown = Rundown.query.get(rundown_id)
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado'}), 404
    data = request.get_json()
    
    # Armazena as mudanças para notificar via WebSocket
    changes = {}
    for field in ['name', 'type', 'created', 'lastModified', 'status', 'duration', 'teamMembers']:
        if field in data:
            old_value = getattr(rundown, field if field != 'lastModified' else 'last_modified')
            setattr(rundown, field if field != 'lastModified' else 'last_modified', data[field])
            changes[field] = {
                'old': old_value,
                'new': data[field]
            }
    
    db.session.commit()
    
    # Invalidar cache do rundown
    invalidate_rundown_cache(rundown_id)
    
    # Notifica todos os clientes conectados sobre as mudanças via WebSocket
    if changes:
        broadcast_rundown_update(rundown_id, changes)
    
    return jsonify({'message': 'Rundown atualizado com sucesso'})


# Atualizar status do rundown (especialmente para mudanças para "ao vivo")
@rundown_bp.route('/<int:rundown_id>/status', methods=['PATCH'])
@jwt_required()
def update_rundown_status(rundown_id):
    rundown = Rundown.query.get(rundown_id)
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado'}), 404
    
    data = request.get_json()
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({'error': 'Status é obrigatório'}), 400
    
    # Armazena o status anterior para notificação
    old_status = rundown.status
    # Normaliza para 'Ao Vivo' quando correspondente
    rundown.status = 'Ao Vivo' if new_status.lower() in ['ao vivo', 'aovivo', 'live', 'active'] else new_status
    rundown.last_modified = data.get('lastModified', rundown.last_modified)
    
    db.session.commit()
    
    # Notifica todos os clientes conectados sobre a mudança de status via WebSocket
    changes = {
        'status': {
            'old': old_status,
            'new': new_status
        }
    }
    broadcast_rundown_update(rundown_id, changes)
    
    return jsonify({
        'message': 'Status atualizado com sucesso',
        'old_status': old_status,
        'new_status': new_status
    })

# Deletar projeto
@rundown_bp.route('/<int:rundown_id>', methods=['DELETE'])
def delete_rundown(rundown_id):
    rundown = Rundown.query.get(rundown_id)
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado'}), 404
    db.session.delete(rundown)
    db.session.commit()
    try:
        broadcast_rundown_list_changed()
    except Exception:
        pass
    return jsonify({'message': 'Rundown deletado com sucesso'})


# Atualizar membros do rundown
@rundown_bp.route('/<int:rundown_id>/members', methods=['PATCH'])
@jwt_required()
def update_rundown_members(rundown_id):
    user = g.current_user
    rundown = Rundown.query.get(rundown_id)
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado'}), 404

    data = request.get_json() or {}
    members = data.get('members', [])
    if not isinstance(members, list):
        return jsonify({'error': 'Formato inválido de members'}), 400

    # Admin pode sempre; não-admin só se já for membro
    if user.role.value != 'admin':
        is_member = RundownMember.query.filter_by(rundown_id=rundown_id, user_id=user.id).first() is not None
        if not is_member:
            return jsonify({'error': 'Permissão insuficiente'}), 403

    # Remove membros atuais e recria lista (mantém criador/owner se existir)
    existing = RundownMember.query.filter_by(rundown_id=rundown_id).all()
    owner_ids = {rm.user_id for rm in existing if (rm.role or '').lower() == 'owner'}

    # Apaga todos
    RundownMember.query.filter_by(rundown_id=rundown_id).delete()
    db.session.flush()

    # Reinsere owner(s)
    for oid in owner_ids:
        db.session.add(RundownMember(rundown_id=rundown_id, user_id=oid, role='owner'))

    # Adiciona novos membros (evita duplicar owners)
    for uid in members:
        if uid not in owner_ids:
            db.session.add(RundownMember(rundown_id=rundown_id, user_id=uid))

    db.session.commit()

    try:
        broadcast_rundown_list_changed()
    except Exception:
        pass

    return jsonify({'message': 'Equipe atualizada com sucesso'})
