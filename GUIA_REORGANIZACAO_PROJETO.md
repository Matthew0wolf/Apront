# 🗂️ GUIA DE REORGANIZAÇÃO DO PROJETO APRONT

## 📋 **Visão Geral**

Este guia documenta a reorganização completa do projeto para melhor manutenibilidade, escalabilidade e padronização.

---

## ⚠️ **IMPORTANTE: QUANDO REORGANIZAR**

**NÃO reorganize enquanto estiver desenvolvendo ativamente!**

Melhor momento:
- ✅ Após completar uma fase de desenvolvimento
- ✅ Antes de fazer deploy em produção
- ✅ Durante janela de manutenção
- ✅ Com backup completo do código

---

## 📂 **NOVA ESTRUTURA PROPOSTA**

### **🔙 BACKEND**

```
backend/
├── app.py                      # ✅ Mantém na raiz
├── models.py                   # ✅ Mantém na raiz
├── websocket_server.py         # ✅ Mantém na raiz
├── Dockerfile                  # ✅ Mantém na raiz
├── requirements.txt            # ✅ Mantém na raiz
├── rundowns.db                 # ✅ Mantém na raiz (dev)
│
├── routes/                     # ✅ JÁ ORGANIZADO
│   ├── auth.py
│   ├── rundown.py
│   ├── scripts.py
│   ├── notifications.py
│   ├── export.py
│   ├── history.py
│   └── ...
│
├── utils/                      # ⬆️ MOVER AQUI
│   ├── auth_utils.py          # DE: backend/auth_utils.py
│   ├── email_utils.py         # DE: backend/email_utils.py
│   ├── limit_utils.py         # DE: backend/limit_utils.py
│   ├── cache_utils.py         # DE: backend/cache_utils.py
│   ├── rate_limiter.py        # DE: backend/rate_limiter.py
│   ├── security_logger.py     # DE: backend/security_logger.py
│   ├── cors_config.py         # DE: backend/cors_config.py
│   └── __init__.py            # CRIAR NOVO
│
├── scripts/                    # ⬆️ MOVER AQUI
│   ├── migrations/
│   │   ├── migrate_to_postgres.py      # DE: backend/migrate_to_postgres.py
│   │   ├── migrate_permissions.py      # DE: backend/migrate_permissions.py
│   │   ├── add_permission_columns.py   # DE: backend/add_permission_columns.py
│   │   ├── add_script_fields.py        # DE: backend/add_script_fields.py
│   │   ├── update_schema.py            # DE: backend/update_schema.py
│   │   └── create_indexes.py           # DE: backend/create_indexes.py
│   │
│   ├── populate/
│   │   ├── populate_db.py              # DE: backend/populate_db.py
│   │   ├── populate_plans.py           # DE: backend/populate_plans.py
│   │   ├── populate_team.py            # DE: backend/populate_team.py
│   │   ├── populate_templates.py       # DE: backend/populate_templates.py
│   │   └── create_test_user.py         # DE: backend/create_test_user.py
│   │
│   ├── backup/
│   │   ├── backup_database.py          # DE: backend/backup_database.py
│   │   ├── restore_database.py         # DE: backend/restore_database.py
│   │   ├── setup_backup_cron.sh        # DE: backend/setup_backup_cron.sh
│   │   └── BACKUP_AUTOMATICO.bat       # DE: backend/BACKUP_AUTOMATICO.bat
│   │
│   └── tests/
│       ├── test_dashboard_data.py      # DE: backend/test_dashboard_data.py
│       ├── test_sync_debug.py          # DE: backend/test_sync_debug.py
│       └── check_data.py               # DE: backend/check_data.py
│
├── docs/                       # ⬆️ MOVER AQUI
│   ├── README.md                       # DE: backend/README.md
│   ├── ROTAS_SCRIPT_API.md             # DE: backend/ROTAS_SCRIPT_API.md
│   ├── AGENDAR_BACKUP_WINDOWS.md       # DE: backend/AGENDAR_BACKUP_WINDOWS.md
│   └── email_config.txt                # DE: backend/email_config.txt
│
├── uploads/                    # ✅ MANTÉM
│   └── avatars/
│
├── instance/                   # ✅ MANTÉM (Flask)
└── backups/                    # CRIAR NOVO (será usado automaticamente)
```

