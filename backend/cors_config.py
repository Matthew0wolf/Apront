# Adiciona CORS ao Flask
from flask_cors import CORS

def enable_cors(app):
    # Aplica CORS para todas as rotas, pois o frontend testa conectividade na raiz '/'
    # Em desenvolvimento, permite qualquer origem (localhost, 127.0.0.1, ou IPs da rede local)
    # Isso resolve problemas quando o IP muda ou quando acessa de outro dispositivo
    import os
    
    # Detecta se está em produção (mesma lógica do app.py)
    is_production = bool(
        os.getenv('RAILWAY_ENVIRONMENT') or 
        os.getenv('RAILWAY_ENVIRONMENT_NAME') or
        os.getenv('RAILWAY_PROJECT_ID') or 
        os.getenv('RAILWAY_SERVICE_NAME') or
        os.getenv('RAILWAY_SERVICE_ID') or
        os.getenv('FLASK_ENV') == 'production'
    )
    
    # SEMPRE permite qualquer origem (Railway gerencia segurança)
    # Isso resolve problemas de CORS em produção
    allowed_origins = "*"
    
    print(f"🔧 Configurando CORS:")
    print(f"   Ambiente: {'PRODUÇÃO' if is_production else 'DESENVOLVIMENTO'}")
    print(f"   Origens permitidas: {allowed_origins}")
    
    # Configuração CORS mais explícita para garantir funcionamento
    cors_config = {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 600,
    }
    
    # Aplica CORS globalmente para TODAS as rotas
    # Usando automatic_options=True para garantir que OPTIONS seja tratado automaticamente
    CORS(
        app,
        resources={r"/*": cors_config},
        automatic_options=True,  # Trata OPTIONS automaticamente
        supports_credentials=False,  # Não usar credentials com wildcard
        **cors_config  # Aplica também globalmente
    )
    
    print(f"✅ CORS configurado com sucesso!")
    print(f"   Flask-CORS habilitado com origins: {allowed_origins}")
    print(f"   Headers manuais também serão adicionados no after_request")
