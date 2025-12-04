

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship
from sqlalchemy import Enum
import enum
db = SQLAlchemy()

# Enum para papéis de usuário
class UserRole(enum.Enum):
    admin = 'admin'
    operator = 'operator'
    presenter = 'presenter'

# Plano SaaS
class Plan(db.Model):
    __tablename__ = 'plans'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    max_members = db.Column(db.Integer, nullable=False)
    max_rundowns = db.Column(db.Integer, nullable=False, default=10)
    max_storage_gb = db.Column(db.Integer, nullable=False, default=1)
    features = db.Column(db.Text)  # JSON string with feature flags
    # Features incluem: { "has_teleprompter": true, "has_rehearsal_mode": true, "has_analytics": true }
    billing_cycle = db.Column(db.String(20), default='monthly')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    updated_at = db.Column(db.String(50))  # Aumentado para suportar ISO format

# Empresa/Organização
class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    domain = db.Column(db.String(120))  # Para verificação de domínio
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'))
    plan = relationship('Plan')
    created_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    updated_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    status = db.Column(db.String(30), default='active')  # active, suspended, cancelled
    trial_ends_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    payment_verified = db.Column(db.Boolean, default=False)  # Pagamento verificado (acesso liberado)
    members = relationship('User', backref='company', cascade='all, delete-orphan')
    subscriptions = relationship('Subscription', backref='company', cascade='all, delete-orphan')

# Assinatura da empresa
class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    plan_id = db.Column(db.Integer, db.ForeignKey('plans.id'))
    plan = relationship('Plan')
    status = db.Column(db.String(30), default='active')  # active, past_due, cancelled, trialing
    payment_method = db.Column(db.String(50))  # credit_card, bank_transfer, etc
    payment_date = db.Column(db.String(50))  # Aumentado para suportar ISO format
    next_billing_date = db.Column(db.String(50))  # Aumentado para suportar ISO format
    amount_paid = db.Column(db.Float, default=0.0)
    external_subscription_id = db.Column(db.String(100))  # ID do gateway de pagamento
    created_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    updated_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    cancelled_at = db.Column(db.String(50))  # Aumentado para suportar ISO format

# Usuário do sistema
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)  # Aumentado para suportar scrypt (até ~130 caracteres)
    role = db.Column(Enum(UserRole), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    joined_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    last_active = db.Column(db.String(50))  # Aumentado para suportar ISO format
    status = db.Column(db.String(30), default='active')
    avatar = db.Column(db.String(100))  # Nome do arquivo de avatar
    updated_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    
    # Permissões modulares
    can_operate = db.Column(db.Boolean, default=False)  # Pode acessar operador
    can_present = db.Column(db.Boolean, default=False)  # Pode acessar apresentador
    
    def has_permission(self, permission):
        """Verifica se o usuário tem uma permissão específica"""
        if self.role.value == 'admin':
            return True  # Admin tem todas as permissões
        
        if permission == 'operate':
            return self.can_operate
        elif permission == 'present':
            return self.can_present
        
        return False
    
    def get_effective_permissions(self):
        """Retorna as permissões efetivas do usuário"""
        if self.role.value == 'admin':
            return {
                'operate': True,
                'present': True,
                'manage_team': True,
                'manage_settings': True,
                'manage_plans': True
            }
        
        return {
            'operate': self.can_operate,
            'present': self.can_present,
            'manage_team': False,
            'manage_settings': False,
            'manage_plans': False
        }

# Convite de usuário
class Invite(db.Model):
    __tablename__ = 'invites'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    role = db.Column(Enum(UserRole), nullable=False)
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.String(30), default='pending')
    sent_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    token = db.Column(db.String(64), unique=True, nullable=False)

# Token de verificação de email
class VerificationToken(db.Model):
    __tablename__ = 'verification_tokens'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    token = db.Column(db.String(8), nullable=False)  # 6-8 dígitos
    expires_at = db.Column(db.String(50), nullable=False)  # Aumentado para suportar ISO format
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.String(50), nullable=False)  # Aumentado para suportar ISO format


class TeamMember(db.Model):
    __tablename__ = 'team_members'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(30), nullable=False)
    status = db.Column(db.String(30), nullable=False)
    joined_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    last_active = db.Column(db.String(50))  # Aumentado para suportar ISO format
    avatar = db.Column(db.String(10))

class Rundown(db.Model):
    __tablename__ = 'rundowns'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(50))
    created = db.Column(db.String(20))
    last_modified = db.Column(db.String(50))  # Aumentado para suportar ISO format
    status = db.Column(db.String(30))
    duration = db.Column(db.String(20))
    team_members = db.Column(db.Integer)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)  # CRÍTICO: Isolamento por empresa
    folders = db.relationship('Folder', backref='rundown', cascade='all, delete-orphan')
    members = db.relationship('RundownMember', backref='rundown', cascade='all, delete-orphan')
    
    # Campos para estado global do timer (armazenado no banco para sincronização)
    # NOTA: Estes campos são opcionais - se não existirem no banco, o código usará fallback
    timer_started_at = db.Column(db.String(50), nullable=True)  # Timestamp ISO de quando o timer foi iniciado
    timer_elapsed_base = db.Column(db.Integer, default=0, nullable=True)  # Tempo base em segundos (quando pausado)
    is_timer_running = db.Column(db.Boolean, default=False, nullable=True)  # Se o timer está rodando
    current_item_index_json = db.Column(db.Text, nullable=True)  # JSON: {"folderIndex": 0, "itemIndex": 0}


