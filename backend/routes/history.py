"""
Rotas para histórico de transmissões
Sprint 5 - Tracking de transmissões realizadas
"""

from flask import Blueprint, jsonify, request
from auth_utils import jwt_required
from models import db, User
from flask import g
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

history_bp = Blueprint('history', __name__, url_prefix='/api/history')

# Modelo para histórico de transmissões
class TransmissionHistory(db.Model):
    __tablename__ = 'transmission_history'
    id = db.Column(db.Integer, primary_key=True)
    rundown_id = db.Column(db.Integer, db.ForeignKey('rundowns.id'))
    rundown_name = db.Column(db.String(120))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    started_at = db.Column(db.DateTime, nullable=False)
    finished_at = db.Column(db.DateTime)
    total_duration = db.Column(db.Integer)  # Segundos
    items_completed = db.Column(db.Integer, default=0)
    items_total = db.Column(db.Integer, default=0)
    status = db.Column(db.String(30), default='completed')  # completed, interrupted
    notes = db.Column(db.Text)
    
    # Relacionamentos
    user = db.relationship('User', backref='transmissions')


@history_bp.route('/transmissions', methods=['POST'])
@jwt_required()
def create_transmission_record():
    """Registra uma nova transmissão"""
    try:
        current_user = g.current_user
        data = request.get_json()
        
        transmission = TransmissionHistory(
            rundown_id=data.get('rundown_id'),
            rundown_name=data.get('rundown_name'),
            user_id=current_user.id,
            company_id=current_user.company_id,
            started_at=datetime.fromisoformat(data.get('started_at')),
            finished_at=datetime.fromisoformat(data.get('finished_at')) if data.get('finished_at') else None,
            total_duration=data.get('total_duration', 0),
            items_completed=data.get('items_completed', 0),
            items_total=data.get('items_total', 0),
            status=data.get('status', 'completed'),
            notes=data.get('notes', '')
        )
        
        db.session.add(transmission)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Transmissão registrada',
            'id': transmission.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@history_bp.route('/transmissions', methods=['GET'])
@jwt_required()
def get_transmissions():
    """Lista transmissões realizadas"""
    try:
        current_user = g.current_user
        
        # Filtros opcionais
        limit = request.args.get('limit', 50, type=int)
        rundown_id = request.args.get('rundown_id', type=int)
        
        query = TransmissionHistory.query
        
        # Admin vê todas, usuários veem apenas da sua empresa
        if current_user.role.value != 'admin':
            query = query.filter_by(company_id=current_user.company_id)
        
        # Filtro por rundown específico
        if rundown_id:
            query = query.filter_by(rundown_id=rundown_id)
        
        transmissions = query.order_by(TransmissionHistory.started_at.desc()).limit(limit).all()
        
        result = []
        for t in transmissions:
            result.append({
                'id': t.id,
                'rundown_id': t.rundown_id,
                'rundown_name': t.rundown_name,
                'user_id': t.user_id,
                'user_name': t.user.name if t.user else 'Desconhecido',
                'started_at': t.started_at.isoformat() if t.started_at else None,
                'finished_at': t.finished_at.isoformat() if t.finished_at else None,
                'total_duration': t.total_duration,
                'items_completed': t.items_completed,
                'items_total': t.items_total,
                'status': t.status,
                'notes': t.notes
            })
        
        return jsonify({
            'transmissions': result,
            'total': len(result)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@history_bp.route('/transmissions/stats', methods=['GET'])
@jwt_required()
def get_transmission_stats():
    """Estatísticas de transmissões"""
    try:
        current_user = g.current_user
        
        query = TransmissionHistory.query
        
        if current_user.role.value != 'admin':
            query = query.filter_by(company_id=current_user.company_id)
        
        transmissions = query.all()
        
        if not transmissions:
            return jsonify({
                'total_transmissions': 0,
                'total_duration': 0,
                'average_duration': 0,
                'completed': 0,
                'interrupted': 0
            }), 200
        
        stats = {
            'total_transmissions': len(transmissions),
            'total_duration': sum(t.total_duration or 0 for t in transmissions),
            'average_duration': sum(t.total_duration or 0 for t in transmissions) / len(transmissions),
            'completed': sum(1 for t in transmissions if t.status == 'completed'),
            'interrupted': sum(1 for t in transmissions if t.status == 'interrupted'),
            'most_used_rundown': None
        }
        
        # Rundown mais usado
        from collections import Counter
        rundown_counts = Counter(t.rundown_id for t in transmissions if t.rundown_id)
        if rundown_counts:
            most_used_id = rundown_counts.most_common(1)[0][0]
            most_used = next((t for t in transmissions if t.rundown_id == most_used_id), None)
            if most_used:
                stats['most_used_rundown'] = {
                    'id': most_used_id,
                    'name': most_used.rundown_name,
                    'count': rundown_counts[most_used_id]
                }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

