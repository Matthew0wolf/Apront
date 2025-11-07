from app import app
from models import db, User, Company
from werkzeug.security import generate_password_hash

with app.app_context():
    # Cria um usuário de teste
    test_user = User(
        name="Teste Sync",
        email="teste@sync.com",
        password_hash=generate_password_hash("123456"),
        role="admin",
        company_id=1
    )
    
    # Verifica se já existe
    existing = User.query.filter_by(email="teste@sync.com").first()
    if not existing:
        db.session.add(test_user)
        db.session.commit()
        print("Usuario de teste criado: teste@sync.com / 123456")
    else:
        print("Usuario de teste ja existe")

    # Cria o usuário Matheus Elpidio Rodrigues
    matheus_user = User(
        name="Matheus Elpidio Rodrigues",
        email="matheuselpidio5@gmail.com",
        password_hash=generate_password_hash("123456"),
        role="admin",
        company_id=1
    )

    existing_matheus = User.query.filter_by(email="matheuselpidio5@gmail.com").first()
    if not existing_matheus:
        db.session.add(matheus_user)
        db.session.commit()
        print("Usuario criado: matheuselpidio5@gmail.com / 123456")
    else:
        print("Usuario matheuselpidio5@gmail.com ja existe")
    
    # Lista todos os usuários
    users = User.query.all()
    print("\n=== USUÁRIOS NO BANCO ===")
    for user in users:
        print(f"- {user.name} ({user.email})")
