# Sistema Apront

Sistema de gerenciamento de rundowns para produção de TV.

## 📁 Estrutura do Projeto

- **`src/`** - Código-fonte do frontend (React)
  - `main.jsx` - Ponto de entrada do frontend
- **`backend/`** - Código-fonte do backend (Flask)
  - `app.py` - Ponto de entrada do backend
- **`outros/`** - Arquivos não necessários para produção
  - `documentacao/` - Documentação de desenvolvimento
  - `scripts/` - Scripts auxiliares
  - `logs/` - Arquivos de log
  - `ferramentas/` - Ferramentas de desenvolvimento

## 🚀 Como Iniciar o Projeto

### Pré-requisitos
- Python 3.x instalado
- Node.js e npm instalados

### ⚡ Iniciar Tudo de Uma Vez (Recomendado)

**A forma mais fácil de iniciar o projeto completo:**
```bash
# Windows - Inicia Backend e Frontend simultaneamente
iniciar-projeto.bat
```

Este script abre duas janelas separadas:
- **Backend** na porta **5001** (http://localhost:5001)
- **Frontend** na porta **3000** (http://localhost:3000)

### Iniciar Separadamente

**Iniciar apenas o Backend:**
```bash
# Windows
iniciar-backend.bat

# Ou manualmente:
cd backend
python app.py
```

**Iniciar apenas o Frontend:**
```bash
# Windows
iniciar-frontend.bat

# Ou manualmente:
npm install  # Primeira vez apenas
npm run dev
```

## 📝 Arquivos Principais

- **Frontend**: `src/main.jsx` - Arquivo principal do React
- **Backend**: `backend/app.py` - Arquivo principal do Flask

## 🔧 Configuração

- O backend usa SQLite por padrão (desenvolvimento)
- Para usar PostgreSQL, configure a variável de ambiente `DATABASE_URL` em `backend/app.py`

## 🌐 Deploy no Replit

Para fazer deploy no Replit, consulte o guia completo:

📖 **[GUIA_DEPLOY_REPLIT.md](GUIA_DEPLOY_REPLIT.md)** - Guia completo passo a passo

**Arquivos já configurados para Replit:**
- `.replit` - Configuração do Replit
- `replit.nix` - Dependências do sistema
- `main.py` - Script para iniciar backend e frontend

**Resumo rápido:**
1. Importe o projeto no Replit
2. Configure as Secrets (variáveis de ambiente)
3. Clique em "Run" ou execute `python main.py`

