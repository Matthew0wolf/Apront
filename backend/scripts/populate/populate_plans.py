import datetime
import json
from app import app
from models import db, Plan, Company, Subscription, CompanyLimits

def create_plans():
    """Cria os planos iniciais do sistema"""
    
    plans_data = [
        {
            'name': 'Starter',
            'description': 'Perfeito para pequenas equipes que estão começando',
            'price': 850.00,
            'max_members': 5,
            'max_rundowns': 10,
            'max_storage_gb': 1,
            'features': json.dumps([
                'Criação de rundowns ilimitados',
                'Até 5 membros da equipe',
                'Suporte por email',
                'Templates básicos',
                'Relatórios básicos'
            ]),
            'billing_cycle': 'monthly'
        },
        {
            'name': 'Professional',
            'description': 'Ideal para equipes médias que precisam de mais recursos',
            'price': 1500.00,
            'max_members': 20,
            'max_rundowns': 50,
            'max_storage_gb': 10,
            'features': json.dumps([
                'Tudo do plano Starter',
                'Até 20 membros da equipe',
                'Templates premium',
                'Relatórios avançados',
                'Integração com calendários',
                'Suporte prioritário',
                'Backup automático'
            ]),
            'billing_cycle': 'monthly'
        },
        {
            'name': 'Enterprise',
            'description': 'Para grandes empresas com necessidades específicas',
            'price': 3000.00,
            'max_members': 100,
            'max_rundowns': 200,
            'max_storage_gb': 100,
            'features': json.dumps([
                'Tudo do plano Professional',
                'Membros ilimitados',
                'Rundowns ilimitados',
                'Storage ilimitado',
                'API personalizada',
                'Suporte dedicado',
                'Treinamento personalizado',
                'SLA garantido',
                'Integrações customizadas'
            ]),
            'billing_cycle': 'monthly'
        }
    ]
    
    with app.app_context():
        # Remove planos existentes
        Plan.query.delete()
        
        for plan_data in plans_data:
            plan = Plan(
                name=plan_data['name'],
                description=plan_data['description'],
                price=plan_data['price'],
                max_members=plan_data['max_members'],
                max_rundowns=plan_data['max_rundowns'],
                max_storage_gb=plan_data['max_storage_gb'],
                features=plan_data['features'],
                billing_cycle=plan_data['billing_cycle'],
                is_active=True,
                created_at=datetime.datetime.utcnow().isoformat(),
                updated_at=datetime.datetime.utcnow().isoformat()
            )
            db.session.add(plan)
        
        db.session.commit()
        print("Planos criados com sucesso!")

def create_trial_company():
    """Cria uma empresa de teste com trial"""
    
    with app.app_context():
        # Busca o plano Starter
        starter_plan = Plan.query.filter_by(name='Starter').first()
        if not starter_plan:
            print("Plano Starter nao encontrado!")
            return
        
        # Cria empresa de teste
        trial_company = Company(
            name='Empresa de Teste',
            domain='teste.com',
            plan_id=starter_plan.id,
            status='active',
            created_at=datetime.datetime.utcnow().isoformat(),
            updated_at=datetime.datetime.utcnow().isoformat(),
            trial_ends_at=(datetime.datetime.utcnow() + datetime.timedelta(days=14)).isoformat()
        )
        db.session.add(trial_company)
        db.session.commit()
        
        # Cria assinatura de trial
        trial_subscription = Subscription(
            company_id=trial_company.id,
            plan_id=starter_plan.id,
            status='trialing',
            created_at=datetime.datetime.utcnow().isoformat(),
            updated_at=datetime.datetime.utcnow().isoformat()
        )
        db.session.add(trial_subscription)
        
        # Cria limites da empresa
        company_limits = CompanyLimits(
            company_id=trial_company.id,
            current_members=0,
            current_rundowns=0,
            current_storage_gb=0.0,
            last_updated=datetime.datetime.utcnow().isoformat()
        )
        db.session.add(company_limits)
        
        db.session.commit()
        print(f"Empresa de teste criada com ID: {trial_company.id}")

if __name__ == '__main__':
    create_plans()
    create_trial_company()
    print("\nSetup inicial do SaaS concluido!")
