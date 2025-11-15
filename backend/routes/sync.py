from flask import Blueprint, request, jsonify, g
from models import db, Rundown
from auth_utils import jwt_required
import json
import time

sync_bp = Blueprint('sync', __name__, url_prefix='/api/sync')

# Armazena as mudanças temporariamente em memória
# Em produção, use Redis ou banco de dados
sync_data = {}

@sync_bp.route('/changes/<int:rundown_id>', methods=['GET'])
@jwt_required()
def get_changes(rundown_id):
    """Retorna as mudanças mais recentes para um rundown"""
    try:
        user = g.current_user
        # CRÍTICO: Verificar se rundown pertence à mesma empresa
        rundown = Rundown.query.filter_by(id=rundown_id, company_id=user.company_id).first()
        if not rundown:
            return jsonify({'error': 'Rundown não encontrado ou sem permissão'}), 404
        
        # Retorna as mudanças se existirem
        changes = sync_data.get(str(rundown_id), {})
        return jsonify({
            'hasChanges': bool(changes),
            'changes': changes,
            'timestamp': changes.get('timestamp', 0)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sync_bp.route('/changes/<int:rundown_id>', methods=['POST'])
@jwt_required()
def save_changes(rundown_id):
    """Salva mudanças para um rundown"""
    try:
        data = request.get_json()
        changes = data.get('changes', {})
        
        # Adiciona timestamp
        changes['timestamp'] = int(time.time() * 1000)
        changes['user_id'] = g.current_user.id
        
        # Salva as mudanças
        sync_data[str(rundown_id)] = changes
        
        return jsonify({
            'success': True,
            'timestamp': changes['timestamp']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sync_bp.route('/changes/<int:rundown_id>', methods=['DELETE'])
@jwt_required()
def clear_changes(rundown_id):
    """Limpa as mudanças para um rundown"""
    try:
        if str(rundown_id) in sync_data:
            del sync_data[str(rundown_id)]
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