---

### **🎨 FRONTEND**

```
src/
├── main.jsx                    # ✅ Mantém na raiz
├── App.jsx                     # ✅ Mantém na raiz
├── index.css                   # ✅ Mantém na raiz
│
├── components/
│   ├── views/                  # ⬆️ MOVER AQUI (PÁGINAS PRINCIPAIS)
│   │   ├── Dashboard.jsx               # DE: src/components/Dashboard.jsx
│   │   ├── ProjectsView.jsx            # DE: src/components/ProjectsView.jsx
│   │   ├── SettingsView.jsx            # DE: src/components/SettingsView.jsx
│   │   ├── TemplatesView.jsx           # DE: src/components/TemplatesView.jsx
│   │   ├── TeamView.jsx                # DE: src/components/TeamView.jsx
│   │   ├── PlansView.jsx               # DE: src/components/PlansView.jsx
│   │   ├── AnalyticsView.jsx           # DE: src/components/AnalyticsView.jsx
│   │   ├── OperatorView.jsx            # DE: src/components/OperatorView.jsx
│   │   ├── PresenterView.jsx           # DE: src/components/PresenterView.jsx
│   │   ├── PracticeModeView.jsx        # DE: src/components/PracticeModeView.jsx
│   │   ├── RoleSelectionView.jsx       # DE: src/components/RoleSelectionView.jsx
│   │   ├── TransmissionHistoryView.jsx # DE: src/components/TransmissionHistoryView.jsx
│   │   ├── BackupManagementView.jsx    # DE: src/components/BackupManagementView.jsx
│   │   └── SecurityAuditView.jsx       # DE: src/components/SecurityAuditView.jsx
│   │
│   ├── dialogs/                # ⬆️ MOVER AQUI (MODAIS/DIALOGS)
│   │   ├── CreateProjectDialog.jsx     # DE: src/components/CreateProjectDialog.jsx
│   │   ├── EditItemDialog.jsx          # DE: src/components/EditItemDialog.jsx
│   │   ├── EditFolderDialog.jsx        # DE: src/components/EditFolderDialog.jsx
│   │   └── ScriptEditorDialog.jsx      # DE: src/components/ScriptEditorDialog.jsx
│   │
│   ├── guards/                 # ⬆️ MOVER AQUI (PROTEÇÃO DE ROTAS)
│   │   ├── RoleGuard.jsx               # DE: src/components/RoleGuard.jsx
│   │   └── PermissionGuard.jsx         # DE: src/components/PermissionGuard.jsx
│   │
│   ├── shared/                 # ⬆️ MOVER AQUI (COMPONENTES COMPARTILHADOS)
│   │   ├── Sidebar.jsx                 # DE: src/components/Sidebar.jsx
│   │   ├── UserMenu.jsx                # DE: src/components/UserMenu.jsx
│   │   ├── LiveClock.jsx               # DE: src/components/LiveClock.jsx
│   │   ├── MiniPresenterView.jsx       # DE: src/components/MiniPresenterView.jsx
│   │   ├── WelcomeMessage.jsx          # DE: src/components/WelcomeMessage.jsx
│   │   ├── ColorPicker.jsx             # DE: src/components/ColorPicker.jsx
│   │   ├── FormattedScript.jsx         # DE: src/components/FormattedScript.jsx
│   │   ├── CallToAction.jsx            # DE: src/components/CallToAction.jsx
│   │   └── HeroImage.jsx               # DE: src/components/HeroImage.jsx
│   │
│   └── ui/                     # ✅ JÁ ORGANIZADO (Radix UI)
│       ├── button.jsx
│       ├── dialog.jsx
│       └── ...
│
├── contexts/                   # ✅ JÁ ORGANIZADO
├── hooks/                      # ✅ JÁ ORGANIZADO
├── lib/                        # ✅ JÁ ORGANIZADO
└── pages/                      # ✅ JÁ ORGANIZADO
```

---

### **📄 RAIZ DO PROJETO**

