from app import app
from models import db, Rundown, Folder, Item

with app.app_context():
    db.drop_all()
    db.create_all()

    # Cria rundown exemplo
    rundown = Rundown(
        name='Modelo de Jogo de Futebol',
        type='Esportes',
        created='2025-09-22',
        last_modified='2025-09-22',
        status='Modelo',
        duration='3h 30min',
        team_members=1
    )
    db.session.add(rundown)
    db.session.commit()

    # Folders
    folder1 = Folder(title='Pré-Jogo', ordem=1, rundown_id=rundown.id)
    folder2 = Folder(title='Partida', ordem=2, rundown_id=rundown.id)
    folder3 = Folder(title='Pós-Jogo', ordem=3, rundown_id=rundown.id)
    db.session.add_all([folder1, folder2, folder3])
    db.session.commit()

    # Items folder1
    i1 = Item(title='Abertura e Apresentação', duration=300, description='Início da transmissão.', type='generic', status='pending', icon_type='lucide', icon_data='Play', color='#3b82f6', urgency='normal', reminder='', ordem=1, folder_id=folder1.id)
    i2 = Item(title='Análise Pré-Jogo', duration=900, description='Comentários sobre a partida.', type='generic', status='pending', icon_type='lucide', icon_data='ClipboardList', color='#3b82f6', urgency='normal', reminder='', ordem=2, folder_id=folder1.id)
    i3 = Item(title='Escalações', duration=600, description='Apresentação dos times.', type='generic', status='pending', icon_type='lucide', icon_data='Users', color='#3b82f6', urgency='normal', reminder='', ordem=3, folder_id=folder1.id)
    db.session.add_all([i1, i2, i3])

    # Items folder2
    i4 = Item(title='Transmissão 1º Tempo', duration=2700, description='Narração do primeiro tempo.', type='generic', status='pending', icon_type='lucide', icon_data='Radio', color='#ef4444', urgency='urgent', reminder='', ordem=1, folder_id=folder2.id)
    i5 = Item(title='Intervalo', duration=900, description='Análise e comentários.', type='generic', status='pending', icon_type='lucide', icon_data='Coffee', color='#f97316', urgency='attention', reminder='', ordem=2, folder_id=folder2.id)
    i6 = Item(title='Transmissão 2º Tempo', duration=2700, description='Narração do segundo tempo.', type='generic', status='pending', icon_type='lucide', icon_data='Radio', color='#ef4444', urgency='urgent', reminder='', ordem=3, folder_id=folder2.id)
    db.session.add_all([i4, i5, i6])

    # Items folder3
    i7 = Item(title='Análise Pós-Jogo', duration=1200, description='Melhores momentos e comentários.', type='generic', status='pending', icon_type='lucide', icon_data='ClipboardCheck', color='#10b981', urgency='normal', reminder='', ordem=1, folder_id=folder3.id)
    db.session.add(i7)

    db.session.commit()
    print('Banco populado com dados iniciais.')
