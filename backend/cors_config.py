# Adiciona CORS ao Flask
from flask_cors import CORS

def enable_cors(app):
    # Aplica CORS para todas as rotas, pois o frontend testa conectividade na raiz '/'
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://192.168.0.100:3000",
        "http://192.168.0.100:3001",
        "http://192.168.1.100:3000",
        "http://192.168.1.100:3001",
    ]

    CORS(
        app,
        resources={r"/*": {"origins": allowed_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        max_age=600,
    )