```
raiz/
├── backend/                    # ✅ Mantém
├── src/                        # ✅ Mantém
├── public/                     # ✅ Mantém
├── node_modules/               # ✅ Mantém
├── plugins/                    # ✅ Mantém
├── uploads/                    # ✅ Mantém
│
├── docs/                       # ⬆️ MOVER AQUI (TODA DOCUMENTAÇÃO)
│   ├── DOCUMENTACAO_PROJETO_RUNDOWN.md
│   ├── GUIA_INICIO_RAPIDO.md
│   ├── RELATORIO_EXECUTIVO_SISTEMA_RUNDOWN.md
│   ├── RELATORIO_MELHORIAS_SISTEMA.md
│   ├── RESUMO_MELHORIAS.md
│   ├── ROADMAP_IMPLEMENTACAO_APRONT.md
│   ├── SPRINT1_COMPLETO.md
│   ├── FEATURE_TOGGLE_SCRIPT.md
│   ├── FLUXO_TELEPROMPTER_APRONT.md
│   ├── IMPLEMENTACAO_APRESENTADOR_MELHORADO.md
│   ├── MOCKUPS_VISUAIS.md
│   ├── TESTE_SINCRONIZACAO.md
│   ├── TESTE_SINCRONIZACAO_CRITICA.md
│   ├── WEBSOCKET_IMPLEMENTATION_COMPLETE.md
│   ├── MIGRACAO_POSTGRESQL.md
│   └── GUIA_REORGANIZACAO_PROJETO.md (este arquivo)
│
├── scripts/                    # ⬆️ MOVER AQUI (SCRIPTS DA RAIZ)
│   ├── INICIAR_BACKEND.bat
│   └── INICIAR_FRONTEND.bat
│
├── docker-compose.yml          # ✅ Mantém na raiz
├── package.json                # ✅ Mantém na raiz
├── vite.config.js              # ✅ Mantém na raiz
├── tailwind.config.js          # ✅ Mantém na raiz
├── postcss.config.js           # ✅ Mantém na raiz
│
└── ARQUIVOS OBSOLETOS (DELETAR):
    ├── App-simple.jsx          # ❌ Versão de teste antiga
    ├── App-test.jsx            # ❌ Versão de teste antiga
    ├── test-app.html           # ❌ Teste antigo
    ├── index.html              # ❌ Só se não for usado
    └── vite.config.original.js # ❌ Backup desnecessário
```

---

## 🔄 **COMANDOS PARA REORGANIZAÇÃO**

### **⚠️ BACKUP PRIMEIRO!**

```powershell
# 1. Criar backup completo
git add .
git commit -m "Backup antes de reorganização"

# OU copiar pasta inteira
xcopy /E /I /H . ..\apront-backup
```

---

### **🔙 BACKEND - Reorganização**

```powershell
# Mover utilitários
Move-Item backend/auth_utils.py backend/utils/
Move-Item backend/email_utils.py backend/utils/
Move-Item backend/limit_utils.py backend/utils/
Move-Item backend/cache_utils.py backend/utils/
Move-Item backend/rate_limiter.py backend/utils/
Move-Item backend/security_logger.py backend/utils/
Move-Item backend/cors_config.py backend/utils/

# Mover scripts de migração
Move-Item backend/migrate_to_postgres.py backend/scripts/migrations/
Move-Item backend/migrate_permissions.py backend/scripts/migrations/
Move-Item backend/add_permission_columns.py backend/scripts/migrations/
Move-Item backend/add_script_fields.py backend/scripts/migrations/
Move-Item backend/update_schema.py backend/scripts/migrations/
Move-Item backend/create_indexes.py backend/scripts/migrations/

# Mover scripts de populate
Move-Item backend/populate_db.py backend/scripts/populate/
Move-Item backend/populate_plans.py backend/scripts/populate/
Move-Item backend/populate_team.py backend/scripts/populate/
Move-Item backend/populate_templates.py backend/scripts/populate/
Move-Item backend/create_test_user.py backend/scripts/populate/

# Mover scripts de backup
Move-Item backend/backup_database.py backend/scripts/backup/
Move-Item backend/restore_database.py backend/scripts/backup/
Move-Item backend/setup_backup_cron.sh backend/scripts/backup/
Move-Item backend/BACKUP_AUTOMATICO.bat backend/scripts/backup/

# Mover scripts de teste
Move-Item backend/test_dashboard_data.py backend/scripts/tests/
Move-Item backend/test_sync_debug.py backend/scripts/tests/
Move-Item backend/check_data.py backend/scripts/tests/

# Mover documentação
Move-Item backend/README.md backend/docs/
Move-Item backend/ROTAS_SCRIPT_API.md backend/docs/
Move-Item backend/AGENDAR_BACKUP_WINDOWS.md backend/docs/
Move-Item backend/email_config.txt backend/docs/
```

