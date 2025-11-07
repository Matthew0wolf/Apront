from app import app
from models import db, User, Company, Rundown, TeamMember

with app.app_context():
    print("=== VERIFICAÇÃO DE DADOS ===")
    print(f"Usuários: {User.query.count()}")
    print(f"Empresas: {Company.query.count()}")
    print(f"Rundowns: {Rundown.query.count()}")
    print(f"Membros da equipe: {TeamMember.query.count()}")
    
    print("\n=== USUÁRIOS ===")
    users = User.query.all()
    for user in users:
        print(f"- {user.name} ({user.email}) - Empresa: {user.company_id} - Avatar: {user.avatar}")
    
    print("\n=== EMPRESAS ===")
    companies = Company.query.all()
    for company in companies:
        print(f"- {company.name} (ID: {company.id})")
    
    print("\n=== RUNDOWNS ===")
    rundowns = Rundown.query.all()
    for rundown in rundowns:
        print(f"- {rundown.name} (ID: {rundown.id}) - Status: {rundown.status}")
