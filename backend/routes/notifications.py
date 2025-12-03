"""
Rotas para sistema de notificações
Sprint 7 - Notificações em tempo real e por email
"""

from flask import Blueprint, jsonify, request, g
from auth_utils import jwt_required
from models import db, Notification, NotificationPreferences, SystemEvent, User, Company
from datetime import datetime, timedelta
from email_utils import send_email
import json

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Lista notificações do usuário"""
    try:
        current_user = g.current_user
        
        # Filtros opcionais
        unread_only = request.args.get('unread', 'false').lower() == 'true'
        limit = request.args.get('limit', 50, type=int)
        
        query = Notification.query.filter_by(user_id=current_user.id)
        
        # Remover notificações expiradas
        now = datetime.now()
        expired = query.filter(Notification.expires_at < now).all()
        for notif in expired:
            db.session.delete(notif)
        db.session.commit()
        
        # Buscar notificações válidas
        query = Notification.query.filter_by(user_id=current_user.id)
        
        if unread_only:
            query = query.filter_by(read=False)
        
        notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
        
        result = []
        for n in notifications:
            result.append({
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'type': n.type,
                'category': n.category,
                'related_id': n.related_id,
                'read': n.read,
                'read_at': n.read_at.isoformat() if n.read_at else None,
                'created_at': n.created_at.isoformat(),
                'action_url': n.action_url
            })
        
        # Contar não lidas
        unread_count = Notification.query.filter_by(
            user_id=current_user.id,
            read=False
        ).count()
        
        return jsonify({
            'notifications': result,
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(notification_id):
    """Marca notificação como lida"""
    try:
        current_user = g.current_user
        notification = Notification.query.get_or_404(notification_id)
        
        # Verificar permissão
        if notification.user_id != current_user.id:
            return jsonify({'error': 'Sem permissão'}), 403
        
        notification.read = True
        notification.read_at = datetime.now()
        db.session.commit()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    """Marca todas as notificações como lidas"""
    try:
        current_user = g.current_user
        
        notifications = Notification.query.filter_by(
            user_id=current_user.id,
            read=False
        ).all()
        
        for n in notifications:
            n.read = True
            n.read_at = datetime.now()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'count': len(notifications)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Remove uma notificação"""
    try:
        current_user = g.current_user
        notification = Notification.query.get_or_404(notification_id)
        
        if notification.user_id != current_user.id:
            return jsonify({'error': 'Sem permissão'}), 403
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    """Obtém preferências de notificação do usuário"""
    try:
        current_user = g.current_user
        
        prefs = NotificationPreferences.query.filter_by(user_id=current_user.id).first()
        
        if not prefs:
            # Criar preferências padrão
            prefs = NotificationPreferences(user_id=current_user.id)
            db.session.add(prefs)
            db.session.commit()
        
        return jsonify({
            'email_enabled': prefs.email_enabled,
            'push_enabled': prefs.push_enabled,
            'in_app_enabled': prefs.in_app_enabled,
            'notify_rundown_started': prefs.notify_rundown_started,
            'notify_rundown_finished': prefs.notify_rundown_finished,
            'notify_team_invite': prefs.notify_team_invite,
            'notify_item_assigned': prefs.notify_item_assigned,
            'notify_trial_ending': prefs.notify_trial_ending,
            'notify_payment_due': prefs.notify_payment_due
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    """Atualiza preferências de notificação"""
    try:
        current_user = g.current_user
        data = request.get_json()
        
        prefs = NotificationPreferences.query.filter_by(user_id=current_user.id).first()
        
        if not prefs:
            prefs = NotificationPreferences(user_id=current_user.id)
            db.session.add(prefs)
        
        # Atualizar campos
        for field in ['email_enabled', 'push_enabled', 'in_app_enabled',
                     'notify_rundown_started', 'notify_rundown_finished',
                     'notify_team_invite', 'notify_item_assigned',
                     'notify_trial_ending', 'notify_payment_due']:
            if field in data:
                setattr(prefs, field, data[field])
        
        db.session.commit()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def create_notification(user_id, title, message, type='info', category=None, 
                       related_id=None, action_url=None, expires_in_days=30):
    """
    Helper function para criar notificações
    Pode ser chamada de qualquer rota
    """
    try:
        notification = Notification(
            user_id=user_id,
            company_id=User.query.get(user_id).company_id if User.query.get(user_id) else None,
            title=title,
            message=message,
            type=type,
            category=category,
            related_id=related_id,
            action_url=action_url,
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=expires_in_days) if expires_in_days else None
        )
        
        db.session.add(notification)
        db.session.commit()
        
        # Verificar se deve enviar email
        user = User.query.get(user_id)
        if user:
            prefs = NotificationPreferences.query.filter_by(user_id=user_id).first()
            
            # Se não tem preferências ou email está habilitado
            if not prefs or prefs.email_enabled:
                # Enviar email (async seria melhor, mas por enquanto assim)
                try:
                    send_notification_email(user.email, title, message, action_url)
                except:
                    pass  # Falhar silenciosamente se email não configurado
        
        return notification
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar notificação: {e}")
        return None


def send_notification_email(to_email, title, message, action_url=None):
    """Envia notificação por email"""
    subject = f"[Apront] {title}"
    
    html_body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #8B5CF6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">Apront</h1>
            </div>
            <div style="background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">{title}</h2>
                <p style="color: #666; line-height: 1.6;">{message}</p>
                
                {f'<a href="{action_url}" style="display: inline-block; background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Ver Detalhes</a>' if action_url else ''}
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Esta é uma notificação automática do sistema Apront.<br>
                    Para gerenciar suas preferências, acesse Configurações → Notificações.
                </p>
            </div>
        </body>
    </html>
    """
    
    try:
        send_email(to_email, subject, html_body)
    except Exception as e:
        print(f"Erro ao enviar email: {e}")


@notifications_bp.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    """Registra um evento do sistema (para auditoria)"""
    try:
        current_user = g.current_user
        data = request.get_json()
        
        event = SystemEvent(
            event_type=data['event_type'],
            user_id=current_user.id,
            company_id=current_user.company_id,
            resource_type=data.get('resource_type'),
            resource_id=data.get('resource_id'),
            metadata_json=json.dumps(data.get('metadata', {})),
            created_at=datetime.now(),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:200]
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({'success': True, 'event_id': event.id}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@notifications_bp.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    """Lista eventos do sistema (auditoria) - Filtrado por empresa (SaaS)"""
    try:
        current_user = g.current_user
        
        # CRÍTICO: SaaS - Todos os usuários veem apenas eventos da própria empresa
        query = SystemEvent.query.filter_by(company_id=current_user.company_id)
        
        limit = request.args.get('limit', 100, type=int)
        event_type = request.args.get('event_type')
        
        if event_type:
            query = query.filter_by(event_type=event_type)
        
        events = query.order_by(SystemEvent.created_at.desc()).limit(limit).all()
        
        result = []
        # Buscar nome da empresa uma vez para todos os eventos
        company = Company.query.get(current_user.company_id) if current_user.company_id else None
        company_name = company.name if company else 'Sistema'
        
        for e in events:
            result.append({
                'id': e.id,
                'event_type': e.event_type,
                'user_id': e.user_id,
                'user_name': e.user.name if e.user else 'Sistema',
                'user_role': e.user.role.value if e.user and e.user.role else None,
                'user_avatar': e.user.avatar if e.user and e.user.avatar else None,
                'company_name': company_name,
                'resource_type': e.resource_type,
                'resource_id': e.resource_id,
                'metadata': json.loads(e.metadata_json) if e.metadata_json else {},
                'created_at': e.created_at.isoformat(),
                'ip_address': e.ip_address
            })
        
        return jsonify({'events': result}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

