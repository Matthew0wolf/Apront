from flask import Blueprint, jsonify, request, g
from models import db, User, Company, Rundown, UsageLog, CompanyLimits
from auth_utils import jwt_required
from datetime import datetime, timedelta
import json

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

# Dashboard Admin - Visão geral da empresa
@analytics_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required(allowed_roles=['admin'])
def get_admin_dashboard():
    try:
        company_id = g.current_user.company_id
        company = Company.query.get(company_id)
        
        if not company:
            return jsonify({'error': 'Empresa não encontrada'}), 404
        
        # Métricas básicas
        total_users = User.query.filter_by(company_id=company_id).count()
        # CRÍTICO: Filtrar rundowns por company_id
        total_rundowns = Rundown.query.filter_by(company_id=company_id).count()
        
        # Uso dos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_usage = UsageLog.query.filter(
            UsageLog.company_id == company_id,
            UsageLog.created_at >= thirty_days_ago.isoformat()
        ).count()
        
        # Rundowns ao vivo (em execução) - considerar status 'Ao Vivo' e 'active'
        # CRÍTICO: Filtrar por company_id
        live_query = Rundown.query.filter_by(company_id=company_id).filter(Rundown.status.in_(['Ao Vivo', 'active']))
        active_rundowns = live_query.count()
        live_rundowns = [
            {
                'id': r.id,
                'name': r.name,
                'status': r.status,
                'last_modified': r.last_modified
            }
            for r in live_query.all()
        ]
        
        # Limites do plano
        limits = CompanyLimits.query.filter_by(company_id=company_id).first()
        if not limits:
            limits = CompanyLimits(company_id=company_id)
            db.session.add(limits)
            db.session.commit()
        
        # Estatísticas de uso por dia (últimos 7 dias)
        usage_by_day = []
        for i in range(7):
            date = datetime.utcnow() - timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            count = UsageLog.query.filter(
                UsageLog.company_id == company_id,
                UsageLog.created_at.like(f'{date_str}%')
            ).count()
            usage_by_day.append({
                'date': date_str,
                'count': count
            })
        
        # Top 5 usuários mais ativos
        top_users = db.session.query(
            User.name,
            db.func.count(UsageLog.id).label('activity_count')
        ).join(UsageLog, User.id == UsageLog.user_id)\
         .filter(UsageLog.company_id == company_id)\
         .filter(UsageLog.created_at >= thirty_days_ago.isoformat())\
         .group_by(User.id, User.name)\
         .order_by(db.func.count(UsageLog.id).desc())\
         .limit(5).all()
        
        return jsonify({
            'overview': {
                'total_users': total_users,
                'total_rundowns': total_rundowns,
                'active_rundowns': active_rundowns,
                'recent_usage': recent_usage,
                'plan_limits': {
                    'max_users': company.plan.max_members if company.plan else 0,
                    'max_rundowns': company.plan.max_rundowns if company.plan else 0,
                    'current_users': limits.current_members,
                    'current_rundowns': limits.current_rundowns
                }
            },
            'live_rundowns': live_rundowns,
            'usage_trend': usage_by_day,
            'top_users': [{'name': user[0], 'activity': user[1]} for user in top_users],
            'company_info': {
                'name': company.name,
                'plan': company.plan.name if company.plan else 'N/A',
                'status': company.status
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard Operador - Performance dos rundowns
@analytics_bp.route('/operator/dashboard', methods=['GET'])
@jwt_required(permission='operate')
def get_operator_dashboard():
    try:
        user_id = g.current_user.id
        company_id = g.current_user.company_id
        
        # Rundowns operados pelo usuário (últimos 30 dias)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Atividade do operador
        operator_activity = UsageLog.query.filter(
            UsageLog.user_id == user_id,
            UsageLog.action.in_(['start_rundown', 'next_item', 'stop_rundown']),
            UsageLog.created_at >= thirty_days_ago.isoformat()
        ).count()
        
        # Rundowns operados
        operated_rundowns = db.session.query(
            Rundown.name,
            db.func.count(UsageLog.id).label('operations')
        ).join(UsageLog, Rundown.id == UsageLog.resource_id)\
         .filter(UsageLog.user_id == user_id)\
         .filter(UsageLog.action == 'start_rundown')\
         .filter(UsageLog.created_at >= thirty_days_ago.isoformat())\
         .group_by(Rundown.id, Rundown.name)\
         .order_by(db.func.count(UsageLog.id).desc())\
         .limit(5).all()
        
        # Tempo médio de operação por rundown
        avg_operation_time = db.session.query(
            db.func.avg(
                db.func.cast(UsageLog.metadata_json, db.Text)
            )
        ).filter(
            UsageLog.user_id == user_id,
            UsageLog.action == 'rundown_duration',
            UsageLog.created_at >= thirty_days_ago.isoformat()
        ).scalar() or 0
        
        # Eficiência (operações por dia)
        efficiency_by_day = []
        for i in range(7):
            date = datetime.utcnow() - timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            count = UsageLog.query.filter(
                UsageLog.user_id == user_id,
                UsageLog.created_at.like(f'{date_str}%')
            ).count()
            efficiency_by_day.append({
                'date': date_str,
                'operations': count
            })
        
        return jsonify({
            'overview': {
                'total_operations': operator_activity,
                'operated_rundowns': len(operated_rundowns),
                'avg_operation_time': float(avg_operation_time) if avg_operation_time else 0,
                'efficiency_score': min(100, (operator_activity / 30) * 10)  # Score baseado em atividade
            },
            'top_rundowns': [{'name': rundown[0], 'operations': rundown[1]} for rundown in operated_rundowns],
            'efficiency_trend': efficiency_by_day,
            'user_info': {
                'name': g.current_user.name,
                'role': g.current_user.role.value
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard Apresentador - Performance pessoal
@analytics_bp.route('/presenter/dashboard', methods=['GET'])
@jwt_required(permission='present')
def get_presenter_dashboard():
    try:
        user_id = g.current_user.id
        
        # Atividade do apresentador (últimos 30 dias)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Sessões de apresentação
        presentation_sessions = UsageLog.query.filter(
            UsageLog.user_id == user_id,
            UsageLog.action == 'presentation_start',
            UsageLog.created_at >= thirty_days_ago.isoformat()
        ).count()
        
        # Tempo total de apresentação
        total_presentation_time = db.session.query(
            db.func.sum(
                db.func.cast(UsageLog.metadata_json, db.Text)
            )
        ).filter(
            UsageLog.user_id == user_id,
            UsageLog.action == 'presentation_duration',
            UsageLog.created_at >= thirty_days_ago.isoformat()
        ).scalar() or 0
        
        # Rundowns apresentados
        presented_rundowns = db.session.query(
            Rundown.name,
            db.func.count(UsageLog.id).label('presentations')
        ).join(UsageLog, Rundown.id == UsageLog.resource_id)\
         .filter(UsageLog.user_id == user_id)\
         .filter(UsageLog.action == 'presentation_start')\
         .filter(UsageLog.created_at >= thirty_days_ago.isoformat())\
         .group_by(Rundown.id, Rundown.name)\
         .order_by(db.func.count(UsageLog.id).desc())\
         .limit(5).all()
        
        # Atividade por dia
        activity_by_day = []
        for i in range(7):
            date = datetime.utcnow() - timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')
            count = UsageLog.query.filter(
                UsageLog.user_id == user_id,
                UsageLog.action == 'presentation_start',
                UsageLog.created_at.like(f'{date_str}%')
            ).count()
            activity_by_day.append({
                'date': date_str,
                'presentations': count
            })
        
        # Metas pessoais (simuladas)
        personal_goals = {
            'target_sessions': 20,  # Meta de 20 sessões por mês
            'target_time': 40,      # Meta de 40 horas por mês
            'current_sessions': presentation_sessions,
            'current_time': float(total_presentation_time) if total_presentation_time else 0
        }
        
        return jsonify({
            'overview': {
                'total_sessions': presentation_sessions,
                'total_time': float(total_presentation_time) if total_presentation_time else 0,
                'presented_rundowns': len(presented_rundowns),
                'consistency_score': min(100, (presentation_sessions / 30) * 15)  # Score baseado em consistência
            },
            'top_rundowns': [{'name': rundown[0], 'presentations': rundown[1]} for rundown in presented_rundowns],
            'activity_trend': activity_by_day,
            'personal_goals': personal_goals,
            'user_info': {
                'name': g.current_user.name,
                'role': g.current_user.role.value
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Relatórios detalhados
@analytics_bp.route('/reports/usage', methods=['GET'])
@jwt_required()
def get_usage_report():
    try:
        company_id = g.current_user.company_id
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        if not start_date or not end_date:
            return jsonify({'error': 'start_date e end_date são obrigatórios'}), 400
        
        # Relatório de uso por usuário
        usage_by_user = db.session.query(
            User.name,
            User.role,
            db.func.count(UsageLog.id).label('total_actions'),
            db.func.count(db.distinct(UsageLog.resource_id)).label('unique_resources')
        ).join(UsageLog, User.id == UsageLog.user_id)\
         .filter(UsageLog.company_id == company_id)\
         .filter(UsageLog.created_at >= start_date)\
         .filter(UsageLog.created_at <= end_date)\
         .group_by(User.id, User.name, User.role)\
         .order_by(db.func.count(UsageLog.id).desc()).all()
        
        # Relatório de uso por ação
        usage_by_action = db.session.query(
            UsageLog.action,
            db.func.count(UsageLog.id).label('count')
        ).filter(UsageLog.company_id == company_id)\
         .filter(UsageLog.created_at >= start_date)\
         .filter(UsageLog.created_at <= end_date)\
         .group_by(UsageLog.action)\
         .order_by(db.func.count(UsageLog.id).desc()).all()
        
        return jsonify({
            'period': {'start': start_date, 'end': end_date},
            'usage_by_user': [
                {
                    'name': user[0],
                    'role': user[1].value,
                    'total_actions': user[2],
                    'unique_resources': user[3]
                } for user in usage_by_user
            ],
            'usage_by_action': [
                {'action': action[0], 'count': action[1]} for action in usage_by_action
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