class RundownMember(db.Model):
    __tablename__ = 'rundown_members'
    id = db.Column(db.Integer, primary_key=True)
    rundown_id = db.Column(db.Integer, db.ForeignKey('rundowns.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # Opcional: role no rundown (operator/presenter)
    role = db.Column(db.String(30))

class Folder(db.Model):
    __tablename__ = 'folders'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    ordem = db.Column(db.Integer)
    rundown_id = db.Column(db.Integer, db.ForeignKey('rundowns.id'), nullable=False)
    items = db.relationship('Item', backref='folder', cascade='all, delete-orphan')

class Item(db.Model):
    __tablename__ = 'items'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    duration = db.Column(db.Integer)
    description = db.Column(db.Text)
    type = db.Column(db.String(30))
    status = db.Column(db.String(30))
    icon_type = db.Column(db.String(30))
    icon_data = db.Column(db.String(60))
    color = db.Column(db.String(20))
    urgency = db.Column(db.String(20))
    reminder = db.Column(db.String(120))
    ordem = db.Column(db.Integer)
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=False)
    
    # Campos para Teleprompter/Script
    script = db.Column(db.Text)  # Script completo que o apresentador lerá
    talking_points = db.Column(db.Text)  # JSON array de pontos-chave
    pronunciation_guide = db.Column(db.Text)  # Guia de pronúncia
    presenter_notes = db.Column(db.Text)  # Notas privadas do apresentador
    
    # Relacionamento com ensaios
    rehearsals = db.relationship('Rehearsal', backref='item', cascade='all, delete-orphan')

# Log de uso para controle de limites
class UsageLog(db.Model):
    __tablename__ = 'usage_logs'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(50), nullable=False)  # create_rundown, invite_user, etc
    resource_type = db.Column(db.String(50))  # rundown, user, storage
    resource_id = db.Column(db.Integer)
    metadata_json = db.Column(db.Text)  # JSON com dados adicionais
    created_at = db.Column(db.String(50), nullable=False)  # Aumentado para suportar ISO format

# Configurações de limite por empresa
class CompanyLimits(db.Model):
    __tablename__ = 'company_limits'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), unique=True)
    current_members = db.Column(db.Integer, default=0)
    current_rundowns = db.Column(db.Integer, default=0)
    current_storage_gb = db.Column(db.Float, default=0.0)
    last_updated = db.Column(db.String(50))  # Aumentado para suportar ISO format


# Templates marketplace
class Template(db.Model):
    __tablename__ = 'templates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    author = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    tags_json = db.Column(db.Text)  # JSON array de tags
    duration = db.Column(db.String(20))
    items_count = db.Column(db.Integer, default=0)
    downloads = db.Column(db.Integer, default=0)
    views = db.Column(db.Integer, default=0)
    likes_cached = db.Column(db.Integer, default=0)  # cache opcional
    rating_cached = db.Column(db.Float, default=0.0)  # média de 0-5
    rating_count = db.Column(db.Integer, default=0)
    structure_json = db.Column(db.Text)  # JSON da estrutura do template
    created_at = db.Column(db.String(50))  # Aumentado para suportar ISO format


class TemplateLike(db.Model):
    __tablename__ = 'template_likes'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('templates.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # Garantia de unicidade lógica (enforce via app)


class TemplateRating(db.Model):
    __tablename__ = 'template_ratings'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('templates.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    stars = db.Column(db.Integer, nullable=False)  # 1-5
    created_at = db.Column(db.String(50))  # Aumentado para suportar ISO format
    updated_at = db.Column(db.String(50))  # Aumentado para suportar ISO format


# Ensaios/Treinos do Apresentador
class Rehearsal(db.Model):
    __tablename__ = 'rehearsals'
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    duration = db.Column(db.Integer)  # Duração real em segundos
    planned_duration = db.Column(db.Integer)  # Duração planejada em segundos
    difference = db.Column(db.Integer)  # Diferença em segundos (positivo = over, negativo = under)
    recorded_at = db.Column(db.String(20), nullable=False)
    notes = db.Column(db.Text)  # Notas sobre o ensaio
    
    # Relacionamentos
    user = db.relationship('User', backref='rehearsals')


# Notificações do sistema
class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(30), default='info')  # info, success, warning, error
    category = db.Column(db.String(50))  # rundown, team, system, payment
    related_id = db.Column(db.Integer)  # ID do recurso relacionado (rundown_id, user_id, etc)
    read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False)
    expires_at = db.Column(db.DateTime)  # Notificação expira e é removida
    action_url = db.Column(db.String(200))  # URL para ação (ex: /project/123)
    
    # Relacionamentos
    user = db.relationship('User', backref='notifications')


# Preferências de notificação do usuário
class NotificationPreferences(db.Model):
    __tablename__ = 'notification_preferences'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    
    # Canais de notificação
    email_enabled = db.Column(db.Boolean, default=True)
    push_enabled = db.Column(db.Boolean, default=True)
    in_app_enabled = db.Column(db.Boolean, default=True)
    
    # Tipos de notificação
    notify_rundown_started = db.Column(db.Boolean, default=True)
    notify_rundown_finished = db.Column(db.Boolean, default=True)
    notify_team_invite = db.Column(db.Boolean, default=True)
    notify_item_assigned = db.Column(db.Boolean, default=True)
    notify_trial_ending = db.Column(db.Boolean, default=True)
    notify_payment_due = db.Column(db.Boolean, default=True)
    
    # Relacionamentos
    user = db.relationship('User', backref='notification_preferences')


# Log de eventos do sistema
class SystemEvent(db.Model):
    __tablename__ = 'system_events'
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)  # rundown.started, user.invited, etc
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'))
    resource_type = db.Column(db.String(50))  # rundown, user, item, etc
    resource_id = db.Column(db.Integer)
    metadata_json = db.Column(db.Text)  # JSON com dados adicionais
    created_at = db.Column(db.DateTime, nullable=False)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(200))
    
    # Relacionamentos
    user = db.relationship('User', backref='system_events')
