from flask import Blueprint, jsonify, request
from models import db, Rundown, RundownMember, Folder, Item, User, SystemEvent
from flask import g
from auth_utils import jwt_required, payment_required
from limit_utils import limit_check, update_company_limits, log_usage
from websocket_server import broadcast_rundown_update, broadcast_rundown_list_changed
from sqlalchemy.orm import joinedload
from cache_utils import cached, invalidate_rundown_cache, get_cache, set_cache, delete_cache, invalidate_company_cache, invalidate_user_cache
import json
import datetime

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
    
    # Debug: Log para verificar o que está sendo retornado
    print(f"[GET RUNDOWNS] Usuário {user.id} (empresa {user.company_id}): {len(member_rundown_ids)} membros, {len(rundowns)} rundowns retornados")
    
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
    data = request.get_json()
    name = data.get('name', '').strip()
    
    # Validação: limite de 50 caracteres para o nome do projeto
    if not name:
        return jsonify({'error': 'Nome do projeto é obrigatório'}), 400
    if len(name) > 50:
        return jsonify({'error': 'Nome do projeto deve ter no máximo 50 caracteres'}), 400
    
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
    
    # CRÍTICO: Vincular o rundown a TODOS os membros da empresa (como em templates.py e export.py)
    # Isso garante que todos os usuários da empresa possam ver e editar o rundown criado
    creator_id = g.current_user.id
    
    # PRIMEIRO: Sempre garantir que o criador seja vinculado (crítico)
    try:
        db.session.add(RundownMember(rundown_id=rundown.id, user_id=creator_id, role='owner'))
        print(f"[CREATE] Criador {creator_id} vinculado como owner (garantido)")
    except Exception as e:
        print(f"[CREATE] ⚠️ ERRO CRÍTICO ao vincular criador: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Erro ao criar rundown: falha ao vincular criador'}), 500
    
    # DEPOIS: Vincular outros membros da empresa (não crítico)
    try:
        from models import User
        company_users = User.query.filter_by(company_id=g.current_user.company_id).all()
        for company_user in company_users:
            if company_user.id != creator_id:  # Criador já foi vinculado
                # Verifica se já existe vínculo
                existing = RundownMember.query.filter_by(rundown_id=rundown.id, user_id=company_user.id).first()
                if not existing:
                    db.session.add(RundownMember(rundown_id=rundown.id, user_id=company_user.id, role='member'))
                    print(f"[CREATE] Usuário {company_user.id} ({company_user.name}) vinculado como member")
    except Exception as e:
        print(f"[CREATE] ⚠️ Erro ao vincular outros usuários da empresa (não crítico): {e}")
        # Continua mesmo se falhar - o criador já está vinculado
    
    # Commit da criação do rundown e vínculos
    try:
        db.session.commit()
        print(f"[CREATE] ✅ Rundown {rundown.id} criado e commitado com sucesso")
    except Exception as e:
        print(f"[CREATE] ❌ ERRO ao fazer commit: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': f'Erro ao criar rundown: {str(e)}'}), 500
    
    # Loga o uso
    log_usage(g.current_user.company_id, g.current_user.id, 'create_rundown', 'rundown', rundown.id, {'name': rundown.name})
    
    # Criar evento de auditoria (não crítico - se falhar, o rundown já foi criado)
    try:
        audit_event = SystemEvent(
            event_type='rundown.created',
            user_id=g.current_user.id,
            company_id=g.current_user.company_id,
            resource_type='rundown',
            resource_id=rundown.id,
            metadata_json=json.dumps({
                'name': rundown.name,
                'type': rundown.type,
                'project_name': rundown.name
            }),
            created_at=datetime.datetime.utcnow(),
            ip_address=request.remote_addr[:50] if request.remote_addr else None,
            user_agent=request.headers.get('User-Agent', '')[:200] if request.headers else None
        )
        db.session.add(audit_event)
        db.session.commit()
    except Exception as e:
        print(f"⚠️ Erro ao criar evento de auditoria (não crítico - rundown já criado): {e}")
        import traceback
        traceback.print_exc()
        # Não faz rollback - o rundown já foi commitado com sucesso
        # Apenas expira a sessão para evitar problemas futuros
        db.session.expire_all()
    
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
@jwt_required()
def update_rundown(rundown_id):
    from models import Folder, Item
    import datetime
    
    user = g.current_user
    # CRÍTICO: Verificar se rundown pertence à mesma empresa
    rundown = Rundown.query.filter_by(id=rundown_id, company_id=user.company_id).first()
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
    
    # Verificar permissão: admin/operator OU membro do rundown
    user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
    has_operate_permission = (user_role in ['admin', 'operator']) or getattr(user, 'can_operate', False)
    
    # Verificar se é membro do rundown (owner ou member)
    rundown_member = RundownMember.query.filter_by(rundown_id=rundown_id, user_id=user.id).first()
    is_member = rundown_member is not None
    is_owner = rundown_member and rundown_member.role == 'owner'
    
    # Debug: log de permissões
    print(f"[UPDATE RUNDOWN] Usuário {user.id} ({user.name}) tentando editar rundown {rundown_id}")
    print(f"[UPDATE RUNDOWN] Company ID - Rundown: {rundown.company_id}, User: {user.company_id}")
    print(f"[UPDATE RUNDOWN] Role: {user_role}, can_operate: {getattr(user, 'can_operate', False)}")
    print(f"[UPDATE RUNDOWN] has_operate_permission: {has_operate_permission}, is_member: {is_member}, is_owner: {is_owner}")
    
    # CRÍTICO: Verificar se o rundown pertence à mesma empresa do usuário
    if rundown.company_id != user.company_id:
        print(f"[UPDATE RUNDOWN] ❌ ERRO: Rundown pertence à empresa {rundown.company_id}, mas usuário está na empresa {user.company_id}")
        return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
    
    # Permitir edição se: tem can_operate OU é membro do rundown (especialmente owner)
    if not has_operate_permission and not is_member:
        print(f"[UPDATE RUNDOWN] ❌ PERMISSÃO NEGADA para usuário {user.id}")
        # Se não é membro, tenta adicionar como membro (pode ser rundown importado sem vínculo)
        if not is_member:
            print(f"[UPDATE RUNDOWN] ⚠️ Usuário não é membro. Tentando adicionar como membro...")
            try:
                # Adiciona como membro se for da mesma empresa
                new_member = RundownMember(rundown_id=rundown_id, user_id=user.id, role='member')
                db.session.add(new_member)
                db.session.flush()
                print(f"[UPDATE RUNDOWN] ✅ Usuário {user.id} adicionado como membro do rundown {rundown_id}")
                is_member = True
            except Exception as e:
                print(f"[UPDATE RUNDOWN] ❌ Erro ao adicionar membro: {e}")
                return jsonify({'error': 'Permissão negada. Você precisa ser operador ou membro deste rundown para editá-lo.'}), 403
        else:
            return jsonify({'error': 'Permissão negada. Você precisa ser operador ou membro deste rundown para editá-lo.'}), 403
    
    print(f"[UPDATE RUNDOWN] ✅ PERMISSÃO CONCEDIDA para usuário {user.id}")
    
    # NOTA: Removido bloqueio de edição quando está "ao vivo"
    # Operadores devem poder editar mesmo durante transmissão ao vivo
    # para fazer ajustes em tempo real se necessário
    
    data = request.get_json()
    
    # Validação: limite de 50 caracteres para o nome do projeto
    if 'name' in data:
        name = data['name'].strip() if isinstance(data['name'], str) else str(data['name']).strip()
        if len(name) > 50:
            return jsonify({'error': 'Nome do projeto deve ter no máximo 50 caracteres'}), 400
        if not name:
            return jsonify({'error': 'Nome do projeto é obrigatório'}), 400
        data['name'] = name
    
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
        
        try:
            
            # Validar que items_data é uma lista
            if not isinstance(items_data, list):
                print(f"❌ [UPDATE RUNDOWN] items_data não é uma lista: {type(items_data)}")
                return jsonify({'error': 'Items deve ser uma lista'}), 400
            
            # Remove todas as pastas e itens existentes
            # IMPORTANTE: Deletar items primeiro para evitar violação de foreign key
            existing_folders = Folder.query.filter_by(rundown_id=rundown_id).all()
            for folder in existing_folders:
                # Deletar items da pasta primeiro
                Item.query.filter_by(folder_id=folder.id).delete()
                # Depois deletar a pasta
                db.session.delete(folder)
            db.session.flush()  # Garantir que as deleções sejam processadas
            
            # Cria novas pastas e itens
            for folder_index, folder_data in enumerate(items_data):
                # Ignorar se não for uma pasta válida
                if not folder_data or not isinstance(folder_data, dict):
                    print(f"⚠️ [UPDATE RUNDOWN] Pasta {folder_index} inválida ou não é dict: {type(folder_data)}")
                    continue
                    
                if folder_data.get('type') != 'folder':
                    print(f"⚠️ [UPDATE RUNDOWN] Pasta {folder_index} não tem type='folder': {folder_data.get('type')}")
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
                if not isinstance(children, list):
                    print(f"⚠️ [UPDATE RUNDOWN] Children não é uma lista na pasta {folder_index}")
                    children = []
                    
                for item_index, item_data in enumerate(children):
                    # Ignorar se não for um item válido
                    if not item_data or not isinstance(item_data, dict):
                        print(f"⚠️ [UPDATE RUNDOWN] Item {item_index} inválido ou não é dict na pasta {folder_index}")
                        continue
                        
                    if item_data.get('type') == 'folder':
                        continue
                        
                    # Converter talking_points para JSON string se necessário
                    talking_points_raw = item_data.get('talking_points')
                    talking_points_str = None
                    if talking_points_raw:
                        try:
                            if isinstance(talking_points_raw, str):
                                # Se já é string, verifica se é JSON válido
                                try:
                                    json.loads(talking_points_raw)  # Valida JSON
                                    talking_points_str = talking_points_raw
                                except (json.JSONDecodeError, TypeError):
                                    # Se não é JSON válido, tenta converter
                                    talking_points_str = json.dumps(talking_points_raw)
                            elif isinstance(talking_points_raw, (list, dict)):
                                talking_points_str = json.dumps(talking_points_raw)
                            else:
                                talking_points_str = json.dumps(talking_points_raw)
                        except Exception as e:
                            print(f"⚠️ [UPDATE RUNDOWN] Erro ao converter talking_points: {e}")
                            talking_points_str = None
                    
                    # Garantir que todos os campos sejam tipos básicos (não dict/list aninhados)
                    try:
                        new_item = Item(
                            title=str(item_data.get('title', f'Evento {item_index + 1}'))[:120] if item_data.get('title') else f'Evento {item_index + 1}',
                            duration=int(item_data.get('duration', 60) or 60),
                            description=str(item_data.get('description', '')) if item_data.get('description') else '',
                            type=str(item_data.get('type', 'generic'))[:30] if item_data.get('type') else 'generic',
                            status=str(item_data.get('status', 'pending'))[:30] if item_data.get('status') else 'pending',
                            icon_type=str(item_data.get('iconType', 'lucide'))[:30] if item_data.get('iconType') else 'lucide',
                            icon_data=str(item_data.get('iconData', 'HelpCircle'))[:60] if item_data.get('iconData') else 'HelpCircle',
                            color=str(item_data.get('color', '#808080'))[:20] if item_data.get('color') else '#808080',
                            urgency=str(item_data.get('urgency', 'normal'))[:20] if item_data.get('urgency') else 'normal',
                            reminder=str(item_data.get('reminder', ''))[:120] if item_data.get('reminder') else '',
                            ordem=item_index + 1,
                            folder_id=new_folder.id,
                            script=str(item_data.get('script')) if item_data.get('script') else None,
                            talking_points=talking_points_str,
                            pronunciation_guide=str(item_data.get('pronunciation_guide')) if item_data.get('pronunciation_guide') else None,
                            presenter_notes=str(item_data.get('presenter_notes')) if item_data.get('presenter_notes') else None
                        )
                        db.session.add(new_item)
                    except Exception as e:
                        print(f"❌ [UPDATE RUNDOWN] Erro ao criar item {item_index} na pasta {folder_index}: {e}")
                        import traceback
                        traceback.print_exc()
                        # Continua com o próximo item ao invés de falhar tudo
                        continue
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ [UPDATE RUNDOWN] Erro ao processar items: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Erro ao processar items: {str(e)[:200]}'}), 500
        
        # CRÍTICO: Após salvar, reconstruir a estrutura com IDs reais para retornar ao frontend
        # Isso permite que o frontend atualize os IDs temporários com os IDs reais do banco
        saved_items = []
        saved_folders = Folder.query.filter_by(rundown_id=rundown_id).order_by(Folder.ordem).all()
        for folder in saved_folders:
            folder_items = []
            saved_folder_items = Item.query.filter_by(folder_id=folder.id).order_by(Item.ordem).all()
            for item in saved_folder_items:
                folder_items.append({
                    'id': str(item.id),
                    'title': item.title,
                    'duration': item.duration,
                    'description': item.description or '',
                    'type': item.type,
                    'status': item.status,
                    'iconType': item.icon_type,
                    'iconData': item.icon_data,
                    'color': item.color,
                    'urgency': item.urgency,
                    'reminder': item.reminder or ''
                })
            saved_items.append({
                'id': str(folder.id),
                'title': folder.title,
                'type': 'folder',
                'children': folder_items
            })
        
        # Incluir items salvos na resposta para que o frontend atualize os IDs temporários
        changes['items'] = saved_items
        
        # Contar total de pastas e itens para auditoria
        total_items = sum(len(folder.get('children', [])) for folder in saved_items)
        
        # Criar evento de auditoria para modificação da estrutura
        try:
            audit_event = SystemEvent(
                event_type='rundown.structure_updated',
                user_id=user.id,
                company_id=user.company_id,
                resource_type='rundown',
                resource_id=rundown_id,
                metadata_json=json.dumps({
                    'project_name': rundown.name,
                    'folders_count': len(saved_folders),
                    'items_count': total_items,
                    'action': 'modificou a estrutura do projeto'
                }),
                created_at=datetime.datetime.utcnow(),
                ip_address=request.remote_addr[:50] if request.remote_addr else None,
                user_agent=request.headers.get('User-Agent', '')[:200] if request.headers else None
            )
            db.session.add(audit_event)
        except Exception as e:
            print(f"⚠️ Erro ao criar evento de auditoria (não crítico): {e}")
        
        print(f"[UPDATE] Pastas e itens salvos para rundown {rundown_id}. Total: {len(saved_folders)} pastas, {total_items} itens")
    
    # Atualiza last_modified
    rundown.last_modified = datetime.datetime.utcnow().isoformat()
    
    # CRÍTICO: Garantir que o commit seja feito e verificar se houve erro
    try:
        db.session.commit()
        print(f"[UPDATE RUNDOWN] ✅ Commit realizado com sucesso para rundown {rundown_id}")
    except Exception as e:
        db.session.rollback()
        print(f"[UPDATE RUNDOWN] ❌ ERRO ao fazer commit: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erro ao salvar alterações: {str(e)}'}), 500
    
    # Invalidar cache do rundown E da lista de rundowns da empresa
    invalidate_rundown_cache(rundown_id)
    invalidate_company_cache(user.company_id)  # Invalida cache da lista de rundowns
    # CRÍTICO: Também invalidar cache específico de cada usuário da empresa
    company_users = User.query.filter_by(company_id=user.company_id).all()
    for company_user in company_users:
        invalidate_user_cache(company_user.id)
    print(f"[UPDATE RUNDOWN] Cache invalidado para rundown {rundown_id} e empresa {user.company_id}")
    
    # Notifica todos os clientes conectados sobre as mudanças via WebSocket
    if changes:
        try:
            broadcast_rundown_update(rundown_id, changes)
            print(f"[UPDATE RUNDOWN] Notificação WebSocket enviada para rundown {rundown_id}")
            
            # CRÍTICO: Também notificar mudança na lista de rundowns para forçar recarregamento
            # Isso garante que outros usuários vejam as mudanças mesmo que não estejam na sala do rundown
            broadcast_rundown_list_changed(company_id=user.company_id)
            print(f"[UPDATE RUNDOWN] Notificação de mudança na lista enviada para empresa {user.company_id}")
        except Exception as e:
            print(f"[UPDATE RUNDOWN] ⚠️ Erro ao enviar WebSocket: {e}")
    
    # CRÍTICO: Retornar a estrutura completa com IDs reais para que o frontend atualize os IDs temporários
    response_data = {'message': 'Rundown atualizado com sucesso'}
    if 'items' in changes:
        response_data['items'] = changes['items']
        print(f"[UPDATE RUNDOWN] Retornando estrutura com {len(changes['items'])} pastas e IDs reais")
    
    return jsonify(response_data)


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
        
        # Criar notificações para todos os membros do rundown
        from routes.notifications import create_notification
        from models import User
        
        # Obter todos os membros do rundown
        members = RundownMember.query.filter_by(rundown_id=rundown_id).all()
        
        # Determinar título e mensagem da notificação baseado no status
        if new_status.lower() in ['ao vivo', 'aovivo', 'live', 'active']:
            notif_title = '▶️ Transmissão Iniciada'
            notif_message = f'{rundown.name} está AO VIVO'
            notif_type = 'success'
        elif new_status.lower() in ['pausado', 'paused', 'pausa']:
            notif_title = '⏸️ Transmissão Pausada'
            notif_message = f'{rundown.name} foi pausado'
            notif_type = 'info'
        elif new_status.lower() in ['parado', 'stopped', 'encerrado']:
            notif_title = '⏹️ Transmissão Encerrada'
            notif_message = f'{rundown.name} foi encerrado'
            notif_type = 'warning'
        else:
            notif_title = f'Status Atualizado: {new_status}'
            notif_message = f'{rundown.name} mudou para {new_status}'
            notif_type = 'info'
        
        # Criar notificação para cada membro
        for member in members:
            try:
                create_notification(
                    user_id=member.user_id,
                    title=notif_title,
                    message=notif_message,
                    type=notif_type,
                    category='rundown',
                    related_id=rundown_id,
                    action_url=f'/project/{rundown_id}/select-role'
                )
            except Exception as notif_error:
                print(f"Erro ao criar notificação para usuário {member.user_id}: {notif_error}")
        
        # Notificar via WebSocket para todos os membros da empresa
        try:
            from websocket_server import socketio
            # Enviar evento de notificação para a sala da empresa
            socketio.emit('new_notification', {
                'title': notif_title,
                'message': notif_message,
                'type': notif_type,
                'category': 'rundown',
                'related_id': rundown_id
            }, room=f'company_{user.company_id}')
            print(f'📢 Notificação de status enviada via WebSocket para empresa {user.company_id}')
        except Exception as ws_error:
            print(f"AVISO: Erro ao enviar notificação via WebSocket: {ws_error}")
        
        # Notifica todos os clientes conectados sobre a mudança de status via WebSocket
        try:
            changes = {
                'status': {
                    'old': old_status,
                    'new': new_status
                }
            }
            broadcast_rundown_update(rundown_id, changes)
            # CRÍTICO: Dispara evento para atualizar a lista de rundowns em todos os clientes
            broadcast_rundown_list_changed(company_id=user.company_id)
            print(f'📢 Lista de rundowns atualizada via WebSocket para empresa {user.company_id}')
        except Exception as ws_error:
            print(f"AVISO: Erro ao enviar WebSocket: {ws_error}")
        
        # Invalidar cache do rundown e da lista de rundowns
        try:
            invalidate_rundown_cache(rundown_id)
            invalidate_company_cache(user.company_id)
            print(f'🗑️ Cache invalidado para rundown {rundown_id} e empresa {user.company_id}')
        except Exception as cache_error:
            print(f"AVISO: Erro ao invalidar cache: {cache_error}")
        
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

# Buscar estado atual do timer (calcula tempo decorrido baseado no timestamp)
@rundown_bp.route('/<int:rundown_id>/timer-state', methods=['GET'])
@jwt_required()
def get_timer_state(rundown_id):
    """Retorna o estado atual do timer calculando o tempo decorrido no servidor"""
    user = g.current_user
    
    # Verificar se rundown pertence à mesma empresa
    rundown = Rundown.query.filter_by(id=rundown_id, company_id=user.company_id).first()
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
    
    # Calcular tempo decorrido baseado no timestamp de início
    time_elapsed = 0
    is_running = False
    
    # Verifica se os campos existem (pode não existir se a migração ainda não foi feita)
    try:
        is_running = getattr(rundown, 'is_timer_running', False) or False
        timer_started_at = getattr(rundown, 'timer_started_at', None)
        timer_elapsed_base = getattr(rundown, 'timer_elapsed_base', 0) or 0
        
        if is_running and timer_started_at:
            try:
                # Tenta usar fromisoformat (Python 3.7+), se falhar usa parser
                try:
                    started_at = datetime.datetime.fromisoformat(timer_started_at.replace('Z', '+00:00'))
                except:
                    from dateutil import parser
                    started_at = parser.parse(timer_started_at)
                
                now = datetime.datetime.utcnow()
                elapsed_seconds = int((now - started_at.replace(tzinfo=None)).total_seconds())
                time_elapsed = timer_elapsed_base + elapsed_seconds
            except Exception as e:
                print(f"Erro ao calcular tempo decorrido: {e}")
                time_elapsed = timer_elapsed_base
        else:
            time_elapsed = timer_elapsed_base
    except (AttributeError, Exception) as e:
        # Campos não existem ainda no banco ou erro ao acessar
        print(f"⚠️ Campos de timer não existem no banco ainda ou erro ao acessar: {e}")
        # CRÍTICO: Sempre retornar False (pausado) quando campos não existem
        # Não usar status como fallback para evitar iniciar automaticamente
        is_running = False
        time_elapsed = 0
    
    # Parse current_item_index
    current_item_index = {'folderIndex': 0, 'itemIndex': 0}
    try:
        current_item_index_json = getattr(rundown, 'current_item_index_json', None)
        if current_item_index_json:
            try:
                current_item_index = json.loads(current_item_index_json)
            except:
                pass
    except AttributeError:
        pass
    
    # CRÍTICO: Tenta obter valores com try/except para evitar erro se colunas não existirem
    timer_started_at_val = None
    timer_elapsed_base_val = 0
    try:
        timer_started_at_val = getattr(rundown, 'timer_started_at', None)
        timer_elapsed_base_val = getattr(rundown, 'timer_elapsed_base', 0) or 0
    except AttributeError:
        pass
    
    return jsonify({
        'isRunning': is_running,
        'timeElapsed': time_elapsed,
        'currentItemIndex': current_item_index,
        'timerStartedAt': timer_started_at_val,
        'timerElapsedBase': timer_elapsed_base_val
    })

# Atualizar estado do timer (iniciar, pausar, atualizar)
@rundown_bp.route('/<int:rundown_id>/timer-state', methods=['PATCH'])
@jwt_required()
def update_timer_state(rundown_id):
    """Atualiza o estado do timer no servidor"""
    user = g.current_user
    
    # Verificar se rundown pertence à mesma empresa
    rundown = Rundown.query.filter_by(id=rundown_id, company_id=user.company_id).first()
    if not rundown:
        return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
    
    try:
        data = request.get_json() or {}
        is_running = data.get('isRunning')
        time_elapsed = data.get('timeElapsed')
        current_item_index = data.get('currentItemIndex')
        
        # Atualizar estado do timer (verifica se os campos existem no modelo)
        try:
            # Atualizar estado do timer
            if is_running is not None:
                setattr(rundown, 'is_timer_running', is_running)
                
                if is_running:
                    # Timer iniciado: salva timestamp atual e tempo base
                    setattr(rundown, 'timer_started_at', datetime.datetime.utcnow().isoformat())
                    base_time = time_elapsed if time_elapsed is not None else (getattr(rundown, 'timer_elapsed_base', 0) or 0)
                    setattr(rundown, 'timer_elapsed_base', base_time)
                    # Atualiza status para "Ao Vivo"
                    if rundown.status != 'Ao Vivo':
                        rundown.status = 'Ao Vivo'
                else:
                    # Timer pausado: salva tempo base atual
                    if time_elapsed is not None:
                        setattr(rundown, 'timer_elapsed_base', time_elapsed)
                    setattr(rundown, 'timer_started_at', None)
                    # CRÍTICO: Atualiza status para "Pausado" quando pausa
                    if rundown.status == 'Ao Vivo':
                        rundown.status = 'Pausado'
            
            # Atualizar tempo decorrido se fornecido (sem mudar running state)
            if time_elapsed is not None and is_running is None:
                current_is_running = getattr(rundown, 'is_timer_running', False)
                current_started_at = getattr(rundown, 'timer_started_at', None)
                
                if current_is_running and current_started_at:
                    # Ajusta o tempo base para refletir o novo tempo
                    try:
                        try:
                            started_at = datetime.datetime.fromisoformat(current_started_at.replace('Z', '+00:00'))
                        except:
                            from dateutil import parser
                            started_at = parser.parse(current_started_at)
                        
                        now = datetime.datetime.utcnow()
                        elapsed_since_start = int((now - started_at.replace(tzinfo=None)).total_seconds())
                        setattr(rundown, 'timer_elapsed_base', time_elapsed - elapsed_since_start)
                    except:
                        setattr(rundown, 'timer_elapsed_base', time_elapsed)
                else:
                    setattr(rundown, 'timer_elapsed_base', time_elapsed)
            
            # Atualizar item atual
            if current_item_index:
                setattr(rundown, 'current_item_index_json', json.dumps(current_item_index))
        except AttributeError as e:
            # Campos não existem no banco ainda - apenas atualiza status como fallback
            print(f"⚠️ Campos de timer não existem no banco ainda: {e}")
            if is_running is not None:
                if is_running:
                    rundown.status = 'Ao Vivo'
                else:
                    rundown.status = 'Parado'
        
        db.session.commit()
        
        # Sincronizar via WebSocket
        try:
            changes = {
                'isRunning': rundown.is_timer_running,
                'timeElapsed': time_elapsed if time_elapsed is not None else (rundown.timer_elapsed_base or 0),
                'currentItemIndex': current_item_index if current_item_index else json.loads(rundown.current_item_index_json) if rundown.current_item_index_json else {'folderIndex': 0, 'itemIndex': 0},
                'status': rundown.status  # CRÍTICO: Incluir status para sincronização
            }
            broadcast_rundown_update(rundown_id, changes)
            print(f"✅ Timer state sincronizado via WebSocket: isRunning={rundown.is_timer_running}, status={rundown.status}")
        except Exception as ws_error:
            print(f"AVISO: Erro ao enviar WebSocket: {ws_error}")
        
        return jsonify({
            'message': 'Estado do timer atualizado com sucesso',
            'isRunning': rundown.is_timer_running,
            'timeElapsed': time_elapsed if time_elapsed is not None else (rundown.timer_elapsed_base or 0),
            'currentItemIndex': current_item_index if current_item_index else (json.loads(rundown.current_item_index_json) if rundown.current_item_index_json else {'folderIndex': 0, 'itemIndex': 0})
        })
    except Exception as e:
        db.session.rollback()
        print(f"ERRO ao atualizar estado do timer: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erro ao atualizar estado do timer: {str(e)}'}), 500

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
    
    # NOTA: Removido bloqueio de deleção quando está "ao vivo"
    # Operadores devem poder deletar mesmo durante transmissão ao vivo
    # se necessário (embora não seja recomendado)
    
    try:
        # Salvar nome do rundown antes de deletar (para auditoria)
        rundown_name = rundown.name
        
        # Deletar membros do rundown primeiro (cascade deve fazer isso, mas garantimos)
        from models import RundownMember
        RundownMember.query.filter_by(rundown_id=rundown_id).delete()
        
        # Deletar o rundown (cascade deleta folders e items automaticamente)
        db.session.delete(rundown)
        db.session.commit()
        
        # Criar evento de auditoria (não crítico - se falhar, o rundown já foi deletado)
        try:
            audit_event = SystemEvent(
                event_type='rundown.deleted',
                user_id=user.id,
                company_id=user.company_id,
                resource_type='rundown',
                resource_id=rundown_id,
                metadata_json=json.dumps({
                    'name': rundown_name,
                    'project_name': rundown_name
                }),
                created_at=datetime.datetime.utcnow(),
                ip_address=request.remote_addr[:50] if request.remote_addr else None,
                user_agent=request.headers.get('User-Agent', '')[:200] if request.headers else None
            )
            db.session.add(audit_event)
            db.session.commit()
        except Exception as e:
            print(f"⚠️ Erro ao criar evento de auditoria (não crítico - rundown já deletado): {e}")
            db.session.rollback()
        
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

    # NOTA: Removido bloqueio de alteração de membros quando está "ao vivo"
    # Operadores devem poder gerenciar membros mesmo durante transmissão ao vivo

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
