from app import app
from models import db, TeamMember

with app.app_context():
    db.create_all()
    if TeamMember.query.count() == 0:
        members = [
            TeamMember(name='João Silva', email='joao@exemplo.com', role='operator', status='active', joined_at='2024-01-15', last_active='2 horas atrás', avatar='JS'),
            TeamMember(name='Maria Santos', email='maria@exemplo.com', role='presenter', status='active', joined_at='2024-01-18', last_active='1 dia atrás', avatar='MS'),
            TeamMember(name='Carlos Oliveira', email='carlos@exemplo.com', role='operator', status='pending', joined_at='2024-01-20', last_active='Nunca', avatar='CO'),
            TeamMember(name='Ana Costa', email='ana@exemplo.com', role='presenter', status='inactive', joined_at='2024-01-10', last_active='1 semana atrás', avatar='AC'),
        ]
        db.session.add_all(members)
        db.session.commit()
        print('Membros da equipe populados.')
    else:
        print('Membros da equipe já existem.')
