#!/usr/bin/env python3
"""
Script principal para iniciar Backend e Frontend no Replit
"""
import subprocess
import sys
import os
import time
import threading
from pathlib import Path

def start_backend():
    """Inicia o servidor Flask (Backend)"""
    print("🚀 Iniciando Backend Flask...")
    os.chdir("backend")
    try:
        # Usa a porta do ambiente ou padrão 5001
        port = int(os.getenv('PORT', 5001))
        print(f"📡 Backend será iniciado na porta {port}")
        subprocess.run([sys.executable, "app.py"], check=True)
    except KeyboardInterrupt:
        print("\n⚠️  Backend interrompido")
    except Exception as e:
        print(f"❌ Erro ao iniciar backend: {e}")
        import traceback
        traceback.print_exc()

def start_frontend():
    """Inicia o servidor Vite (Frontend)"""
    print("🚀 Iniciando Frontend React...")
    # Aguarda backend iniciar
    time.sleep(5)
    try:
        frontend_port = os.getenv('FRONTEND_PORT', '3000')
        print(f"📡 Frontend será iniciado na porta {frontend_port}")
        subprocess.run(["npm", "run", "dev"], check=True)
    except KeyboardInterrupt:
        print("\n⚠️  Frontend interrompido")
    except Exception as e:
        print(f"❌ Erro ao iniciar frontend: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Função principal"""
    print("=" * 50)
    print("   SISTEMA APRONT - INICIANDO NO REPLIT")
    print("=" * 50)
    print()
    
    # Verifica se estamos na raiz do projeto
    if not Path("backend").exists():
        print("❌ Erro: Pasta 'backend' não encontrada!")
        print("   Certifique-se de executar este script na raiz do projeto.")
        sys.exit(1)
    
    if not Path("package.json").exists():
        print("❌ Erro: Arquivo 'package.json' não encontrado!")
        print("   Certifique-se de que o frontend está configurado.")
        sys.exit(1)
    
    # Instala dependências do backend se necessário
    print("📦 Verificando dependências do backend...")
    backend_requirements = Path("backend/requirements.txt")
    if backend_requirements.exists():
        print("   Instalando dependências Python...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(backend_requirements)], check=False)
    
    # Instala dependências do frontend se necessário
    if not Path("node_modules").exists():
        print("📦 Instalando dependências do frontend...")
        subprocess.run(["npm", "install"], check=False)
    
    print()
    print("✅ Dependências verificadas!")
    print()
    
    # Inicia backend em thread separada
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Aguarda um pouco antes de iniciar frontend
    time.sleep(3)
    
    # Inicia frontend na thread principal
    try:
        start_frontend()
    except KeyboardInterrupt:
        print("\n\n🛑 Encerrando servidores...")
        sys.exit(0)

if __name__ == "__main__":
    main()

