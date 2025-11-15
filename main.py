#!/usr/bin/env python3
"""
Script principal para iniciar Backend Flask
"""
import subprocess
import sys
import os
from pathlib import Path

def main():
    """Função principal"""
    print("=" * 50)
    print("   SISTEMA APRONT - INICIANDO BACKEND")
    print("=" * 50)
    print()
    
    # Obtém o diretório do script
    script_dir = Path(__file__).parent.absolute()
    backend_dir = script_dir / "backend"
    
    # Verifica se a pasta backend existe
    if not backend_dir.exists():
        print(f"❌ Erro: Pasta 'backend' não encontrada em {script_dir}!")
        print("   Certifique-se de executar este script na raiz do projeto.")
        sys.exit(1)
    
    # Verifica se o app.py existe
    app_py = backend_dir / "app.py"
    if not app_py.exists():
        print(f"❌ Erro: Arquivo 'app.py' não encontrado em {backend_dir}!")
        sys.exit(1)
    
    # Instala dependências do backend se necessário
    print("📦 Verificando dependências do backend...")
    backend_requirements = backend_dir / "requirements.txt"
    if backend_requirements.exists():
        print("   Instalando dependências Python...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", str(backend_requirements)],
            check=False
        )
    
    print()
    print("✅ Dependências verificadas!")
    print()
    
    # Muda para o diretório do backend e inicia o servidor
    print("🚀 Iniciando Backend Flask...")
    os.chdir(backend_dir)
    
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
        sys.exit(1)

if __name__ == "__main__":
    main()

