from app import app
from models import db, Template
import json
from datetime import datetime

def add_template(name, category, author, description, tags, duration, preview_items, structure):
    t = Template(
        name=name,
        category=category,
        author=author,
        description=description,
        tags_json=json.dumps(tags, ensure_ascii=False),
        duration=duration,
        items_count=len(preview_items),
        downloads=0,
        views=0,
        likes_cached=0,
        structure_json=json.dumps(structure, ensure_ascii=False),
        created_at=datetime.utcnow().isoformat()
    )
    db.session.add(t)

with app.app_context():
    db.create_all()
    # Only seed if empty
    if Template.query.count() == 0:
        # Esportes - Futebol
        add_template(
            name='Transmissão de Futebol Completa',
            category='Esportes',
            author='Equipe Run It Down',
            description='Template completo para jogos com pré-jogo, intervalo e pós-jogo',
            tags=['futebol','esportes','ao-vivo'],
            duration='3h 30min',
            preview_items=[
                'Abertura e Apresentação (5min)', 'Análise Pré-Jogo (15min)', 'Escalações (10min)',
                'Transmissão 1º Tempo (45min)', 'Intervalo (15min)', 'Transmissão 2º Tempo (45min)', 'Análise Pós-Jogo (20min)'
            ],
            structure=[
                { 'id': 'folder-1', 'title': 'Pré-Jogo', 'type': 'folder', 'children': [
                    { 'id': 'item-1-1', 'title': 'Abertura e Apresentação', 'duration': 300, 'description': 'Início da transmissão.', 'type': 'generic', 'status': 'pending', 'icon': 'Play', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'item-1-2', 'title': 'Análise Pré-Jogo', 'duration': 900, 'description': 'Comentários sobre a partida.', 'type': 'generic', 'status': 'pending', 'icon': 'ClipboardList', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'item-1-3', 'title': 'Escalações', 'duration': 600, 'description': 'Apresentação dos times.', 'type': 'generic', 'status': 'pending', 'icon': 'Users', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' }
                ]},
                { 'id': 'folder-2', 'title': 'Partida', 'type': 'folder', 'children': [
                    { 'id': 'item-2-1', 'title': 'Transmissão 1º Tempo', 'duration': 2700, 'description': 'Narração do primeiro tempo.', 'type': 'generic', 'status': 'pending', 'icon': 'Radio', 'color': '#ef4444', 'urgency': 'urgent', 'reminder': '' },
                    { 'id': 'item-2-2', 'title': 'Intervalo', 'duration': 900, 'description': 'Análise e comentários.', 'type': 'generic', 'status': 'pending', 'icon': 'Coffee', 'color': '#f97316', 'urgency': 'attention', 'reminder': '' },
                    { 'id': 'item-2-3', 'title': 'Transmissão 2º Tempo', 'duration': 2700, 'description': 'Narração do segundo tempo.', 'type': 'generic', 'status': 'pending', 'icon': 'Radio', 'color': '#ef4444', 'urgency': 'urgent', 'reminder': '' }
                ]},
                { 'id': 'folder-3', 'title': 'Pós-Jogo', 'type': 'folder', 'children': [
                    { 'id': 'item-3-1', 'title': 'Análise Pós-Jogo', 'duration': 1200, 'description': 'Melhores momentos e comentários.', 'type': 'generic', 'status': 'pending', 'icon': 'ClipboardCheck', 'color': '#10b981', 'urgency': 'normal', 'reminder': '' }
                ]}
            ]
        )

        # Jornalismo - Telejornal
        add_template(
            name='Telejornal Diário',
            category='Jornalismo',
            author='Equipe Run It Down',
            description='Estrutura padrão para telejornal com manchetes, reportagens e previsão do tempo',
            tags=['jornalismo','notícias','diário'],
            duration='1h 15min',
            preview_items=['Abertura (2min)','Manchetes Principais (10min)','Reportagem Especial (15min)','Esportes (8min)','Previsão do Tempo (5min)','Encerramento (3min)'],
            structure=[]
        )

        # Entretenimento - Show musical
        add_template(
            name='Show Musical ao Vivo',
            category='Entretenimento',
            author='Carlos Música',
            description='Template para shows musicais com soundcheck, apresentações e interações com público',
            tags=['música','show','entretenimento'],
            duration='2h 45min',
            preview_items=['Soundcheck (30min)','Abertura (10min)','Primeira Música (4min)','Interação com Público (5min)','Segunda Música (4min)','Intervalo (15min)'],
            structure=[]
        )

        # Podcast
        add_template(
            name='Podcast Entrevista',
            category='Podcast',
            author='Ana Podcaster',
            description='Estrutura para podcast de entrevista com introdução, perguntas e considerações finais',
            tags=['podcast','entrevista','conversa'],
            duration='45min',
            preview_items=['Introdução (3min)','Apresentação do Convidado (5min)','Bloco 1 - Carreira (15min)','Bloco 2 - Projetos (15min)','Perguntas Rápidas (5min)','Encerramento (2min)'],
            structure=[]
        )

        # Corporativo
        add_template(
            name='Evento Corporativo',
            category='Corporativo',
            author='Empresa XYZ',
            description='Template para eventos corporativos com apresentações, palestrantes e networking',
            tags=['corporativo','evento','negócios'],
            duration='4h',
            preview_items=['Credenciamento (30min)','Abertura Oficial (15min)','Palestra Principal (60min)','Coffee Break (30min)','Mesa Redonda (45min)','Networking (60min)'],
            structure=[]
        )

        db.session.commit()
        print('Templates base populados com sucesso.')
    else:
        # Atualiza estruturas faltantes
        updated = {'val': False}
        def set_structure(t: Template, structure, preview_items=None, duration=None):
            t.structure_json = json.dumps(structure, ensure_ascii=False)
            t.items_count = sum(len(f.get('children', [])) for f in structure)
            if duration:
                t.duration = duration
            updated['val'] = True

        # Telejornal Diário
        t = Template.query.filter_by(name='Telejornal Diário').first()
        if t and (not t.structure_json or t.structure_json == '[]'):
            set_structure(t, [
                { 'id': 'folder-1', 'title': 'Abertura', 'type': 'folder', 'children': [
                    { 'id': 'tj-1-1', 'title': 'Vinheta de Abertura', 'duration': 30, 'description': 'Abertura do jornal', 'type': 'generic', 'status': 'pending', 'icon': 'Play', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'tj-1-2', 'title': 'Manchetes', 'duration': 600, 'description': 'Principais notícias', 'type': 'generic', 'status': 'pending', 'icon': 'Newspaper', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' }
                ]},
                { 'id': 'folder-2', 'title': 'Reportagens', 'type': 'folder', 'children': [
                    { 'id': 'tj-2-1', 'title': 'Reportagem 1', 'duration': 600, 'description': 'Pauta principal', 'type': 'generic', 'status': 'pending', 'icon': 'Camera', 'color': '#ef4444', 'urgency': 'attention', 'reminder': '' },
                    { 'id': 'tj-2-2', 'title': 'Esportes', 'duration': 480, 'description': 'Bloco de esportes', 'type': 'generic', 'status': 'pending', 'icon': 'Trophy', 'color': '#f97316', 'urgency': 'normal', 'reminder': '' }
                ]},
                { 'id': 'folder-3', 'title': 'Encerramento', 'type': 'folder', 'children': [
                    { 'id': 'tj-3-1', 'title': 'Previsão do Tempo', 'duration': 300, 'description': 'Clima', 'type': 'generic', 'status': 'pending', 'icon': 'CloudSun', 'color': '#10b981', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'tj-3-2', 'title': 'Despedida', 'duration': 180, 'description': 'Fechamento', 'type': 'generic', 'status': 'pending', 'icon': 'LogOut', 'color': '#10b981', 'urgency': 'normal', 'reminder': '' }
                ]}
            ])

        # Show Musical ao Vivo
        t = Template.query.filter_by(name='Show Musical ao Vivo').first()
        if t and (not t.structure_json or t.structure_json == '[]'):
            set_structure(t, [
                { 'id': 'folder-1', 'title': 'Pré-Show', 'type': 'folder', 'children': [
                    { 'id': 'sm-1-1', 'title': 'Soundcheck', 'duration': 1800, 'description': 'Ajuste de som', 'type': 'generic', 'status': 'pending', 'icon': 'Mic', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' }
                ]},
                { 'id': 'folder-2', 'title': 'Show', 'type': 'folder', 'children': [
                    { 'id': 'sm-2-1', 'title': 'Abertura', 'duration': 600, 'description': 'Abertura do show', 'type': 'generic', 'status': 'pending', 'icon': 'Play', 'color': '#ef4444', 'urgency': 'attention', 'reminder': '' },
                    { 'id': 'sm-2-2', 'title': 'Primeira Música', 'duration': 240, 'description': 'Faixa 1', 'type': 'generic', 'status': 'pending', 'icon': 'Music', 'color': '#ef4444', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'sm-2-3', 'title': 'Interação com Público', 'duration': 300, 'description': 'Fala com a plateia', 'type': 'generic', 'status': 'pending', 'icon': 'Users', 'color': '#f97316', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'sm-2-4', 'title': 'Segunda Música', 'duration': 240, 'description': 'Faixa 2', 'type': 'generic', 'status': 'pending', 'icon': 'Music', 'color': '#ef4444', 'urgency': 'normal', 'reminder': '' }
                ]},
                { 'id': 'folder-3', 'title': 'Intervalo', 'type': 'folder', 'children': [
                    { 'id': 'sm-3-1', 'title': 'Intervalo', 'duration': 900, 'description': 'Pausa', 'type': 'generic', 'status': 'pending', 'icon': 'Coffee', 'color': '#f97316', 'urgency': 'normal', 'reminder': '' }
                ]}
            ])

        # Podcast Entrevista
        t = Template.query.filter_by(name='Podcast Entrevista').first()
        if t and (not t.structure_json or t.structure_json == '[]'):
            set_structure(t, [
                { 'id': 'folder-1', 'title': 'Abertura', 'type': 'folder', 'children': [
                    { 'id': 'pc-1-1', 'title': 'Introdução', 'duration': 180, 'description': 'Apresentação do podcast', 'type': 'generic', 'status': 'pending', 'icon': 'Mic', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'pc-1-2', 'title': 'Apresentação do Convidado', 'duration': 300, 'description': 'Quem é o convidado', 'type': 'generic', 'status': 'pending', 'icon': 'User', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' }
                ]},
                { 'id': 'folder-2', 'title': 'Entrevista', 'type': 'folder', 'children': [
                    { 'id': 'pc-2-1', 'title': 'Carreira', 'duration': 900, 'description': 'Perguntas sobre carreira', 'type': 'generic', 'status': 'pending', 'icon': 'Briefcase', 'color': '#f97316', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'pc-2-2', 'title': 'Projetos', 'duration': 900, 'description': 'Projetos atuais', 'type': 'generic', 'status': 'pending', 'icon': 'Folder', 'color': '#10b981', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'pc-2-3', 'title': 'Perguntas Rápidas', 'duration': 300, 'description': 'Ping-pong', 'type': 'generic', 'status': 'pending', 'icon': 'Timer', 'color': '#ef4444', 'urgency': 'attention', 'reminder': '' }
                ]},
                { 'id': 'folder-3', 'title': 'Fechamento', 'type': 'folder', 'children': [
                    { 'id': 'pc-3-1', 'title': 'Considerações Finais', 'duration': 120, 'description': 'Encerramento', 'type': 'generic', 'status': 'pending', 'icon': 'LogOut', 'color': '#10b981', 'urgency': 'normal', 'reminder': '' }
                ]}
            ])

        # Evento Corporativo
        t = Template.query.filter_by(name='Evento Corporativo').first()
        if t and (not t.structure_json or t.structure_json == '[]'):
            set_structure(t, [
                { 'id': 'folder-1', 'title': 'Recepção', 'type': 'folder', 'children': [
                    { 'id': 'ec-1-1', 'title': 'Credenciamento', 'duration': 1800, 'description': 'Check-in participantes', 'type': 'generic', 'status': 'pending', 'icon': 'IdCard', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' }
                ]},
                { 'id': 'folder-2', 'title': 'Conteúdo', 'type': 'folder', 'children': [
                    { 'id': 'ec-2-1', 'title': 'Abertura Oficial', 'duration': 900, 'description': 'Boas-vindas', 'type': 'generic', 'status': 'pending', 'icon': 'Play', 'color': '#3b82f6', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'ec-2-2', 'title': 'Palestra Principal', 'duration': 3600, 'description': 'Keynote', 'type': 'generic', 'status': 'pending', 'icon': 'Presentation', 'color': '#ef4444', 'urgency': 'attention', 'reminder': '' },
                    { 'id': 'ec-2-3', 'title': 'Mesa Redonda', 'duration': 2700, 'description': 'Debate', 'type': 'generic', 'status': 'pending', 'icon': 'Users', 'color': '#f97316', 'urgency': 'normal', 'reminder': '' }
                ]},
                { 'id': 'folder-3', 'title': 'Networking', 'type': 'folder', 'children': [
                    { 'id': 'ec-3-1', 'title': 'Coffee Break', 'duration': 1800, 'description': 'Intervalo', 'type': 'generic', 'status': 'pending', 'icon': 'Coffee', 'color': '#10b981', 'urgency': 'normal', 'reminder': '' },
                    { 'id': 'ec-3-2', 'title': 'Networking', 'duration': 3600, 'description': 'Relacionamento', 'type': 'generic', 'status': 'pending', 'icon': 'Handshake', 'color': '#10b981', 'urgency': 'normal', 'reminder': '' }
                ]}
            ])

        if updated['val']:
            db.session.commit()
            print('Estruturas de templates atualizadas com sucesso.')
        else:
            print('Templates já existentes. Nenhuma ação tomada.')


