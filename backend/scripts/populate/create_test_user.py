from app import app
from models import db, User, Company
from werkzeug.security import generate_password_hash
import datetime

with app.app_context():
    # Garante que existe uma empresa (busca por ID 1 ou cria uma nova)
    company = Company.query.get(1)
    if not company:
        # Busca qualquer empresa existente
        company = Company.query.first()
        if not company:
            # Cria uma nova empresa
            company = Company(
                name="Empresa de Desenvolvimento",
                status='active',
                created_at=datetime.datetime.utcnow().isoformat(),
                updated_at=datetime.datetime.utcnow().isoformat()
            )
            db.session.add(company)
            db.session.commit()
            print(f"Empresa de desenvolvimento criada (ID: {company.id})")
        else:
            print(f"Empresa existente encontrada: {company.name} (ID: {company.id})")
    else:
        print(f"Empresa encontrada: {company.name} (ID: {company.id})")
    
    company_id = company.id
    
    # Cria um usuário de teste
    test_user = User(
        name="Teste Sync",
        email="teste@sync.com",
        password_hash=generate_password_hash("123456"),
        role="admin",
        company_id=company_id
    )
    
    # Verifica se já existe
    existing = User.query.filter_by(email="teste@sync.com").first()
    if not existing:
        db.session.add(test_user)
        db.session.commit()
        print("Usuario de teste criado: teste@sync.com / 123456")
    else:
        print("Usuario de teste ja existe")
        # Atualiza a senha para garantir que está correta
        existing.password_hash = generate_password_hash("123456")
        db.session.commit()
        print("Senha do usuario de teste atualizada para: 123456")

    # Cria o usuário Matheus Elpidio Rodrigues
    matheus_user = User(
        name="Matheus Elpidio Rodrigues",
        email="matheuselpidio5@gmail.com",
        password_hash=generate_password_hash("123456"),
        role="admin",
        company_id=company_id
    )

    existing_matheus = User.query.filter_by(email="matheuselpidio5@gmail.com").first()
    if not existing_matheus:
        db.session.add(matheus_user)
        db.session.commit()
        print("Usuario criado: matheuselpidio5@gmail.com / 123456")
    else:
        print("Usuario matheuselpidio5@gmail.com ja existe")
        # Atualiza a senha e company_id para garantir que está correto
        existing_matheus.password_hash = generate_password_hash("123456")
        existing_matheus.company_id = company_id
        db.session.commit()
        print("Senha e company_id do usuario matheuselpidio5@gmail.com atualizados")
    
    # Lista todos os usuários
    users = User.query.all()
    print("\n=== USUÁRIOS NO BANCO ===")
    for user in users:
        print(f"- {user.name} ({user.email}) - Role: {user.role.value}")
    
    print("\n=== CREDENCIAIS DE DESENVOLVIMENTO ===")
    print("Email: matheuselpidio5@gmail.com")
    print("Senha: 123456")
