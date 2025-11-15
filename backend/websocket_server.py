from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
import json
import os

# Detecta se está em produção (Railway ou VPS/Docker)
IS_PRODUCTION = bool(
    os.getenv('RAILWAY_ENVIRONMENT') or 
    os.getenv('RAILWAY_ENVIRONMENT_NAME') or
    os.getenv('RAILWAY_PROJECT_ID') or 
    os.getenv('RAILWAY_SERVICE_NAME') or
    os.getenv('RAILWAY_SERVICE_ID') or
    os.getenv('FLASK_ENV') == 'production'  # VPS/Docker
)

# Configura origens permitidas para CORS do WebSocket
if IS_PRODUCTION:
    # Em produção (Railway ou VPS), permite qualquer origem
    # O Nginx/VPS gerencia segurança, então permitir todas as origens é seguro
    cors_allowed_origins = "*"
    print(f"🔧 WebSocket CORS: Permitindo qualquer origem em produção")
else:
    # Em desenvolvimento, lista específica de origens
    cors_allowed_origins = [
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001",
        "http://192.168.0.100:3000",
        "http://192.168.0.100:3001",
        "http://192.168.1.100:3000",
        "http://192.168.1.100:3001"
    ]
    print(f"🔧 WebSocket CORS: Permitindo origens locais em desenvolvimento")

# Inicializa o SocketIO (será importado no app.py)
socketio = SocketIO(cors_allowed_origins=cors_allowed_origins)

@socketio.on('connect')
def handle_connect():
    print(f'Cliente conectado: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Cliente desconectado: {request.sid}')

@socketio.on('join_rundown')
def handle_join_rundown(data):
    rundown_id = data.get('rundown_id')
    if rundown_id:
        join_room(f'rundown_{rundown_id}')
        print(f'Cliente {request.sid} entrou no rundown {rundown_id}')

@socketio.on('join_company')
def handle_join_company(data):
    company_id = data.get('company_id')
    if company_id:
        join_room(f'company_{company_id}')
        print(f'Cliente {request.sid} entrou na empresa {company_id}')

@socketio.on('leave_rundown')
def handle_leave_rundown(data):
    rundown_id = data.get('rundown_id')
    if rundown_id:
        leave_room(f'rundown_{rundown_id}')
        print(f'Cliente {request.sid} saiu do rundown {rundown_id}')

@socketio.on('rundown_updated')
def handle_rundown_updated(data):
    rundown_id = data.get('rundown_id')
    changes = data.get('changes', {})
    
    print(f'📡 WebSocket: Recebida atualização de rundown {rundown_id}: {changes}')
    
    if rundown_id:
        # Envia para todos os clientes no mesmo rundown (incluindo o remetente para garantir sincronização)
        emit('rundown_updated', {
            'rundown_id': rundown_id,
            'changes': changes
        }, room=f'rundown_{rundown_id}', include_self=True)
        print(f'✅ WebSocket: Atualização enviada para sala rundown_{rundown_id}')

@socketio.on('item_reordered')
def handle_item_reordered(data):
    rundown_id = data.get('rundown_id')
    folder_index = data.get('folder_index')
    new_order = data.get('new_order')
    
    if rundown_id:
        # Envia para todos os clientes no mesmo rundown
        emit('item_reordered', {
            'rundown_id': rundown_id,
            'folder_index': folder_index,
            'new_order': new_order
        }, room=f'rundown_{rundown_id}', include_self=False)

@socketio.on('folder_reordered')
def handle_folder_reordered(data):
    rundown_id = data.get('rundown_id')
    new_order = data.get('new_order')
    
    if rundown_id:
        # Envia para todos os clientes no mesmo rundown
        emit('folder_reordered', {
            'rundown_id': rundown_id,
            'new_order': new_order
        }, room=f'rundown_{rundown_id}', include_self=False)

def broadcast_rundown_update(rundown_id, changes):
    """Função para enviar atualizações do rundown via WebSocket"""
    socketio.emit('rundown_updated', {
        'rundown_id': rundown_id,
        'changes': changes
    }, room=f'rundown_{rundown_id}')

def broadcast_item_reorder(rundown_id, folder_index, new_order):
    """Função para enviar reordenação de itens via WebSocket"""
    socketio.emit('item_reordered', {
        'rundown_id': rundown_id,
        'folder_index': folder_index,
        'new_order': new_order
    }, room=f'rundown_{rundown_id}')

def broadcast_folder_reorder(rundown_id, new_order):
    """Função para enviar reordenação de pastas via WebSocket"""
    socketio.emit('folder_reordered', {
        'rundown_id': rundown_id,
        'new_order': new_order
    }, room=f'rundown_{rundown_id}')

def broadcast_rundown_list_changed():
    """Notifica clientes que a lista de rundowns mudou (criação/remoção)"""
    socketio.emit('rundown_list_changed', { 'changed': True })

@socketio.on('presenter_config_update')
def handle_presenter_config_update(config):
    """
    Recebe atualizações de configuração do apresentador do operador
    e transmite para todos os clientes conectados ao mesmo rundown
    """
    print(f'📡 WebSocket: Recebendo configuração do apresentador: {config}')
    
    # Transmite para todos os clientes (incluindo o remetente para garantir sincronização)
    emit('presenter_config_update', config, broadcast=True, include_self=True)
    print(f'✅ WebSocket: Configuração transmitida para todos os clientes conectados')
