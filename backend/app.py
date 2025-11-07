


from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_compress import Compress
from models import db
import sys
sys.path.insert(0, 'utils')
from cors_config import enable_cors
from websocket_server import socketio
import os

from routes.team import team_bp
from routes.rundown import rundown_bp
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.plans import plans_bp
from routes.user import user_bp
from routes.sync import sync_bp
from routes.analytics import analytics_bp
from routes.templates import templates_bp
from routes.scripts import scripts_bp
from routes.export import export_bp
from routes.history import history_bp
from routes.notifications import notifications_bp


app = Flask(__name__)

# Configuração de Banco de Dados
# Tenta usar PostgreSQL (via variável de ambiente), senão usa SQLite
DATABASE_URL = os.getenv('DATABASE_URL')

# FORÇAR SQLite para desenvolvimento local (comentar linha abaixo para usar PostgreSQL)
DATABASE_URL = None  # <<< DESCOMENTE PARA USAR POSTGRESQL

if DATABASE_URL:
    # PostgreSQL configurado (produção ou Docker)
    print(f"🐘 Usando PostgreSQL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'configurado'}")
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }
else:
    # SQLite para desenvolvimento local
    print("💾 Usando SQLite (desenvolvimento local)")
    sqlite_path = os.path.join(os.path.dirname(__file__), 'rundowns.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{sqlite_path}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurações adicionais
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')

# Configurar compressão de respostas (melhora performance em 60-80%)
app.config['COMPRESS_MIMETYPES'] = ['text/html', 'text/css', 'text/xml', 'application/json', 'application/javascript']
app.config['COMPRESS_LEVEL'] = 6  # 1-9, 6 é bom balanceamento
app.config['COMPRESS_MIN_SIZE'] = 500  # Só comprime se > 500 bytes

# Inicializar extensões
db.init_app(app)
enable_cors(app)
Compress(app)  # Habilita compressão gzip automaticamente

# Inicializa o SocketIO com a aplicação Flask
socketio.init_app(app)

# Inicializar segurança
from rate_limiter import init_rate_limiting
from security_logger import init_security_logging

try:
    init_rate_limiting(app)
    init_security_logging(app)
    print("✅ Segurança e rate limiting ativados")
except Exception as e:
    print(f"⚠️  Erro ao inicializar segurança: {e}")



# Register blueprints
app.register_blueprint(team_bp)
app.register_blueprint(rundown_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(plans_bp)
app.register_blueprint(user_bp)
app.register_blueprint(sync_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(templates_bp)
app.register_blueprint(scripts_bp)
app.register_blueprint(export_bp)
app.register_blueprint(history_bp)
app.register_blueprint(notifications_bp)




# Responder preflight CORS globalmente para evitar bloqueio por autenticação em rotas protegidas
@app.before_request
def handle_cors_preflight():
    if request.method == 'OPTIONS':
        # Flask-CORS adicionará os headers necessários no after_request
        return ('', 200)

# Headers de segurança
@app.after_request
def add_security_headers(response):
    """Adiciona headers de segurança HTTP"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response

# Rota de teste na raiz
@app.route('/')
def index():
    return {'message': 'API Flask rodando! Use /api/rundowns para acessar os dados.'}



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    # Usa socketio.run() em vez de app.run() para ativar o servidor WebSocket
    # host='0.0.0.0' permite acesso de outros IPs da rede
    socketio.run(app, debug=True, host='0.0.0.0', port=5001)
