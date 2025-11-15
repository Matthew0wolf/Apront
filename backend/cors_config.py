# Adiciona CORS ao Flask
from flask_cors import CORS

def enable_cors(app):
    # Aplica CORS para todas as rotas, pois o frontend testa conectividade na raiz '/'
    # Em desenvolvimento, permite qualquer origem (localhost, 127.0.0.1, ou IPs da rede local)
    # Isso resolve problemas quando o IP muda ou quando acessa de outro dispositivo
    import os
    
    # Em desenvolvimento, permite qualquer origem para facilitar testes
    # Em produção, deve-se restringir aos domínios específicos
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    if is_production:
        # Em produção, lista específica de origens permitidas
        # Pode ser configurado via variável de ambiente CORS_ORIGINS (separado por vírgula)
        cors_env = os.getenv('CORS_ORIGINS', '')
        if cors_env:
            allowed_origins = [origin.strip() for origin in cors_env.split(',') if origin.strip()]
        else:
            allowed_origins = [
                "https://seu-dominio.com",
                # Adicione aqui os domínios de produção
            ]
    else:
        # Em desenvolvimento, permite qualquer origem (mais permissivo)
        allowed_origins = "*"
    
    # Configuração CORS mais explícita para garantir funcionamento
    cors_config = {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 600,
    }
    
    CORS(
        app,
        resources={r"/*": cors_config},
        **cors_config  # Aplica também globalmente
    )
