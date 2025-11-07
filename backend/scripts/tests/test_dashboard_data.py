from app import app
from models import db, Rundown
import requests
import json

with app.app_context():
    print("=== TESTANDO DADOS DO DASHBOARD ===")
    
    # 1. Verifica rundowns no banco
    rundowns = Rundown.query.all()
    print(f"Rundowns no banco: {len(rundowns)}")
    
    for r in rundowns:
        print(f"- {r.name} (Status: {r.status})")
    
    # 2. Testa a API
    print(f"\nTestando API /api/rundowns...")
    try:
        response = requests.get('http://localhost:5000/api/rundowns')
        if response.status_code == 200:
            data = response.json()
            rundowns_api = data.get('rundowns', [])
            print(f"Rundowns da API: {len(rundowns_api)}")
            
            ativos = [r for r in rundowns_api if r['status'] == 'Ativo']
            modelos = [r for r in rundowns_api if r['status'] == 'Modelo']
            novos = [r for r in rundowns_api if r['status'] == 'Novo']
            
            print(f"Status 'Ativo': {len(ativos)}")
            print(f"Status 'Modelo': {len(modelos)}")
            print(f"Status 'Novo': {len(novos)}")
            
            if ativos:
                print("Rundowns Ativos:")
                for r in ativos:
                    print(f"  - {r['name']}")
        else:
            print(f"Erro na API: {response.status_code}")
    except Exception as e:
        print(f"Erro ao testar API: {e}")
    
    print(f"\n=== ANÁLISE ===")
    print("O dashboard mostra 'Projetos Ativos' baseado no status do rundown.")
    print("Se não há rundowns com status 'Ativo', o número será 0.")
    print("Possíveis soluções:")
    print("1. Alterar status de um rundown para 'Ativo'")
    print("2. Modificar a lógica do dashboard para mostrar outros dados")
    print("3. Adicionar funcionalidade para 'iniciar' um rundown (mudar status)")