---

### **🎨 FRONTEND - Reorganização**

```powershell
# Mover Views (páginas principais)
Move-Item src/components/Dashboard.jsx src/components/views/
Move-Item src/components/ProjectsView.jsx src/components/views/
Move-Item src/components/SettingsView.jsx src/components/views/
Move-Item src/components/TemplatesView.jsx src/components/views/
Move-Item src/components/TeamView.jsx src/components/views/
Move-Item src/components/PlansView.jsx src/components/views/
Move-Item src/components/AnalyticsView.jsx src/components/views/
Move-Item src/components/OperatorView.jsx src/components/views/
Move-Item src/components/PresenterView.jsx src/components/views/
Move-Item src/components/PracticeModeView.jsx src/components/views/
Move-Item src/components/RoleSelectionView.jsx src/components/views/
Move-Item src/components/TransmissionHistoryView.jsx src/components/views/
Move-Item src/components/BackupManagementView.jsx src/components/views/
Move-Item src/components/SecurityAuditView.jsx src/components/views/

# Mover Dialogs (modais)
Move-Item src/components/CreateProjectDialog.jsx src/components/dialogs/
Move-Item src/components/EditItemDialog.jsx src/components/dialogs/
Move-Item src/components/EditFolderDialog.jsx src/components/dialogs/
Move-Item src/components/ScriptEditorDialog.jsx src/components/dialogs/

# Mover Guards (proteção)
Move-Item src/components/RoleGuard.jsx src/components/guards/
Move-Item src/components/PermissionGuard.jsx src/components/guards/

# Mover Shared (compartilhados)
Move-Item src/components/Sidebar.jsx src/components/shared/
Move-Item src/components/UserMenu.jsx src/components/shared/
Move-Item src/components/LiveClock.jsx src/components/shared/
Move-Item src/components/MiniPresenterView.jsx src/components/shared/
Move-Item src/components/WelcomeMessage.jsx src/components/shared/
Move-Item src/components/ColorPicker.jsx src/components/shared/
Move-Item src/components/FormattedScript.jsx src/components/shared/
Move-Item src/components/CallToAction.jsx src/components/shared/
Move-Item src/components/HeroImage.jsx src/components/shared/
```

---

### **📄 RAIZ - Reorganização**

```powershell
# Mover documentação
Move-Item DOCUMENTACAO_PROJETO_RUNDOWN.md docs/
Move-Item GUIA_INICIO_RAPIDO.md docs/
Move-Item RELATORIO_EXECUTIVO_SISTEMA_RUNDOWN.md docs/
Move-Item RELATORIO_MELHORIAS_SISTEMA.md docs/
Move-Item RESUMO_MELHORIAS.md docs/
Move-Item ROADMAP_IMPLEMENTACAO_APRONT.md docs/
Move-Item SPRINT1_COMPLETO.md docs/
Move-Item FEATURE_TOGGLE_SCRIPT.md docs/
Move-Item FLUXO_TELEPROMPTER_APRONT.md docs/
Move-Item IMPLEMENTACAO_APRESENTADOR_MELHORADO.md docs/
Move-Item MOCKUPS_VISUAIS.md docs/
Move-Item TESTE_SINCRONIZACAO.md docs/
Move-Item TESTE_SINCRONIZACAO_CRITICA.md docs/
Move-Item WEBSOCKET_IMPLEMENTATION_COMPLETE.md docs/
Move-Item MIGRACAO_POSTGRESQL.md docs/

# Mover scripts
Move-Item INICIAR_BACKEND.bat scripts/
Move-Item INICIAR_FRONTEND.bat scripts/

# DELETAR arquivos obsoletos
Remove-Item src/App-simple.jsx
Remove-Item src/App-test.jsx
Remove-Item test-app.html
Remove-Item vite.config.original.js
```

