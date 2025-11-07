# 🚀 Guia Completo de Deploy no Replit - Sistema Apront

Este guia explica passo a passo como configurar e fazer o deploy do Sistema Apront no Replit.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Estrutura do Projeto no Replit](#estrutura-do-projeto-no-replit)
3. [Configuração Inicial](#configuração-inicial)
4. [Arquivos de Configuração do Replit](#arquivos-de-configuração-do-replit)
5. [Dependências](#dependências)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Scripts de Inicialização](#scripts-de-inicialização)
8. [Como Iniciar o Sistema](#como-iniciar-o-sistema)
9. [Troubleshooting](#troubleshooting)

---

## 📦 Pré-requisitos

- Conta no Replit (gratuita ou paga)
- Conhecimento básico de terminal/linha de comando
- Projeto já configurado localmente

---

## 📁 Estrutura do Projeto no Replit

O Replit precisa entender que este é um projeto com **dois serviços** (Backend Flask + Frontend React). A estrutura deve ficar assim:

```
/
├── .replit                    # Configuração do Replit
├── .env                       # Variáveis de ambiente (criar)
├── replit.nix                 # Dependências do sistema (criar)
├── main.py                    # Script principal para iniciar tudo
├── backend/                   # Backend Flask
│   ├── app.py
│   ├── requirements.txt
│   ├── models.py
│   ├── routes/
│   └── ...
├── src/                       # Frontend React
│   ├── main.jsx
│   ├── App.jsx
│   └── ...
├── package.json               # Dependências do frontend
├── vite.config.js
└── outros/                    # Arquivos não necessários (pode ignorar)
```

---

## ⚙️ Configuração Inicial

### Passo 1: Criar Novo Repl

1. Acesse [replit.com](https://replit.com)
2. Clique em **"Create Repl"**
3. Escolha **"Import from GitHub"** ou **"Blank Repl"**
4. Se importar do GitHub, cole a URL do seu repositório
5. Escolha o template: **"Python"** (o Replit detectará automaticamente)

### Passo 2: Upload dos Arquivos

Se não importou do GitHub, faça upload de todos os arquivos do projeto:
- Arraste e solte a pasta `backend/`
- Arraste e solte a pasta `src/`
- Arraste e solte os arquivos da raiz (`package.json`, `vite.config.js`, etc.)

---

## 🔧 Arquivos de Configuração do Replit

### 1. Arquivo `.replit`

Crie este arquivo na raiz do projeto:

```toml
# .replit

# Linguagem principal (Python para o backend)
language = "python3"

# Comando para iniciar o projeto
run = "python main.py"

# Configuração do Nix (gerenciador de pacotes)
[nix]
channel = "stable-22_11"

# Configuração de portas
[deploy]
run = ["sh", "-c", "python main.py"]

# Variáveis de ambiente (serão configuradas no painel do Replit)
[env]
PYTHONPATH = "${PYTHONPATH}:."
PORT = "5001"
FRONTEND_PORT = "3000"
```

### 2. Arquivo `replit.nix`

Crie este arquivo na raiz para instalar Node.js e outras dependências do sistema:

```nix
{ pkgs }: {
  deps = [
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.postgresql
  ];
}
```

### 3. Arquivo `main.py` (Script Principal)

Crie este arquivo na raiz para iniciar ambos os serviços:

```python
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
        subprocess.run([sys.executable, "app.py"], check=True)
    except KeyboardInterrupt:
        print("\n⚠️  Backend interrompido")
    except Exception as e:
        print(f"❌ Erro ao iniciar backend: {e}")

def start_frontend():
    """Inicia o servidor Vite (Frontend)"""
    print("🚀 Iniciando Frontend React...")
    # Aguarda backend iniciar
    time.sleep(5)
    try:
        subprocess.run(["npm", "run", "dev"], check=True)
    except KeyboardInterrupt:
        print("\n⚠️  Frontend interrompido")
    except Exception as e:
        print(f"❌ Erro ao iniciar frontend: {e}")

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
    
    # Instala dependências do frontend se necessário
    if not Path("node_modules").exists():
        print("📦 Instalando dependências do frontend...")
        subprocess.run(["npm", "install"], check=True)
    
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
```

---

## 📚 Dependências

### Backend (Python)

O arquivo `backend/requirements.txt` já está configurado. No Replit, execute:

```bash
cd backend
pip install -r requirements.txt
```

Ou instale manualmente:

```bash
pip install flask flask-sqlalchemy flask-socketio flask-compress python-dotenv psycopg2-binary openpyxl
```

### Frontend (Node.js)

O arquivo `package.json` já está configurado. No Replit, execute:

```bash
npm install
```

---

## 🔐 Variáveis de Ambiente

### Configurar no Replit

1. No painel lateral esquerdo, clique no ícone de **"Secrets"** (cadeado)
2. Adicione as seguintes variáveis:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `SECRET_KEY` | `sua-chave-secreta-aqui` | Chave secreta do Flask (gere uma aleatória) |
| `JWT_SECRET_KEY` | `sua-jwt-secret-aqui` | Chave para tokens JWT (gere uma aleatória) |
| `DATABASE_URL` | `postgresql://...` | URL do banco PostgreSQL (opcional, usa SQLite se não configurado) |

### Gerar Chaves Secretas

No terminal do Replit, execute:

```python
import secrets
print("SECRET_KEY:", secrets.token_hex(32))
print("JWT_SECRET_KEY:", secrets.token_hex(32))
```

### Arquivo `.env` (Opcional)

Você também pode criar um arquivo `.env` na raiz:

```env
SECRET_KEY=sua-chave-secreta-aqui
JWT_SECRET_KEY=sua-jwt-secret-aqui
DATABASE_URL=postgresql://usuario:senha@host:porta/database
```

**⚠️ IMPORTANTE:** No Replit, use **Secrets** em vez de `.env` para dados sensíveis.

---

## 🚀 Scripts de Inicialização

### Opção 1: Usar o `main.py` (Recomendado)

O Replit executará automaticamente `main.py` quando você clicar em **"Run"**.

### Opção 2: Scripts Separados

Se preferir iniciar separadamente, crie estes scripts:

**`start_backend.sh`:**
```bash
#!/bin/bash
cd backend
python app.py
```

**`start_frontend.sh`:**
```bash
#!/bin/bash
npm run dev
```

---

## 🎯 Como Iniciar o Sistema

### Método 1: Usando o Botão "Run"

1. Certifique-se de que o arquivo `.replit` está configurado
2. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
3. O sistema iniciará automaticamente backend e frontend

### Método 2: Terminal Manual

Abra o terminal e execute:

```bash
# Instalar dependências (primeira vez)
cd backend && pip install -r requirements.txt && cd ..
npm install

# Iniciar o sistema
python main.py
```

### Método 3: Dois Terminais Separados

**Terminal 1 (Backend):**
```bash
cd backend
python app.py
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

---

## 🌐 Configuração de Portas no Replit

O Replit usa portas dinâmicas. Você precisa ajustar o código para usar as variáveis de ambiente:

### Ajustar `backend/app.py`

Modifique a última linha do arquivo:

```python
# Antes:
socketio.run(app, debug=True, host='0.0.0.0', port=5001)

# Depois (para Replit):
port = int(os.getenv('PORT', 5001))
socketio.run(app, debug=False, host='0.0.0.0', port=port)
```

### Ajustar `vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.FRONTEND_PORT || '3000'),
    host: true,
  },
  // ... resto da configuração
});
```

### Ajustar `src/config/api.js`

Certifique-se de que a URL da API usa a porta correta:

```javascript
const API_URL = import.meta.env.VITE_API_URL || 
  `http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5001}`;
```

---

## 🔍 Troubleshooting

### Problema: "Module not found"

**Solução:**
```bash
# Reinstalar dependências
cd backend
pip install -r requirements.txt
cd ..
npm install
```

### Problema: "Port already in use"

**Solução:**
- O Replit pode estar usando portas diferentes
- Verifique as variáveis de ambiente `PORT` e `FRONTEND_PORT`
- Use `os.getenv('PORT')` no código

### Problema: "CORS Error"

**Solução:**
- Verifique se `cors_config.py` está configurado corretamente
- Adicione a URL do Replit nas origens permitidas

### Problema: "Database connection failed"

**Solução:**
- Se usar SQLite, certifique-se de que a pasta `backend/` tem permissão de escrita
- Se usar PostgreSQL, verifique a variável `DATABASE_URL`

### Problema: Frontend não conecta ao Backend

**Solução:**
- Verifique a URL da API no arquivo `src/config/api.js`
- Use a URL completa do Replit: `https://seu-projeto.repl.co`

---

## 📝 Checklist de Deploy

- [ ] Arquivo `.replit` criado e configurado
- [ ] Arquivo `replit.nix` criado
- [ ] Arquivo `main.py` criado na raiz
- [ ] Dependências do backend instaladas (`pip install -r requirements.txt`)
- [ ] Dependências do frontend instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas (Secrets)
- [ ] Portas ajustadas no código (usar variáveis de ambiente)
- [ ] URL da API ajustada no frontend
- [ ] Testado localmente antes do deploy
- [ ] Banco de dados configurado (SQLite ou PostgreSQL)

---

## 🎉 Pronto!

Após seguir todos os passos, seu sistema estará rodando no Replit. Acesse:

- **Frontend:** `https://seu-projeto.repl.co` (porta 3000)
- **Backend:** `https://seu-projeto.repl.co:5001` (ou a porta configurada)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no terminal do Replit
2. Confira se todas as dependências estão instaladas
3. Verifique as variáveis de ambiente
4. Consulte a documentação do Replit: [docs.replit.com](https://docs.replit.com)

---

**Última atualização:** 2025

