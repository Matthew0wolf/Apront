from flask import Blueprint, jsonify, request, g, send_file
from models import db, Template, TemplateLike, TemplateRating, Rundown, Folder, Item, User, RundownMember
from auth_utils import jwt_required
import json
from datetime import datetime
from websocket_server import broadcast_rundown_list_changed
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from io import BytesIO

templates_bp = Blueprint('templates', __name__, url_prefix='/api/templates')


@templates_bp.route('', methods=['GET'])
def list_templates():
    templates = Template.query.all()
    result = []
    for t in templates:
        # Gera prévia a partir da estrutura
        preview = []
        items_count = t.items_count or 0
        try:
            structure = json.loads(t.structure_json) if t.structure_json else []
            for folder in structure:
                for item in folder.get('children', [])[:3]:
                    title = item.get('title')
                    duration = item.get('duration')
                    if isinstance(duration, int):
                        minutes = max(1, duration // 60)
                        preview.append(f"{title} ({minutes}min)")
                    else:
                        preview.append(title)
            if not items_count:
                items_count = sum(len(f.get('children', [])) for f in structure)
        except Exception:
            structure = []
        result.append({
            'id': t.id,
            'name': t.name,
            'category': t.category,
            'author': t.author,
            'description': t.description,
            'tags': json.loads(t.tags_json) if t.tags_json else [],
            'duration': t.duration,
            'items': items_count,
            'downloads': t.downloads,
            'views': t.views,
            'likes': t.likes_cached or TemplateLike.query.filter_by(template_id=t.id).count(),
            'rating': t.rating_cached or 0,
            'rating_count': t.rating_count or 0,
            'preview': preview
        })
    return jsonify({'templates': result})


@templates_bp.route('/<int:template_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(template_id):
    user_id = g.current_user.id
    t = Template.query.get(template_id)
    if not t:
        return jsonify({'error': 'Template não encontrado'}), 404
    existing = TemplateLike.query.filter_by(template_id=template_id, user_id=user_id).first()
    liked = False
    if existing:
        db.session.delete(existing)
    else:
        db.session.add(TemplateLike(template_id=template_id, user_id=user_id))
        liked = True
    # Atualiza cache simples
    t.likes_cached = TemplateLike.query.filter_by(template_id=template_id).count()
    db.session.commit()
    return jsonify({'liked': liked, 'likes': t.likes_cached})
@templates_bp.route('/<int:template_id>/rate', methods=['POST'])
@jwt_required()
def rate_template(template_id):
    data = request.get_json(force=True) or {}
    stars = int(data.get('stars', 0))
    if stars < 1 or stars > 5:
        return jsonify({'error': 'stars deve ser entre 1 e 5'}), 400
    user_id = g.current_user.id
    t = Template.query.get(template_id)
    if not t:
        return jsonify({'error': 'Template não encontrado'}), 404

    existing = TemplateRating.query.filter_by(template_id=template_id, user_id=user_id).first()
    if existing:
        existing.stars = stars
    else:
        db.session.add(TemplateRating(template_id=template_id, user_id=user_id, stars=stars))

    # Recalcula média e contagem
    q = db.session.query(TemplateRating).filter_by(template_id=template_id)
    count = q.count()
    avg = 0
    if count:
        total = sum(r.stars for r in q.all())
        avg = round(total / count, 2)
    t.rating_cached = avg
    t.rating_count = count
    db.session.commit()
    return jsonify({'rating': t.rating_cached, 'rating_count': t.rating_count})


@templates_bp.route('/<int:template_id>/import', methods=['POST'])
@jwt_required()
def import_template(template_id):
    t = Template.query.get(template_id)
    if not t:
        return jsonify({'error': 'Template não encontrado'}), 404

    # Cria o Rundown baseado no template
    rundown = Rundown(
        name=t.name,
        type=t.category,
        created=datetime.utcnow().strftime('%Y-%m-%d'),
        last_modified=datetime.utcnow().strftime('%Y-%m-%d'),
        status='Novo',
        duration=t.duration or '0',
        team_members=1
    )
    db.session.add(rundown)
    db.session.flush()

    # Vincula o rundown ao usuário logado (criador/owner)
    try:
        creator_id = g.current_user.id
        db.session.add(RundownMember(rundown_id=rundown.id, user_id=creator_id, role='owner'))
    except Exception:
        # Se por algum motivo g.current_user não estiver disponível, segue sem o vínculo
        pass

    # Cria pastas e itens
    try:
        structure = json.loads(t.structure_json) if t.structure_json else []
    except Exception:
        structure = []

    for f_index, folder in enumerate(structure):
        new_folder = Folder(
            title=folder.get('title', f'Pasta {f_index+1}'),
            ordem=f_index + 1,
            rundown_id=rundown.id
        )
        db.session.add(new_folder)
        db.session.flush()

        for i_index, item in enumerate(folder.get('children', [])):
            new_item = Item(
                title=item.get('title', f'Item {i_index+1}'),
                duration=int(item.get('duration', 0) or 0),
                description=item.get('description', ''),
                type=item.get('type', 'generic'),
                status=item.get('status', 'pending'),
                icon_type='lucide',
                icon_data=item.get('icon', None),
                color=item.get('color', '#808080'),
                urgency=item.get('urgency', 'normal'),
                reminder=item.get('reminder', ''),
                ordem=i_index + 1,
                folder_id=new_folder.id
            )
            db.session.add(new_item)

    # incrementa métricas
    t.downloads = (t.downloads or 0) + 1
    db.session.commit()

    # Notifica lista alterada
    try:
        broadcast_rundown_list_changed()
    except Exception:
        pass

    return jsonify({ 'message': 'Rundown criado a partir do template', 'rundown_id': rundown.id })


@templates_bp.route('/<int:template_id>/view', methods=['POST'])
def view_template(template_id):
    t = Template.query.get(template_id)
    if not t:
        return jsonify({'error': 'Template não encontrado'}), 404
    t.views = (t.views or 0) + 1
    db.session.commit()
    return jsonify({'views': t.views})


@templates_bp.route('/download-example', methods=['GET'])
def download_example_template():
    """Gera e retorna um arquivo de texto simples para importação de templates"""
    
    try:
        # Arquivo de texto simples e claro
        content = """# TEMPLATE DE EXEMPLO PARA IMPORTAR TEMPLATES
# 
# INSTRUÇÕES:
# 1. Copie o formato abaixo
# 2. Edite os dados dos templates
# 3. Salve como .txt
# 4. Envie de volta pelo sistema
#
# FORMATO (cada linha = um template):
# nome_template|tipo|descrição|duração_minutos|categoria|tags_separadas_por_virgula
#
# EXEMPLOS:

Transmissão Esportiva|Esporte|Template para transmissões ao vivo de eventos esportivos|90|Esportes|futebol,ao vivo,esporte
Entrevista|Entrevista|Template para programas de entrevista|60|Entretenimento|entrevista,talk show
Noticiário|Notícias|Template para programas jornalísticos|30|Jornalismo|notícias,jornal,informação

# COMO USAR:
# - Substitua os exemplos pelos seus templates
# - Use | (pipe) para separar os campos
# - Não use quebras de linha dentro de um campo
# - Tags devem ser separadas por vírgula (sem espaços)
# - Duração deve ser apenas o número em minutos
"""
        
        # Retorna como arquivo de texto simples
        from flask import Response
        return Response(
            content.encode('utf-8'),
            mimetype='text/plain',
            headers={
                'Content-Disposition': 'attachment; filename=template_exemplo.txt'
            }
        )
        
    except Exception as e:
        print(f"Erro ao gerar arquivo: {e}")
        return jsonify({'error': f'Erro ao gerar arquivo: {str(e)}'}), 500


@templates_bp.route('', methods=['POST'])
@jwt_required()
def create_templates_bulk():
    """Recebe templates via upload de arquivo ou JSON"""
    
    # Verifica se é upload de arquivo
    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename:
            try:
                # Lê o conteúdo do arquivo
                content = file.read().decode('utf-8')
                templates_data = parse_text_templates(content)
            except Exception as e:
                return jsonify({'error': f'Erro ao ler arquivo: {str(e)}'}), 400
        else:
            return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    else:
        # Processa dados JSON
        data = request.get_json(force=True) or {}
        templates_data = data.get('templates', [])
    
    if not templates_data:
        return jsonify({'error': 'Nenhum template fornecido'}), 400
    
    created_count = 0
    errors = []
    
    for idx, template_info in enumerate(templates_data):
        try:
            # Extrai dados do template (compatível com diferentes formatos)
            if isinstance(template_info, dict):
                # Formato JSON/Excel
                name = template_info.get('Nome do Template') or template_info.get('name')
                tipo = template_info.get('Tipo') or template_info.get('type', 'Geral')
                descricao = template_info.get('Descrição') or template_info.get('description', '')
                duracao = template_info.get('Duração (minutos)') or template_info.get('duration', 0)
                categoria = template_info.get('Categoria') or template_info.get('category', 'Geral')
                tags_str = template_info.get('Tags') or template_info.get('tags', '')
            else:
                # Formato texto (pipe separado)
                parts = template_info.split('|')
                if len(parts) < 6:
                    errors.append(f"Linha {idx + 1}: Formato inválido - use: nome|tipo|descrição|duração|categoria|tags")
                    continue
                
                name = parts[0].strip()
                tipo = parts[1].strip()
                descricao = parts[2].strip()
                duracao = parts[3].strip()
                categoria = parts[4].strip()
                tags_str = parts[5].strip()
            
            # Valida campos obrigatórios
            if not name:
                errors.append(f"Linha {idx + 1}: Nome do template é obrigatório")
                continue
            
            # Converte duração para string no formato esperado
            if isinstance(duracao, (int, float)):
                duracao_str = f"{int(duracao)}min" if duracao < 60 else f"{int(duracao // 60)}h {int(duracao % 60)}min"
            else:
                try:
                    duracao_num = int(str(duracao))
                    duracao_str = f"{duracao_num}min" if duracao_num < 60 else f"{duracao_num // 60}h {duracao_num % 60}min"
                except:
                    duracao_str = str(duracao)
            
            # Processa tags
            if isinstance(tags_str, str):
                tags_list = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
            else:
                tags_list = tags_str if isinstance(tags_str, list) else []
            
            # Cria estrutura básica (vazia por padrão)
            structure = []
            
            # Verifica se template já existe
            existing = Template.query.filter_by(name=name).first()
            if existing:
                # Atualiza template existente
                existing.category = categoria
                existing.description = descricao
                existing.duration = duracao_str
                existing.tags_json = json.dumps(tags_list, ensure_ascii=False)
            else:
                # Cria novo template
                new_template = Template(
                    name=name,
                    category=categoria,
                    author=g.current_user.name,
                    description=descricao,
                    tags_json=json.dumps(tags_list, ensure_ascii=False),
                    duration=duracao_str,
                    structure_json=json.dumps(structure, ensure_ascii=False),
                    items_count=0,
                    downloads=0,
                    views=0,
                    likes_cached=0,
                    rating_cached=0,
                    rating_count=0
                )
                db.session.add(new_template)
                created_count += 1
        
        except Exception as e:
            errors.append(f"Linha {idx + 1}: Erro ao processar - {str(e)}")
            continue
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro ao salvar templates: {str(e)}'}), 500
    
    response = {
        'message': 'Processamento concluído',
        'count': created_count,
        'total': len(templates_data),
        'errors': errors
    }
    
    return jsonify(response), 201 if created_count > 0 else 200


def parse_text_templates(content):
    """Processa arquivo de texto e extrai templates"""
    templates = []
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        # Ignora linhas vazias e comentários
        if not line or line.startswith('#'):
            continue
        
        # Verifica se é uma linha de template (contém |)
        if '|' in line:
            templates.append(line)
    
    return templates