---

## 🔧 **ATUALIZAR IMPORTS APÓS REORGANIZAÇÃO**

### **Backend - Atualizar app.py:**

```python
# ANTES:
from auth_utils import jwt_required
from email_utils import send_email
from limit_utils import limit_check

# DEPOIS:
from utils.auth_utils import jwt_required
from utils.email_utils import send_email
from utils.limit_utils import limit_check
```

### **Frontend - Atualizar App.jsx:**

```javascript
// ANTES:
import Dashboard from '@/components/Dashboard';
import ProjectsView from '@/components/ProjectsView';
import OperatorView from '@/components/OperatorView';

// DEPOIS:
import Dashboard from '@/components/views/Dashboard';
import ProjectsView from '@/components/views/ProjectsView';
import OperatorView from '@/components/views/OperatorView';
```

---

## 📝 **SCRIPT AUTOMÁTICO DE REORGANIZAÇÃO**

Crie arquivo `reorganizar.ps1`:

```powershell
# reorganizar.ps1 - Script PowerShell para reorganizar projeto

Write-Host "🔄 Iniciando reorganização..." -ForegroundColor Cyan

# Backup primeiro!
Write-Host "📦 Criando backup..." -ForegroundColor Yellow
Copy-Item -Recurse . ..\apront-backup-$(Get-Date -Format 'yyyyMMdd_HHmmss')

# Backend Utils
Write-Host "📁 Reorganizando backend/utils..." -ForegroundColor Green
Move-Item backend/auth_utils.py backend/utils/ -Force
Move-Item backend/email_utils.py backend/utils/ -Force
Move-Item backend/limit_utils.py backend/utils/ -Force
Move-Item backend/cache_utils.py backend/utils/ -Force
Move-Item backend/rate_limiter.py backend/utils/ -Force
Move-Item backend/security_logger.py backend/utils/ -Force
Move-Item backend/cors_config.py backend/utils/ -Force

# Backend Scripts
Write-Host "📁 Reorganizando backend/scripts..." -ForegroundColor Green
Move-Item backend/migrate_to_postgres.py backend/scripts/migrations/ -Force
Move-Item backend/create_indexes.py backend/scripts/migrations/ -Force
Move-Item backend/backup_database.py backend/scripts/backup/ -Force
Move-Item backend/restore_database.py backend/scripts/backup/ -Force
# ... (adicione todos conforme lista acima)

# Frontend Views
Write-Host "📁 Reorganizando src/components/views..." -ForegroundColor Green
Move-Item src/components/Dashboard.jsx src/components/views/ -Force
Move-Item src/components/ProjectsView.jsx src/components/views/ -Force
# ... (adicione todos conforme lista acima)

# Docs
Write-Host "📁 Reorganizando docs..." -ForegroundColor Green
Move-Item DOCUMENTACAO_PROJETO_RUNDOWN.md docs/ -Force
Move-Item GUIA_INICIO_RAPIDO.md docs/ -Force
# ... (adicione todos conforme lista acima)

Write-Host "✅ Reorganização concluída!" -ForegroundColor Green
Write-Host "⚠️  IMPORTANTE: Atualize os imports manualmente!" -ForegroundColor Yellow
```

**Uso:**
```powershell
.\reorganizar.ps1
```

---

## ⚡ **ATUALIZAÇÃO DE IMPORTS (AUTOMÁTICA)**

Depois de reorganizar, atualize imports automaticamente:

### **Backend:**

```python
# Criar arquivo: backend/utils/__init__.py
"""
Utilitários do backend
"""
from .auth_utils import *
from .email_utils import *
from .limit_utils import *
from .cache_utils import *
from .rate_limiter import *
from .security_logger import *
from .cors_config import *
```

Então nos arquivos:
```python
# Em vez de:
from auth_utils import jwt_required

# Use:
from utils import jwt_required
```

