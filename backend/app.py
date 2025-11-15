


from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_compress import Compress
from models import db
import sys
sys.path.insert(0, 'utils')
from cors_config import enable_cors
from websocket_server import socketio
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env (sobrescreve variáveis do sistema)
load_dotenv(override=True)

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
# Em produção (Railway/VPS): configure DATABASE_URL nas variáveis de ambiente
# Em desenvolvimento local: deixe DATABASE_URL vazio para usar SQLite

# Detecta se está em produção (Railway)
IS_PRODUCTION = bool(
    os.getenv('RAILWAY_ENVIRONMENT') or 
    os.getenv('RAILWAY_ENVIRONMENT_NAME') or
    os.getenv('RAILWAY_PROJECT_ID') or 
    os.getenv('RAILWAY_SERVICE_NAME') or
    os.getenv('RAILWAY_SERVICE_ID')
)

# Railway pode fornecer DATABASE_URL ou variáveis individuais
DATABASE_URL = os.getenv('DATABASE_URL')

# DEBUG: Mostra informações sobre o ambiente
if IS_PRODUCTION:
    print(f"🔍 Ambiente detectado: PRODUÇÃO (Railway)")
    print(f"   RAILWAY_ENVIRONMENT: {os.getenv('RAILWAY_ENVIRONMENT', 'NÃO')}")
    print(f"   RAILWAY_ENVIRONMENT_NAME: {os.getenv('RAILWAY_ENVIRONMENT_NAME', 'NÃO')}")
    print(f"   RAILWAY_PROJECT_ID: {os.getenv('RAILWAY_PROJECT_ID', 'NÃO')}")
    print(f"   RAILWAY_SERVICE_NAME: {os.getenv('RAILWAY_SERVICE_NAME', 'NÃO')}")
else:
    print(f"🔍 Ambiente detectado: DESENVOLVIMENTO LOCAL")

# Se DATABASE_URL contém localhost, SEMPRE rejeita em produção
# (mesmo que IS_PRODUCTION não detecte, se estiver no Railway, localhost não funciona)
if DATABASE_URL:
    if 'localhost' in DATABASE_URL or '127.0.0.1' in DATABASE_URL:
        if IS_PRODUCTION:
            print(f"❌ ERRO CRÍTICO: DATABASE_URL contém 'localhost' mas está em produção!")
            print(f"   Ignorando URL incorreta: {DATABASE_URL[:60]}...")
            print(f"   Tentando outras fontes...")
            DATABASE_URL = None  # Força tentar outras fontes
        else:
            # Em desenvolvimento local, localhost é OK
            print(f"ℹ️  Usando localhost (desenvolvimento local)")

# Se não tiver DATABASE_URL válida, tenta construir a partir de variáveis individuais do Railway
if not DATABASE_URL:
    print(f"🔍 DATABASE_URL não encontrada, tentando variáveis individuais...")
    pg_host = os.getenv('PGHOST')
    pg_port = os.getenv('PGPORT', '5432')
    pg_user = os.getenv('PGUSER')
    pg_password = os.getenv('PGPASSWORD')
    pg_database = os.getenv('PGDATABASE')
    
    print(f"   PGHOST: {pg_host or 'NÃO'}")
    print(f"   PGUSER: {pg_user or 'NÃO'}")
    print(f"   PGPASSWORD: {'SIM' if pg_password else 'NÃO'}")
    print(f"   PGDATABASE: {pg_database or 'NÃO'}")
    
    if all([pg_host, pg_user, pg_password, pg_database]):
        DATABASE_URL = f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}"
        print(f"✅ Construído DATABASE_URL a partir de variáveis individuais do Railway")
    elif IS_PRODUCTION:
        # Em produção sem banco configurado, mostra erro claro
        print(f"")
        print(f"❌ ERRO CRÍTICO: Não foi possível configurar conexão com banco de dados!")
        print(f"   Em produção (Railway), você precisa configurar:")
        print(f"   1. Delete a variável DATABASE_URL se ela contém 'localhost'")
        print(f"   2. Adicione: DATABASE_URL=${{{{Postgres.DATABASE_URL}}}}")
        print(f"   (Substitua 'Postgres' pelo nome exato do seu serviço PostgreSQL)")
        print(f"   3. Ou configure as variáveis: PGHOST, PGUSER, PGPASSWORD, PGDATABASE")
        print(f"")
        print(f"   Variáveis encontradas:")
        print(f"   - DATABASE_URL original: {'SIM' if os.getenv('DATABASE_URL') else 'NÃO'} (mas contém localhost - foi rejeitada)")
        print(f"   - PGHOST: {pg_host or 'NÃO'}")
        print(f"   - PGUSER: {pg_user or 'NÃO'}")
        print(f"   - PGPASSWORD: {'SIM' if pg_password else 'NÃO'}")
        print(f"   - PGDATABASE: {pg_database or 'NÃO'}")
        print(f"")
        print(f"   A aplicação não pode iniciar sem banco de dados em produção!")
        raise ValueError("DATABASE_URL não configurada corretamente para produção")

