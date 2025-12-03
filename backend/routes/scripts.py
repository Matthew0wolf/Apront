"""
Rotas para gerenciamento de scripts do teleprompter
Sprint 1 - Backend: Rotas API para scripts
"""

from flask import Blueprint, request, jsonify, g
from auth_utils import jwt_required
from models import db, Item, Folder, Rundown, Rehearsal, User, SystemEvent
import datetime
import json

scripts_bp = Blueprint('scripts', __name__, url_prefix='/api')


@scripts_bp.route('/items/<int:item_id>/script', methods=['GET'])
@jwt_required()
def get_item_script(item_id):
    """Obtém o script completo de um item"""
    try:
        current_user = g.current_user
        item = Item.query.get_or_404(item_id)
        
        # CRÍTICO: Verificar se o item pertence a um rundown da mesma empresa
        from models import Rundown
        rundown = Rundown.query.get(item.folder.rundown_id) if item.folder else None
        
        if not rundown or rundown.company_id != current_user.company_id:
            return jsonify({'error': 'Item não encontrado ou sem permissão'}), 404
        
        # Montar resposta com todos os campos de script
        try:
            talking_points = json.loads(item.talking_points) if item.talking_points else []
        except (json.JSONDecodeError, TypeError):
            talking_points = []
        
        script_data = {
            'id': item.id,
            'title': item.title,
            'duration': item.duration,
            'script': item.script or '',
            'talking_points': talking_points,
            'pronunciation_guide': item.pronunciation_guide or '',
            'presenter_notes': item.presenter_notes or ''
        }
        
        return jsonify(script_data), 200
        
    except Exception as e:
        print(f"Erro ao obter script do item {item_id}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@scripts_bp.route('/items/<int:item_id>/script', methods=['PUT'])
@jwt_required()
def update_item_script(item_id):
    """Atualiza o script de um item"""
    try:
        current_user = g.current_user
        
        if not current_user or not current_user.company_id:
            return jsonify({'error': 'Usuário sem empresa associada'}), 403
        
        data = request.get_json()
        
        item = Item.query.get_or_404(item_id)
        
        # CRÍTICO: Verificar se o item pertence à mesma empresa do usuário
        # Buscar o folder do item e depois o rundown
        folder = Folder.query.get(item.folder_id)
        if not folder:
            return jsonify({'error': 'Pasta não encontrada'}), 404
        
        rundown = Rundown.query.get(folder.rundown_id)
        if not rundown:
            return jsonify({'error': 'Rundown não encontrado'}), 404
        
        if rundown.company_id != current_user.company_id:
            return jsonify({'error': 'Sem permissão para editar este item'}), 403
        
        # Atualizar campos de script
        if 'script' in data:
            item.script = data['script']
        
        if 'talking_points' in data:
            # Converter array para JSON string
            item.talking_points = json.dumps(data['talking_points'])
        
        if 'pronunciation_guide' in data:
            item.pronunciation_guide = data['pronunciation_guide']
        
        if 'presenter_notes' in data:
            item.presenter_notes = data['presenter_notes']
        
        # Criar evento de auditoria para atualização de script
        try:
            audit_event = SystemEvent(
                event_type='item.script_updated',
                user_id=current_user.id,
                company_id=current_user.company_id,
                resource_type='item',
                resource_id=item.id,
                metadata_json=json.dumps({
                    'item_title': item.title,
                    'project_name': rundown.name,
                    'has_script': bool(data.get('script')),
                    'has_talking_points': bool(data.get('talking_points')),
                    'has_pronunciation_guide': bool(data.get('pronunciation_guide')),
                    'has_presenter_notes': bool(data.get('presenter_notes'))
                }),
                created_at=datetime.datetime.utcnow(),
                ip_address=request.remote_addr[:50] if request.remote_addr else None,
                user_agent=request.headers.get('User-Agent', '')[:200] if request.headers else None
            )
            db.session.add(audit_event)
        except Exception as e:
            print(f"⚠️ Erro ao criar evento de auditoria (não crítico): {e}")
        
        db.session.commit()
        
        # Retornar dados atualizados
        script_data = {
            'id': item.id,
            'title': item.title,
            'script': item.script,
            'talking_points': json.loads(item.talking_points) if item.talking_points else [],
            'pronunciation_guide': item.pronunciation_guide,
            'presenter_notes': item.presenter_notes
        }
        
        return jsonify({
            'success': True,
            'message': 'Script atualizado com sucesso',
            'data': script_data
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@scripts_bp.route('/rundowns/<int:rundown_id>/scripts', methods=['GET'])
@jwt_required()
def get_rundown_scripts(rundown_id):
    """Obtém todos os scripts de um rundown (para o apresentador ver tudo)"""
    try:
        current_user = g.current_user
        # CRÍTICO: Verificar se rundown pertence à mesma empresa
        rundown = Rundown.query.filter_by(id=rundown_id, company_id=current_user.company_id).first()
        if not rundown:
            return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
        
        # Buscar todas as pastas e itens do rundown
        folders = Folder.query.filter_by(rundown_id=rundown_id).order_by(Folder.ordem).all()
        
        scripts_data = []
        
        for folder in folders:
            folder_data = {
                'folder_id': folder.id,
                'folder_title': folder.title,
                'items': []
            }
            
            items = Item.query.filter_by(folder_id=folder.id).order_by(Item.ordem).all()
            
            for item in items:
                item_data = {
                    'id': item.id,
                    'title': item.title,
                    'duration': item.duration,
                    'has_script': bool(item.script),
                    'script': item.script or '',
                    'talking_points': json.loads(item.talking_points) if item.talking_points else [],
                    'pronunciation_guide': item.pronunciation_guide or '',
                    'presenter_notes': item.presenter_notes or ''
                }
                folder_data['items'].append(item_data)
            
            scripts_data.append(folder_data)
        
        return jsonify({
            'rundown_id': rundown_id,
            'rundown_name': rundown.name,
            'scripts': scripts_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@scripts_bp.route('/rehearsals', methods=['POST'])
@jwt_required()
def create_rehearsal():
    """Registra um novo ensaio de um item"""
    try:
        current_user = g.current_user
        data = request.get_json()
        
        # Validar campos obrigatórios
        if 'item_id' not in data:
            return jsonify({'error': 'item_id é obrigatório'}), 400
        
        item = Item.query.get_or_404(data['item_id'])
        
        # Calcular diferença
        duration = data.get('duration', 0)
        planned_duration = data.get('planned_duration', item.duration or 0)
        difference = duration - planned_duration
        
        # Criar novo ensaio
        rehearsal = Rehearsal(
            item_id=data['item_id'],
            user_id=current_user.id,
            duration=duration,
            planned_duration=planned_duration,
            difference=difference,
            recorded_at=datetime.datetime.now().isoformat(),
            notes=data.get('notes', '')
        )
        
        db.session.add(rehearsal)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ensaio registrado com sucesso',
            'data': {
                'id': rehearsal.id,
                'item_id': rehearsal.item_id,
                'duration': rehearsal.duration,
                'planned_duration': rehearsal.planned_duration,
                'difference': rehearsal.difference,
                'recorded_at': rehearsal.recorded_at
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@scripts_bp.route('/items/<int:item_id>/rehearsals', methods=['GET'])
@jwt_required()
def get_item_rehearsals(item_id):
    """Obtém histórico de ensaios de um item"""
    try:
        current_user = g.current_user
        item = Item.query.get_or_404(item_id)
        
        # Buscar ensaios do item (do usuário atual ou de todos?)
        # Por enquanto, vamos buscar apenas do usuário atual
        rehearsals = Rehearsal.query.filter_by(
            item_id=item_id,
            user_id=current_user.id
        ).order_by(Rehearsal.recorded_at.desc()).all()
        
        rehearsals_data = []
        for rehearsal in rehearsals:
            rehearsals_data.append({
                'id': rehearsal.id,
                'duration': rehearsal.duration,
                'planned_duration': rehearsal.planned_duration,
                'difference': rehearsal.difference,
                'recorded_at': rehearsal.recorded_at,
                'notes': rehearsal.notes,
                'status': 'over' if rehearsal.difference > 0 else 'under' if rehearsal.difference < 0 else 'perfect'
            })
        
        # Calcular estatísticas
        stats = {
            'total_rehearsals': len(rehearsals),
            'average_difference': sum(r.difference for r in rehearsals) / len(rehearsals) if rehearsals else 0,
            'best_attempt': min(rehearsals, key=lambda r: abs(r.difference)) if rehearsals else None
        }
        
        if stats['best_attempt']:
            stats['best_attempt'] = {
                'id': stats['best_attempt'].id,
                'difference': stats['best_attempt'].difference,
                'recorded_at': stats['best_attempt'].recorded_at
            }
        
        return jsonify({
            'item_id': item_id,
            'item_title': item.title,
            'rehearsals': rehearsals_data,
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@scripts_bp.route('/rehearsals/<int:rehearsal_id>', methods=['DELETE'])
@jwt_required()
def delete_rehearsal(rehearsal_id):
    """Remove um ensaio"""
    try:
        current_user = g.current_user
        rehearsal = Rehearsal.query.get_or_404(rehearsal_id)
        
        # Verificar se o ensaio pertence ao usuário
        if rehearsal.user_id != current_user.id:
            return jsonify({'error': 'Sem permissão para deletar este ensaio'}), 403
        
        db.session.delete(rehearsal)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ensaio removido com sucesso'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@scripts_bp.route('/users/<int:user_id>/rehearsals/stats', methods=['GET'])
@jwt_required()
def get_user_rehearsal_stats(user_id):
    """Obtém estatísticas gerais de ensaios de um usuário"""
    try:
        current_user = g.current_user
        
        # Usuário só pode ver suas próprias estatísticas (exceto admin)
        if user_id != current_user.id and current_user.role.value != 'admin':
            return jsonify({'error': 'Sem permissão'}), 403
        
        rehearsals = Rehearsal.query.filter_by(user_id=user_id).all()
        
        if not rehearsals:
            return jsonify({
                'user_id': user_id,
                'total_rehearsals': 0,
                'total_time_practiced': 0,
                'average_accuracy': 0,
                'items_practiced': 0
            }), 200
        
        # Calcular estatísticas
        stats = {
            'user_id': user_id,
            'total_rehearsals': len(rehearsals),
            'total_time_practiced': sum(r.duration for r in rehearsals if r.duration),
            'average_accuracy': sum(abs(r.difference) for r in rehearsals) / len(rehearsals),
            'items_practiced': len(set(r.item_id for r in rehearsals)),
            'recent_rehearsals': []
        }
        
        # Últimos 5 ensaios
        recent = sorted(rehearsals, key=lambda r: r.recorded_at, reverse=True)[:5]
        for rehearsal in recent:
            item = Item.query.get(rehearsal.item_id)
            stats['recent_rehearsals'].append({
                'id': rehearsal.id,
                'item_title': item.title if item else 'Item removido',
                'duration': rehearsal.duration,
                'difference': rehearsal.difference,
                'recorded_at': rehearsal.recorded_at
            })
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