### **Frontend:**

Use path aliases no `vite.config.js` (já configurado):

```javascript
// Já funciona:
import Dashboard from '@/components/views/Dashboard';
import CreateProjectDialog from '@/components/dialogs/CreateProjectDialog';
import RoleGuard from '@/components/guards/RoleGuard';
import Sidebar from '@/components/shared/Sidebar';
```

---

## 📊 **BENEFÍCIOS DA REORGANIZAÇÃO**

### **Antes:**
```
backend/ (27 arquivos soltos)
src/components/ (27 componentes misturados)
raiz/ (15+ arquivos .md)
```

### **Depois:**
```
backend/
  ├── utils/ (7 arquivos organizados)
  ├── scripts/
  │   ├── migrations/ (6 arquivos)
  │   ├── populate/ (5 arquivos)
  │   ├── backup/ (4 arquivos)
  │   └── tests/ (3 arquivos)
  └── docs/ (4 arquivos)

src/components/
  ├── views/ (14 componentes)
  ├── dialogs/ (4 componentes)
  ├── guards/ (2 componentes)
  └── shared/ (9 componentes)

raiz/
  ├── docs/ (15 documentos)
  └── scripts/ (2 scripts)
```

### **Vantagens:**
- ✅ **Fácil navegação** - Encontra arquivos rapidamente
- ✅ **Escalabilidade** - Fácil adicionar novos arquivos
- ✅ **Manutenibilidade** - Código mais limpo
- ✅ **Onboarding** - Novos devs entendem estrutura
- ✅ **Padrão da indústria** - Segue melhores práticas

---

## 🎯 **CHECKLIST DE REORGANIZAÇÃO**

### **Antes de Começar:**
- [ ] Criar backup completo
- [ ] Commit todas as mudanças pendentes
- [ ] Testar sistema funcionando
- [ ] Avisar equipe (se houver)

### **Durante:**
- [ ] Criar todas as pastas primeiro
- [ ] Mover arquivos do backend
- [ ] Mover arquivos do frontend
- [ ] Mover documentação
- [ ] Deletar arquivos obsoletos

### **Depois:**
- [ ] Atualizar imports do backend
- [ ] Atualizar imports do frontend
- [ ] Testar backend (rodar app.py)
- [ ] Testar frontend (npm run dev)
- [ ] Verificar rotas funcionando
- [ ] Fazer commit da reorganização

---

## 🚨 **CUIDADOS IMPORTANTES**

### **1. Não Reorganizar Se:**
- ❌ Sistema em produção sem janela de manutenção
- ❌ Tem mudanças não commitadas importantes
- ❌ Não tem backup
- ❌ Está no meio de desenvolvimento urgente

### **2. Ordem de Reorganização:**
1. **Backend primeiro** (menos dependências)
2. **Frontend depois** (mais dependências)
3. **Docs por último** (sem código)

### **3. Testar Após Cada Etapa:**
- Mova um grupo (ex: utils)
- Atualize imports
- Teste
- Só então continue

---

## 📝 **IMPORTS A ATUALIZAR**

### **Backend (principais):**

| Arquivo | Linha Aproximada | Import Antigo | Import Novo |
|---------|------------------|---------------|-------------|
| `app.py` | ~5-15 | `from auth_utils import` | `from utils.auth_utils import` |
| `app.py` | ~68-69 | `from rate_limiter import` | `from utils.rate_limiter import` |
| `routes/auth.py` | ~4-6 | `from rate_limiter import` | `from utils.rate_limiter import` |
| `routes/rundown.py` | ~8 | `from cache_utils import` | `from utils.cache_utils import` |
| Todas as rotas | Variado | `from auth_utils import jwt_required` | `from utils.auth_utils import jwt_required` |

### **Frontend (principais):**

| Arquivo | Import Antigo | Import Novo |
|---------|---------------|-------------|
| `App.jsx` | `from '@/components/Dashboard'` | `from '@/components/views/Dashboard'` |
| `App.jsx` | `from '@/components/OperatorView'` | `from '@/components/views/OperatorView'` |
| `App.jsx` | `from '@/components/RoleGuard'` | `from '@/components/guards/RoleGuard'` |
| `views/*.jsx` | `from '@/components/Sidebar'` | `from '@/components/shared/Sidebar'` |
| `views/*.jsx` | `from '@/components/EditItemDialog'` | `from '@/components/dialogs/EditItemDialog'` |

