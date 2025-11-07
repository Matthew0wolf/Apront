from flask import Blueprint, request, jsonify, g
from models import db, User
from auth_utils import jwt_required
from werkzeug.security import check_password_hash, generate_password_hash
import base64
import os
import uuid
from datetime import datetime

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Busca dados do perfil do usuário logado"""
    try:
        user = g.current_user
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role.value,
            'avatar': user.avatar,
            'joined_at': user.joined_at,
            'company_id': user.company_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Atualiza dados do perfil do usuário"""
    try:
        data = request.get_json()
        user = g.current_user
        
        # Atualiza campos permitidos
        if 'name' in data:
            user.name = data['name']
        
        if 'email' in data:
            # Verifica se o email já existe em outro usuário
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email já está em uso por outro usuário'}), 400
            user.email = data['email']
        
        user.updated_at = datetime.utcnow().isoformat()
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role.value,
                'avatar': user.avatar
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    """Upload de foto de perfil"""
    try:
        data = request.get_json()
        avatar_data = data.get('avatar')
        
        if not avatar_data:
            return jsonify({'error': 'Dados da imagem não fornecidos'}), 400
        
        # Verifica se é uma imagem base64 válida
        if not avatar_data.startswith('data:image/'):
            return jsonify({'error': 'Formato de imagem inválido'}), 400
        
        # Extrai o tipo de arquivo
        header, encoded = avatar_data.split(',', 1)
        file_type = header.split('/')[1].split(';')[0]
        
        if file_type not in ['jpeg', 'jpg', 'png', 'gif']:
            return jsonify({'error': 'Tipo de arquivo não suportado'}), 400
        
        # Decodifica a imagem
        image_data = base64.b64decode(encoded)
        
        # Obtém o usuário atual
        user = g.current_user
        
        # Gera nome único para o arquivo
        filename = f"avatar_{user.id}_{uuid.uuid4().hex[:8]}.{file_type}"
        
        # Cria diretório absoluto se não existir (baseado na raiz do backend)
        base_dir = os.path.dirname(os.path.dirname(__file__))
        upload_dir = os.path.join(base_dir, 'uploads', 'avatars')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Salva o arquivo
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        # Atualiza o avatar no banco
        user.avatar = filename
        user.updated_at = datetime.utcnow().isoformat()
        db.session.commit()
        
        return jsonify({
            'message': 'Avatar atualizado com sucesso',
            'avatar': filename
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    """Altera senha do usuário"""
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not all([current_password, new_password]):
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        user = g.current_user
        
        # Verifica senha atual
        if not check_password_hash(user.password_hash, current_password):
            return jsonify({'error': 'Senha atual incorreta'}), 400
        
        # Valida nova senha
        if len(new_password) < 6:
            return jsonify({'error': 'Nova senha deve ter pelo menos 6 caracteres'}), 400
        
        # Atualiza senha
        user.password_hash = generate_password_hash(new_password)
        user.updated_at = datetime.utcnow().isoformat()
        db.session.commit()
        
        return jsonify({'message': 'Senha alterada com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/avatar/<filename>')
def get_avatar(filename):
    """Serve arquivos de avatar"""
    try:
        from flask import send_from_directory
        base_dir = os.path.dirname(os.path.dirname(__file__))
        upload_dir = os.path.join(base_dir, 'uploads', 'avatars')
        return send_from_directory(upload_dir, filename)
    except Exception as e:
        return jsonify({'error': 'Avatar não encontrado'}), 404