if DATABASE_URL:
    # Verificação final de segurança: NUNCA usar localhost em produção
    if IS_PRODUCTION and ('localhost' in DATABASE_URL or '127.0.0.1' in DATABASE_URL):
        print(f"")
        print(f"❌ ERRO FATAL: Tentando usar localhost em produção!")
        print(f"   URL rejeitada: {DATABASE_URL[:60]}...")
        print(f"   Isso não funcionará no Railway!")
        raise ValueError("DATABASE_URL contém localhost em produção - não permitido!")
    
    # PostgreSQL configurado (produção ou Docker)
    # Mostra apenas host:port/database para segurança
    try:
        if '@' in DATABASE_URL:
            db_info = DATABASE_URL.split('@')[1]
            print(f"✅ Usando PostgreSQL: {db_info}")
        else:
            print(f"✅ Usando PostgreSQL: configurado")
    except:
        print(f"✅ Usando PostgreSQL: configurado")
    
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }
else:
    # SQLite para desenvolvimento local
    if IS_PRODUCTION:
        print("❌ ERRO: Tentando usar SQLite em produção!")
        print("   Configure DATABASE_URL corretamente no Railway")
        raise ValueError("SQLite não pode ser usado em produção")
    print("📦 Usando SQLite (desenvolvimento local)")
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
    print("OK: Seguranca e rate limiting ativados")
except Exception as e:
    print(f"ERRO: Erro ao inicializar seguranca: {e}")



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




# Rotas públicas que não precisam verificar pagamento
PUBLIC_ROUTES = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify-token',
    '/api/auth/accept-invite',
    '/api/auth/verify',
    '/',
]

# Verificar pagamento antes de todas as rotas protegidas
@app.before_request
def check_payment():
    # Ignora rotas públicas
    if request.path in PUBLIC_ROUTES or request.path.startswith('/api/auth/'):
        return None
    
    # Ignora OPTIONS (preflight CORS)
    if request.method == 'OPTIONS':
        return None
    
    # Verifica se tem token (rota protegida)
    if 'Authorization' in request.headers:
        try:
            from auth_utils import jwt_required, SECRET_KEY
            import jwt
            from models import User, Company
            
            auth_header = request.headers['Authorization']
            token = auth_header.split(' ')[1] if ' ' in auth_header else None
            
            if token:
                # Decodifica token
                payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
                user_id = payload.get('user_id')
                user = User.query.get(user_id)
                
                if user and user.company_id:
                    company = Company.query.get(user.company_id)
                    if company and not company.payment_verified:
                        # Bloqueia acesso se pagamento não verificado
                        response = jsonify({
                            'error': 'Acesso bloqueado',
                            'message': 'Pagamento não verificado. Entre em contato com o administrador para liberar o acesso.',
                            'payment_required': True
                        })
                        # Adiciona headers CORS mesmo em erro
                        response.headers.add('Access-Control-Allow-Origin', '*')
                        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
                        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                        return response, 403
        except Exception:
            # Se der erro na verificação, deixa passar (será tratado pelo jwt_required)
            pass
    
    return None

# Responder preflight CORS globalmente para evitar bloqueio por autenticação em rotas protegidas
@app.before_request
def handle_cors_preflight():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        response.headers.add('Access-Control-Max-Age', '600')
        return response, 200

# Headers de segurança e CORS
@app.after_request
def add_security_headers(response):
    """Adiciona headers de segurança HTTP e CORS"""
    # CORS headers (garantir que sempre estejam presentes)
    if 'Access-Control-Allow-Origin' not in response.headers:
        response.headers['Access-Control-Allow-Origin'] = '*'
    if 'Access-Control-Allow-Methods' not in response.headers:
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    if 'Access-Control-Allow-Headers' not in response.headers:
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    
    # Headers de segurança HTTP
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
    # Porta configurável via variável de ambiente
    port = int(os.getenv('PORT', 5001))
    debug_mode = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=port)