---

## 🤖 **SCRIPT COMPLETO DE ATUALIZAÇÃO DE IMPORTS**

Salve como `update_imports.py`:

```python
import os
import re

# Mapeamento de imports a atualizar
BACKEND_REPLACEMENTS = {
    'from auth_utils import': 'from utils.auth_utils import',
    'from email_utils import': 'from utils.email_utils import',
    'from limit_utils import': 'from utils.limit_utils import',
    'from cache_utils import': 'from utils.cache_utils import',
    'from rate_limiter import': 'from utils.rate_limiter import',
    'from security_logger import': 'from utils.security_logger import',
    'from cors_config import': 'from utils.cors_config import',
}

FRONTEND_REPLACEMENTS = {
    "from '@/components/Dashboard'": "from '@/components/views/Dashboard'",
    "from '@/components/ProjectsView'": "from '@/components/views/ProjectsView'",
    "from '@/components/OperatorView'": "from '@/components/views/OperatorView'",
    "from '@/components/PresenterView'": "from '@/components/views/PresenterView'",
    "from '@/components/RoleGuard'": "from '@/components/guards/RoleGuard'",
    "from '@/components/PermissionGuard'": "from '@/components/guards/PermissionGuard'",
    "from '@/components/Sidebar'": "from '@/components/shared/Sidebar'",
    "from '@/components/EditItemDialog'": "from '@/components/dialogs/EditItemDialog'",
    # ... adicione todos
}

def update_file(filepath, replacements):
    """Atualiza imports em um arquivo"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        for old, new in replacements.items():
            content = content.replace(old, new)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Atualizado: {filepath}")
            return True
        
        return False
    except Exception as e:
        print(f"❌ Erro em {filepath}: {e}")
        return False

# Atualizar backend
print("🔧 Atualizando imports do backend...")
for root, dirs, files in os.walk('backend'):
    for file in files:
        if file.endswith('.py'):
            filepath = os.path.join(root, file)
            update_file(filepath, BACKEND_REPLACEMENTS)

# Atualizar frontend
print("\n🔧 Atualizando imports do frontend...")
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            update_file(filepath, FRONTEND_REPLACEMENTS)

print("\n✅ Imports atualizados!")
```

---

## 💡 **RECOMENDAÇÃO FINAL**

### **Opção 1: Reorganização Completa (Recomendado)**
- ✅ Faça tudo de uma vez
- ✅ Use o script PowerShell
- ✅ Atualize imports com Python
- ✅ Teste tudo
- ⏱️ Tempo: 2-3 horas

### **Opção 2: Reorganização Gradual (Mais Seguro)**
- ✅ Reorganize apenas backend primeiro
- ✅ Teste
- ✅ Depois frontend
- ✅ Teste
- ✅ Por último docs
- ⏱️ Tempo: 1 semana (fazendo aos poucos)

### **Opção 3: Apenas Novos Arquivos (Mínimo)**
- ✅ Deixe arquivos antigos onde estão
- ✅ Novos arquivos já vão para pastas corretas
- ✅ Migre aos poucos quando mexer em cada arquivo
- ⏱️ Tempo: Contínuo

---

## ✅ **MINHA RECOMENDAÇÃO**

**Faça a reorganização completa AGORA porque:**

1. ✅ Sistema está estável (9 sprints completas)
2. ✅ Você está sozinho (não vai atrapalhar equipe)
3. ✅ Antes de produção (melhor agora que depois)
4. ✅ Facilita próximas sprints
5. ✅ Projeto ficará mais profissional

**Tempo estimado:** 2-3 horas (com calma e atenção)

---

**Quer que eu crie o script completo de reorganização automática?** 

Posso criar um script PowerShell que:
1. Cria backup automático
2. Move todos os arquivos
3. Atualiza todos os imports
4. Testa se funcionou
5. Faz rollback se der erro

**Criar o script?** 🤖
