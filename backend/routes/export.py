"""
Rotas para exportação e importação de rundowns
Sprint 5 - Backup e compartilhamento
"""

from flask import Blueprint, jsonify, request, send_file
from auth_utils import jwt_required
from models import db, Rundown, Folder, Item, User
from flask import g
import json
from datetime import datetime
import io

export_bp = Blueprint('export', __name__, url_prefix='/api/export')


@export_bp.route('/rundown/<int:rundown_id>', methods=['GET'])
@jwt_required()
def export_rundown(rundown_id):
    """Exporta um rundown completo em JSON"""
    try:
        current_user = g.current_user
        # CRÍTICO: Verificar se rundown pertence à mesma empresa
        rundown = Rundown.query.filter_by(id=rundown_id, company_id=current_user.company_id).first()
        if not rundown:
            return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
        
        # Estruturar dados para exportação
        export_data = {
            'version': '1.0',
            'exported_at': datetime.now().isoformat(),
            'exported_by': current_user.email,
            'rundown': {
                'name': rundown.name,
                'type': rundown.type,
                'duration': rundown.duration,
                'status': rundown.status,
                'folders': []
            }
        }
        
        # Adicionar pastas e itens
        for folder in rundown.folders:
            folder_data = {
                'title': folder.title,
                'ordem': folder.ordem,
                'items': []
            }
            
            for item in folder.items:
                item_data = {
                    'title': item.title,
                    'duration': item.duration,
                    'description': item.description,
                    'type': item.type,
                    'status': item.status,
                    'icon_type': item.icon_type,
                    'icon_data': item.icon_data,
                    'color': item.color,
                    'urgency': item.urgency,
                    'reminder': item.reminder,
                    'ordem': item.ordem,
                    'script': item.script,
                    'talking_points': item.talking_points,
                    'pronunciation_guide': item.pronunciation_guide,
                    'presenter_notes': item.presenter_notes
                }
                folder_data['items'].append(item_data)
            
            export_data['rundown']['folders'].append(folder_data)
        
        # Criar arquivo em memória
        json_str = json.dumps(export_data, indent=2, ensure_ascii=False)
        json_bytes = json_str.encode('utf-8')
        
        # Criar buffer
        buffer = io.BytesIO(json_bytes)
        buffer.seek(0)
        
        # Nome do arquivo
        filename = f"{rundown.name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        return send_file(
            buffer,
            mimetype='application/json',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@export_bp.route('/rundown/import', methods=['POST'])
