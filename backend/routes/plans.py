from flask import Blueprint, request, jsonify
from models import db, Plan, Company, Subscription
from auth_utils import jwt_required
import datetime

plans_bp = Blueprint('plans', __name__, url_prefix='/api/plans')

# Listar todos os planos disponíveis
@plans_bp.route('', methods=['GET'])
def get_plans():
    try:
        plans = Plan.query.filter_by(is_active=True).all()
        result = []
        for plan in plans:
            features = []
            if plan.features:
                try:
                    import json
                    features = json.loads(plan.features)
                except:
                    features = []
            
            result.append({
                'id': plan.id,
                'name': plan.name,
                'description': plan.description,
                'price': plan.price,
                'max_members': plan.max_members,
                'max_rundowns': plan.max_rundowns,
                'max_storage_gb': plan.max_storage_gb,
                'features': features,
                'billing_cycle': plan.billing_cycle
            })
        
        return jsonify({'plans': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obter plano específico
@plans_bp.route('/<int:plan_id>', methods=['GET'])
def get_plan(plan_id):
    try:
        plan = Plan.query.get(plan_id)
        if not plan or not plan.is_active:
            return jsonify({'error': 'Plano não encontrado'}), 404
        
        features = []
        if plan.features:
            try:
                import json
                features = json.loads(plan.features)
            except:
                features = []
        
        return jsonify({
            'id': plan.id,
            'name': plan.name,
            'description': plan.description,
            'price': plan.price,
            'max_members': plan.max_members,
            'max_rundowns': plan.max_rundowns,
            'max_storage_gb': plan.max_storage_gb,
            'features': features,
            'billing_cycle': plan.billing_cycle
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Obter estatísticas de uso da empresa atual
@plans_bp.route('/usage', methods=['GET'])
@jwt_required()
def get_usage_stats():
    try:
        from flask import g
        from models import CompanyLimits
        
        company_id = g.current_user.company_id
        company = Company.query.get(company_id)
        
        if not company or not company.plan:
            return jsonify({'error': 'Empresa ou plano não encontrado'}), 404
        
        # Busca limites da empresa
        limits = CompanyLimits.query.filter_by(company_id=company_id).first()
        if not limits:
            limits = CompanyLimits(company_id=company_id)
            db.session.add(limits)
            db.session.commit()
        
        return jsonify({
            'members': {
                'current': limits.current_members,
                'limit': company.plan.max_members,
                'percentage': (limits.current_members / company.plan.max_members) * 100
            },
            'rundowns': {
                'current': limits.current_rundowns,
                'limit': company.plan.max_rundowns,
                'percentage': (limits.current_rundowns / company.plan.max_rundowns) * 100
            },
            'storage': {
                'current': limits.current_storage_gb,
                'limit': company.plan.max_storage_gb,
                'percentage': (limits.current_storage_gb / company.plan.max_storage_gb) * 100
            },
            'plan': {
                'name': company.plan.name,
                'price': company.plan.price,
                'billing_cycle': company.plan.billing_cycle
            },
            'company_status': company.status,
            'trial_ends_at': company.trial_ends_at
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Atualizar plano da empresa (apenas admin)
@plans_bp.route('/change', methods=['POST'])
@jwt_required(allowed_roles=['admin'])
def change_plan():
    try:
        from flask import g
        data = request.get_json()
        new_plan_id = data.get('plan_id')
        
        if not new_plan_id:
            return jsonify({'error': 'ID do plano é obrigatório'}), 400
        
        # Verifica se o plano existe
        new_plan = Plan.query.get(new_plan_id)
        if not new_plan or not new_plan.is_active:
            return jsonify({'error': 'Plano não encontrado'}), 404
        
        company_id = g.current_user.company_id
        company = Company.query.get(company_id)
        
        if not company:
            return jsonify({'error': 'Empresa não encontrada'}), 404
        
        # Atualiza o plano da empresa
        company.plan_id = new_plan_id
        company.updated_at = datetime.datetime.utcnow().isoformat()
        
        # Cria nova assinatura
        subscription = Subscription(
            company_id=company_id,
            plan_id=new_plan_id,
            status='active',
            created_at=datetime.datetime.utcnow().isoformat(),
            updated_at=datetime.datetime.utcnow().isoformat()
        )
        db.session.add(subscription)
        db.session.commit()
        
        return jsonify({
            'message': 'Plano alterado com sucesso',
            'new_plan': {
                'id': new_plan.id,
                'name': new_plan.name,
                'price': new_plan.price
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Cancelar assinatura
@plans_bp.route('/cancel', methods=['POST'])
@jwt_required(allowed_roles=['admin'])
def cancel_subscription():
    try:
        from flask import g
        company_id = g.current_user.company_id
        
        # Busca assinatura ativa
        subscription = Subscription.query.filter_by(
            company_id=company_id, 
            status='active'
        ).first()
        
        if not subscription:
            return jsonify({'error': 'Assinatura ativa não encontrada'}), 404
        
        # Cancela a assinatura
        subscription.status = 'cancelled'
        subscription.cancelled_at = datetime.datetime.utcnow().isoformat()
        subscription.updated_at = datetime.datetime.utcnow().isoformat()
        
        # Suspende a empresa
        company = Company.query.get(company_id)
        company.status = 'suspended'
        company.updated_at = datetime.datetime.utcnow().isoformat()
        
        db.session.commit()
        
        return jsonify({'message': 'Assinatura cancelada com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
