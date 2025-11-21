from flask import Blueprint, jsonify, request
from models import db, Rundown, RundownMember, Folder
from flask import g
from auth_utils import jwt_required, payment_required
from limit_utils import limit_check, update_company_limits, log_usage
from websocket_server import broadcast_rundown_update, broadcast_rundown_list_changed
from sqlalchemy.orm import joinedload
from cache_utils import cached, invalidate_rundown_cache, get_cache, set_cache, delete_cache, invalidate_company_cache

rundown_bp = Blueprint('rundown', __name__, url_prefix='/api/rundowns')

@rundown_bp.route('', methods=['GET'])
@jwt_required()
@payment_required
def get_rundowns():
    # CRÍTICO: Sempre filtrar por company_id para isolamento de dados
    user = getattr(g, 'current_user', None)
    
    if not user or not user.company_id:
        return jsonify({'error': 'Usuário sem empresa associada'}), 403
    
    # Tentar obter do cache (se usuário específico)
    # NOTA: Cache pode estar desatualizado após criar/importar rundowns
    # Por isso, sempre verificamos se há parâmetro ?force_refresh=true para ignorar cache
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
    
    if user and not force_refresh:
        cache_key = f"rundowns:user:{user.id}:company:{user.company_id}"
        cached_data = get_cache(cache_key)
        if cached_data:
            print(f"[CACHE] Retornando {len(cached_data)} rundowns do cache para usuário {user.id}")
            return {'rundowns': cached_data}
    
    # SEMPRE filtrar por company_id primeiro (segurança crítica)
    base_query = Rundown.query.filter_by(company_id=user.company_id)
    
    # CRÍTICO: Filtrar apenas rundowns onde o usuário é membro
    # Isso garante que apenas usuários com acesso vejam os rundowns
    member_rundown_ids = [rm.rundown_id for rm in RundownMember.query.filter_by(user_id=user.id).all()]
    if member_rundown_ids:
        rundowns = base_query.filter(Rundown.id.in_(member_rundown_ids)).all()
    else:
        # Se não for membro de nenhum rundown, retorna lista vazia
        rundowns = []
    
    result = []
    for r in rundowns:
        folders = []
        # Ordenar folders por ordem
        sorted_folders = sorted(r.folders, key=lambda f: f.ordem or 0)
        for f in sorted_folders:
            items = []
            # Ordenar items por ordem
            sorted_items = sorted(f.items, key=lambda i: i.ordem or 0)
            for i in sorted_items:
                items.append({
                    'id': str(i.id),
                    'title': i.title,
                    'duration': i.duration,
                    'description': i.description or '',
                    'type': i.type,
                    'status': i.status,
                    'iconType': i.icon_type,
                    'iconData': i.icon_data,
                    'color': i.color,
                    'urgency': i.urgency,
                    'reminder': i.reminder or ''
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
        set_cache(f"rundowns:user:{user.id}:company:{user.company_id}", result, ttl=300)
    
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
    
    # CRÍTICO: Sempre associar rundown à empresa do usuário
    rundown = Rundown(
        name=name,
        type=type_,
        created=created,
        last_modified=last_modified,
        status=status,
        duration=duration,
        team_members=team_members,
        company_id=g.current_user.company_id  # Isolamento por empresa
    )
    db.session.add(rundown)
    db.session.flush()
    
    # Atribui membros: sempre inclui o criador como owner
    creator_id = g.current_user.id
    db.session.add(RundownMember(rundown_id=rundown.id, user_id=creator_id, role='owner'))
    
    # Se membros foram especificados, adiciona apenas eles
    # IMPORTANTE: Se nenhum membro for especificado, apenas o criador terá acesso
    members = data.get('members', [])  # lista de user_ids
    
    if members and len(members) > 0:
        # Adiciona apenas os membros especificados (além do criador que já foi adicionado)
        for uid in members:
            if uid != creator_id:
                db.session.add(RundownMember(rundown_id=rundown.id, user_id=uid, role='member'))
                print(f"[CREATE] Membro {uid} adicionado ao rundown {rundown.id}")
    else:
        # Se nenhum membro foi especificado, apenas o criador terá acesso
        print(f"[CREATE] Nenhum membro especificado - apenas criador {creator_id} terá acesso ao rundown {rundown.id}")
    
    db.session.commit()
    
    # Loga o uso
    log_usage(g.current_user.company_id, g.current_user.id, 'create_rundown', 'rundown', rundown.id, {'name': rundown.name})
    
    # CRÍTICO: Invalidar cache de TODOS os usuários da empresa
    # Isso garante que todos vejam o novo rundown imediatamente
    invalidate_company_cache(g.current_user.company_id)
    
    try:
        broadcast_rundown_list_changed(company_id=g.current_user.company_id)
    except Exception:
        pass
    return jsonify({'message': 'Rundown criado com sucesso', 'id': rundown.id}), 201


# Editar projeto existente
@rundown_bp.route('/<int:rundown_id>', methods=['PATCH'])
@jwt_required(allowed_roles=['admin', 'operator'])
def update_rundown(rundown_id):
    from models import Folder, Item
    import datetime
    
    user = g.current_user
    # CRÍTICO: Verificar se rundown pertence à mesma empresa
    rundown = Rundown.query.filter_by(id=rundown_id, company_id=user.company_id).first()
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
    
    # Bloquear edição se rundown estiver "Ao Vivo"
    if rundown.status and rundown.status.lower() in ['ao vivo', 'aovivo', 'live', 'active']:
        return jsonify({'error': 'Não é possível editar um rundown que está ao vivo'}), 403
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
    
    # Salvar pastas e itens se fornecidos
    if 'items' in data:
        items_data = data['items']
        
        # Remove todas as pastas e itens existentes (cascade vai remover os itens automaticamente)
        Folder.query.filter_by(rundown_id=rundown_id).delete()
        
        # Cria novas pastas e itens
        for folder_index, folder_data in enumerate(items_data):
            # Ignorar se não for uma pasta válida
            if not folder_data or folder_data.get('type') != 'folder':
                continue
                
            new_folder = Folder(
                title=folder_data.get('title', f'Pasta {folder_index + 1}'),
                ordem=folder_index + 1,
                rundown_id=rundown_id
            )
            db.session.add(new_folder)
            db.session.flush()  # Para obter o ID da pasta
            
            # Adiciona itens da pasta
            children = folder_data.get('children', [])
            for item_index, item_data in enumerate(children):
                # Ignorar se não for um item válido
                if not item_data or item_data.get('type') == 'folder':
                    continue
                    
                new_item = Item(
                    title=item_data.get('title', f'Evento {item_index + 1}'),
                    duration=int(item_data.get('duration', 60) or 60),
                    description=item_data.get('description', ''),
                    type=item_data.get('type', 'generic'),
                    status=item_data.get('status', 'pending'),
                    icon_type=item_data.get('iconType', 'lucide'),
                    icon_data=item_data.get('iconData', 'HelpCircle'),
                    color=item_data.get('color', '#808080'),
                    urgency=item_data.get('urgency', 'normal'),
                    reminder=item_data.get('reminder', ''),
                    ordem=item_index + 1,
                    folder_id=new_folder.id,
                    script=item_data.get('script'),
                    talking_points=item_data.get('talking_points'),
                    pronunciation_guide=item_data.get('pronunciation_guide'),
                    presenter_notes=item_data.get('presenter_notes')
                )
                db.session.add(new_item)
        
        # Não incluir items no changes para WebSocket - o frontend já sincroniza quando adiciona
        # Remover items do changes para evitar conflito (frontend já tem os items atualizados)
        if 'items' in changes:
            del changes['items']
        print(f"[UPDATE] Pastas e itens salvos para rundown {rundown_id}")
    
    # Atualiza last_modified
    rundown.last_modified = datetime.datetime.utcnow().isoformat()
    
    db.session.commit()
    
    # Invalidar cache do rundown E da lista de rundowns da empresa
    invalidate_rundown_cache(rundown_id)
    invalidate_company_cache(user.company_id)  # Invalida cache da lista de rundowns
    
    # Notifica todos os clientes conectados sobre as mudanças via WebSocket
    if changes:
        broadcast_rundown_update(rundown_id, changes)
    
    return jsonify({'message': 'Rundown atualizado com sucesso'})


# Atualizar status do rundown (especialmente para mudanças para "ao vivo")
@rundown_bp.route('/<int:rundown_id>/status', methods=['PATCH'])
@jwt_required()
def update_rundown_status(rundown_id):
    user = g.current_user
    
    # Verificar pagamento da empresa
    if user.company_id:
        from models import Company
        company = Company.query.get(user.company_id)
        if company and not company.payment_verified:
            response = jsonify({
                'error': 'Acesso bloqueado',
                'message': 'Pagamento não verificado. Entre em contato com o administrador para liberar o acesso.',
                'payment_required': True
            })
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            return response, 403
    
    # CRÍTICO: Verificar se rundown pertence à mesma empresa
    rundown = Rundown.query.filter_by(id=rundown_id, company_id=user.company_id).first()
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
    
    try:
        data = request.get_json() or {}
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status é obrigatório'}), 400
    except Exception as e:
        print(f"ERRO ao processar request JSON: {e}")
        return jsonify({'error': 'Erro ao processar dados da requisição'}), 400
    
    try:
        # Armazena o status anterior para notificação
        old_status = rundown.status
        # Normaliza para 'Ao Vivo' quando correspondente
        rundown.status = 'Ao Vivo' if new_status.lower() in ['ao vivo', 'aovivo', 'live', 'active'] else new_status
        # Atualiza last_modified se fornecido, senão usa data atual
        if data.get('lastModified'):
            # Aceita tanto formato ISO quanto formato curto
            last_modified = data.get('lastModified')
            # Se for formato ISO, extrai apenas a data (YYYY-MM-DD)
            if 'T' in last_modified:
                rundown.last_modified = last_modified.split('T')[0]
            else:
                rundown.last_modified = last_modified
        else:
            from datetime import datetime
            rundown.last_modified = datetime.utcnow().strftime('%Y-%m-%d')
        
        db.session.commit()
        
        # Notifica todos os clientes conectados sobre a mudança de status via WebSocket
        try:
            changes = {
                'status': {
                    'old': old_status,
                    'new': new_status
                }
            }
            broadcast_rundown_update(rundown_id, changes)
        except Exception as ws_error:
            print(f"AVISO: Erro ao enviar WebSocket: {ws_error}")
        
        return jsonify({
            'message': 'Status atualizado com sucesso',
            'old_status': old_status,
            'new_status': new_status
        })
    except Exception as e:
        db.session.rollback()
        print(f"ERRO ao atualizar status: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erro ao atualizar status: {str(e)}'}), 500

# Deletar projeto
@rundown_bp.route('/<int:rundown_id>', methods=['DELETE'])
@jwt_required(allowed_roles=['admin', 'operator'])
def delete_rundown(rundown_id):
    user = g.current_user
    print(f"[DELETE] Tentando deletar rundown {rundown_id}")
    print(f"[DELETE] Usuário: {user.id}, Empresa: {user.company_id}")
    
    # CRÍTICO: Verificar se rundown pertence à mesma empresa
    rundown = Rundown.query.filter_by(id=rundown_id, company_id=user.company_id).first()
    
    if not rundown:
        # Verifica se o rundown existe em outra empresa (para debug)
        other_rundown = Rundown.query.filter_by(id=rundown_id).first()
        if other_rundown:
            print(f"[DELETE] Rundown {rundown_id} existe mas pertence à empresa {other_rundown.company_id} (usuário está na empresa {user.company_id})")
        else:
            print(f"[DELETE] Rundown {rundown_id} não existe no banco de dados")
        return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
    
    print(f"[DELETE] Rundown encontrado: {rundown.name} (ID: {rundown.id}, Empresa: {rundown.company_id})")
    
    # Bloquear deleção se rundown estiver "Ao Vivo"
    if rundown.status and rundown.status.lower() in ['ao vivo', 'aovivo', 'live', 'active']:
        return jsonify({'error': 'Não é possível deletar um rundown que está ao vivo'}), 403
    
    try:
        # Deletar membros do rundown primeiro (cascade deve fazer isso, mas garantimos)
        from models import RundownMember
        RundownMember.query.filter_by(rundown_id=rundown_id).delete()
        
        # Deletar o rundown (cascade deleta folders e items automaticamente)
        db.session.delete(rundown)
        db.session.commit()
        
        # CRÍTICO: Invalidar cache da lista de rundowns para TODOS os usuários da empresa
        # Isso garante que todos vejam a lista atualizada (operador, apresentador, etc.)
        invalidate_company_cache(user.company_id)
        # Também invalida cache genérico do rundown
        invalidate_rundown_cache(rundown_id)
        
        # Notificar via WebSocket para todos os usuários da empresa
        try:
            broadcast_rundown_list_changed(company_id=user.company_id)
        except Exception:
            pass  # Não falha se WebSocket não funcionar
        
        return jsonify({'message': 'Rundown deletado com sucesso'})
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao deletar rundown: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erro ao deletar rundown: {str(e)}'}), 500


# Obter membros do rundown
@rundown_bp.route('/<int:rundown_id>/members', methods=['GET'])
@jwt_required()
def get_rundown_members(rundown_id):
    user = g.current_user
    # CRÍTICO: Verificar se rundown pertence à mesma empresa
    rundown = Rundown.query.filter_by(id=rundown_id, company_id=user.company_id).first()
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
    
    # Verificar se usuário é membro ou admin
    if user.role.value != 'admin':
        is_member = RundownMember.query.filter_by(rundown_id=rundown_id, user_id=user.id).first() is not None
        if not is_member:
            return jsonify({'error': 'Permissão insuficiente'}), 403
    
    # Obter todos os membros do rundown
    members = RundownMember.query.filter_by(rundown_id=rundown_id).all()
    from models import User
    result = []
    for m in members:
        member_user = User.query.get(m.user_id)
        if member_user:
            result.append({
                'id': member_user.id,
                'name': member_user.name,
                'email': member_user.email,
                'role': member_user.role.value,
                'rundown_role': m.role or 'member'
            })
    
    return jsonify({'members': result})

# Atualizar membros do rundown
@rundown_bp.route('/<int:rundown_id>/members', methods=['PATCH'])
@jwt_required(allowed_roles=['admin', 'operator'])
def update_rundown_members(rundown_id):
    user = g.current_user
    # CRÍTICO: Verificar se rundown pertence à mesma empresa
    rundown = Rundown.query.filter_by(id=rundown_id, company_id=user.company_id).first()
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404

    # Bloquear alteração de membros se rundown estiver "Ao Vivo"
    if rundown.status and rundown.status.lower() in ['ao vivo', 'aovivo', 'live', 'active']:
        return jsonify({'error': 'Não é possível alterar membros de um rundown que está ao vivo'}), 403

    data = request.get_json() or {}
    members = data.get('members', [])
    if not isinstance(members, list):
        return jsonify({'error': 'Formato inválido de members'}), 400

    # Remove membros atuais e recria lista (mantém criador/owner se existir)
    existing = RundownMember.query.filter_by(rundown_id=rundown_id).all()
    owner_ids = {rm.user_id for rm in existing if (rm.role or '').lower() == 'owner'}
    
    # Se não houver owner, o criador do rundown é o owner padrão
    if not owner_ids:
        # Tenta encontrar o criador (primeiro membro ou usuário atual)
        owner_ids = {user.id}

    print(f"[UPDATE MEMBERS] Owners a manter: {owner_ids}")
    print(f"[UPDATE MEMBERS] Membros recebidos: {members}")

    # Apaga todos
    RundownMember.query.filter_by(rundown_id=rundown_id).delete()
    db.session.flush()

    # Reinsere owner(s) - sempre mantém owners
    for oid in owner_ids:
        db.session.add(RundownMember(rundown_id=rundown_id, user_id=oid, role='owner'))
        print(f"[UPDATE MEMBERS] Owner {oid} mantido")

    # Adiciona novos membros (evita duplicar owners)
    members_added = 0
    for uid in members:
        if uid not in owner_ids:
            db.session.add(RundownMember(rundown_id=rundown_id, user_id=uid))
            members_added += 1
            print(f"[UPDATE MEMBERS] Membro {uid} adicionado")
    
    print(f"[UPDATE MEMBERS] Total de membros após atualização: {len(owner_ids) + members_added}")

    db.session.commit()
    
    # CRÍTICO: Invalidar cache de TODOS os usuários da empresa
    # Isso garante que todos vejam a lista atualizada após mudança de membros
    invalidate_company_cache(user.company_id)
    print(f"[UPDATE MEMBERS] Cache invalidado para empresa {user.company_id}")
    print(f"[UPDATE MEMBERS] Rundown {rundown_id} agora tem {len(members)} membros")

    try:
        broadcast_rundown_list_changed(company_id=user.company_id)
    except Exception:
        pass

    return jsonify({'message': 'Equipe atualizada com sucesso', 'members_count': len(members)})