@jwt_required()
def import_rundown():
    """Importa um rundown de um arquivo JSON"""
    try:
        current_user = g.current_user
        
        # Verificar se tem arquivo
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'Arquivo vazio'}), 400
        
        # Ler JSON
        try:
            import_data = json.load(file)
        except json.JSONDecodeError:
            return jsonify({'error': 'Arquivo JSON inválido'}), 400
        
        # Validar estrutura
        if 'rundown' not in import_data:
            return jsonify({'error': 'Estrutura de arquivo inválida'}), 400
        
        rundown_data = import_data['rundown']
        
        # Criar novo rundown
        # CRÍTICO: Sempre associar à empresa do usuário
        new_rundown = Rundown(
            name=f"{rundown_data['name']} (Importado)",
            type=rundown_data.get('type', 'Evento'),
            created=datetime.now().isoformat(),
            last_modified=datetime.now().isoformat(),
            status='Novo',
            duration=rundown_data.get('duration', '0'),
            team_members=1,
            company_id=current_user.company_id  # CRÍTICO: Isolamento por empresa
        )
        
        db.session.add(new_rundown)
        db.session.flush()  # Para obter o ID
        
        # Criar pastas e itens
        for folder_data in rundown_data.get('folders', []):
            new_folder = Folder(
                title=folder_data['title'],
                ordem=folder_data.get('ordem', 0),
                rundown_id=new_rundown.id
            )
            db.session.add(new_folder)
            db.session.flush()
            
            for item_data in folder_data.get('items', []):
                new_item = Item(
                    title=item_data['title'],
                    duration=item_data.get('duration', 60),
                    description=item_data.get('description', ''),
                    type=item_data.get('type', 'generic'),
                    status=item_data.get('status', 'pending'),
                    icon_type=item_data.get('icon_type', 'lucide'),
                    icon_data=item_data.get('icon_data', 'HelpCircle'),
                    color=item_data.get('color', '#808080'),
                    urgency=item_data.get('urgency', 'normal'),
                    reminder=item_data.get('reminder', ''),
                    ordem=item_data.get('ordem', 0),
                    folder_id=new_folder.id,
                    script=item_data.get('script'),
                    talking_points=item_data.get('talking_points'),
                    pronunciation_guide=item_data.get('pronunciation_guide'),
                    presenter_notes=item_data.get('presenter_notes')
                )
                db.session.add(new_item)
        
        # CRÍTICO: Vincular o rundown a TODOS os membros da empresa (como em templates.py)
        # Isso garante que todos os usuários da empresa possam ver e editar o rundown importado
        from models import RundownMember
        try:
            company_users = User.query.filter_by(company_id=current_user.company_id).all()
            for company_user in company_users:
                # Verifica se já existe vínculo
                existing = RundownMember.query.filter_by(rundown_id=new_rundown.id, user_id=company_user.id).first()
                if not existing:
                    role = 'owner' if company_user.id == current_user.id else 'member'
                    db.session.add(RundownMember(rundown_id=new_rundown.id, user_id=company_user.id, role=role))
                    print(f"[IMPORT] Usuário {company_user.id} ({company_user.name}) vinculado como {role}")
        except Exception as e:
            print(f"[IMPORT] ⚠️ Erro ao vincular usuários da empresa: {e}")
            # Se der erro, pelo menos vincula ao criador
            try:
                rundown_member = RundownMember(rundown_id=new_rundown.id, user_id=current_user.id, role='owner')
                db.session.add(rundown_member)
                print(f"[IMPORT] Apenas criador vinculado como owner")
            except Exception:
                pass
        
        db.session.flush()  # Garantir que os membros sejam criados antes do commit
        
        # Verificar se o membro foi criado corretamente
        creator_member = RundownMember.query.filter_by(rundown_id=new_rundown.id, user_id=current_user.id).first()
        print(f"[IMPORT] Rundown {new_rundown.id} importado por usuário {current_user.id} ({current_user.name})")
        print(f"[IMPORT] Company ID: {new_rundown.company_id}, User Company ID: {current_user.company_id}")
        print(f"[IMPORT] Membro criado: {creator_member is not None}, role={creator_member.role if creator_member else 'N/A'}")
        
        db.session.commit()
        
        # CRÍTICO: Invalidar cache de TODOS os usuários da empresa
        # Isso garante que todos vejam o novo rundown importado imediatamente
        try:
            from cache_utils import invalidate_company_cache
            invalidate_company_cache(current_user.company_id)
            print(f"[IMPORT] Cache invalidado para empresa {current_user.company_id}")
        except Exception as e:
            print(f"[IMPORT] ⚠️ Erro ao invalidar cache: {e}")
        
        # Notifica lista alterada para todos os usuários da empresa
        try:
            from websocket_server import broadcast_rundown_list_changed
            broadcast_rundown_list_changed(company_id=current_user.company_id)
            print(f"[IMPORT] Notificação WebSocket enviada para empresa {current_user.company_id}")
        except Exception as e:
            print(f"[IMPORT] ⚠️ Erro ao enviar notificação WebSocket: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Rundown importado com sucesso',
            'rundown_id': new_rundown.id,
            'rundown_name': new_rundown.name
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"[ERRO] Erro ao importar rundown: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Erro ao importar rundown: {str(e)}'}), 500


@export_bp.route('/rundown/<int:rundown_id>/duplicate', methods=['POST'])
@jwt_required()
def duplicate_rundown(rundown_id):
    """Duplica um rundown existente"""
    try:
        current_user = g.current_user
        # CRÍTICO: Verificar se rundown pertence à mesma empresa
        original = Rundown.query.filter_by(id=rundown_id, company_id=current_user.company_id).first()
        if not original:
            return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
        
        # Criar cópia do rundown
        duplicate = Rundown(
            name=f"{original.name} (Cópia)",
            type=original.type,
            created=datetime.now().isoformat(),
            last_modified=datetime.now().isoformat(),
            status='Novo',
            duration=original.duration,
            team_members=1,
            company_id=current_user.company_id  # CRÍTICO: Isolamento por empresa
        )
        
        db.session.add(duplicate)
        db.session.flush()
        
        # Copiar pastas e itens
        for folder in original.folders:
            new_folder = Folder(
                title=folder.title,
                ordem=folder.ordem,
                rundown_id=duplicate.id
            )
            db.session.add(new_folder)
            db.session.flush()
            
            for item in folder.items:
                new_item = Item(
                    title=item.title,
                    duration=item.duration,
                    description=item.description,
                    type=item.type,
                    status=item.status,
                    icon_type=item.icon_type,
                    icon_data=item.icon_data,
                    color=item.color,
                    urgency=item.urgency,
                    reminder=item.reminder,
                    ordem=item.ordem,
                    folder_id=new_folder.id,
                    script=item.script,
                    talking_points=item.talking_points,
                    pronunciation_guide=item.pronunciation_guide,
                    presenter_notes=item.presenter_notes
                )
                db.session.add(new_item)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Rundown duplicado com sucesso',
            'rundown_id': duplicate.id,
            'rundown_name': duplicate.name
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

