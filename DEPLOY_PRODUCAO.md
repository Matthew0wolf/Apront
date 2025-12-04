# 🚀 Guia de Deploy em Produção

## ✅ Checklist de Migrações Necessárias

### 1. **Campos de Timer State (NOVO - OBRIGATÓRIO)**

Estes campos são necessários para a sincronização em tempo real do timer entre operador e apresentador:

- `timer_started_at` (VARCHAR(50) ou TEXT)
- `timer_elapsed_base` (INTEGER)
- `is_timer_running` (BOOLEAN ou INTEGER)
- `current_item_index_json` (TEXT)

**Script de migração:** `backend/scripts/migrations/add_timer_state_fields.py`

**Como rodar:**
```bash
cd backend
python scripts/migrations/add_timer_state_fields.py
```

---

## 📋 Passo a Passo para Deploy

### 1️⃣ **Backup do Banco de Dados (OBRIGATÓRIO)**

**Antes de qualquer coisa, faça backup do banco de produção:**

```bash
# PostgreSQL
pg_dump -h localhost -U seu_usuario -d apront_db > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Ou usando Python
cd backend
python scripts/backup/backup_database.py
```

### 2️⃣ **Rodar Migrações**

#### **A. Campos de Timer State (NOVO)**

```bash
cd backend
python scripts/migrations/add_timer_state_fields.py
```

Você deve ver:
```
============================================================
MIGRATION: Adicionando campos de estado do timer ao Rundown
============================================================
Tipo de banco detectado: PostgreSQL
Adicionando coluna timer_started_at...
✅ Coluna timer_started_at adicionada com sucesso!
Adicionando coluna timer_elapsed_base...
✅ Coluna timer_elapsed_base adicionada com sucesso!
Adicionando coluna is_timer_running...
✅ Coluna is_timer_running adicionada com sucesso!
Adicionando coluna current_item_index_json...
✅ Coluna current_item_index_json adicionada com sucesso!

✅ Migração concluída com sucesso!
```

**IMPORTANTE:** Se alguma coluna já existir, o script vai pular e continuar. Isso é seguro!

#### **B. Verificar Outras Migrações**

Verifique se já rodou estas migrações anteriores:
- ✅ Campos de script nos items (se não tiver, rodar `add_script_fields.py`)
- ✅ `company_id` nos rundowns (se não tiver, rodar `add_company_id_to_rundowns.py`)

### 3️⃣ **Verificar Configurações de Ambiente**

Certifique-se de que as variáveis de ambiente estão configuradas:

```bash
# Backend (.env ou variáveis de ambiente)
DATABASE_URL=postgresql://usuario:senha@host:porta/apront_db
SECRET_KEY=sua_chave_secreta
JWT_SECRET_KEY=sua_chave_jwt

# Configurações SMTP (se usar email)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app

# Frontend (.env)
VITE_API_BASE_URL=https://seu-dominio.com/api
```

### 4️⃣ **Verificar Estrutura do Banco**

Execute este comando para verificar se todas as colunas existem:

```sql
-- PostgreSQL
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json');
```

Se todas as 4 colunas aparecerem, está tudo certo! ✅

### 5️⃣ **Reiniciar o Backend**

Após as migrações, **reinicie o backend** para garantir que todas as mudanças sejam aplicadas:

```bash
# Parar o backend atual
# (Ctrl+C ou kill do processo)

# Iniciar novamente
cd backend
python app.py
# ou
python main.py
```

### 6️⃣ **Testar em Produção**

Após o deploy, teste:

1. ✅ **Criar um projeto novo**
2. ✅ **Iniciar o timer (deve funcionar normalmente)**
3. ✅ **Pausar o timer (deve persistir o estado)**
4. ✅ **Sincronização entre operador e apresentador**
5. ✅ **Salvar script (deve funcionar mesmo se item não existir no banco)**

---

## 🔍 Verificação Rápida

Execute este comando Python para verificar se tudo está OK:

```python
# backend/scripts/check_migration.py
from app import app
from models import db
from sqlalchemy import inspect, text

with app.app_context():
    inspector = inspect(db.engine)
    columns = [col['name'] for col in inspector.get_columns('rundowns')]
    
    required_fields = [
        'timer_started_at',
        'timer_elapsed_base', 
        'is_timer_running',
        'current_item_index_json'
    ]
    
    print("Verificando campos de timer state...")
    for field in required_fields:
        if field in columns:
            print(f"✅ {field}: OK")
        else:
            print(f"❌ {field}: FALTANDO!")
```

---

## ⚠️ Se Algo Der Errado

### Rollback

Se houver problemas após a migração:

```bash
# Restaurar backup
psql -h localhost -U seu_usuario -d apront_db < backup_pre_migration_YYYYMMDD_HHMMSS.sql
```

### Ver Logs

```bash
# Ver logs do backend
tail -f logs/app.log

# Ou se estiver usando systemd
journalctl -u apront-backend -f
```

---

## ✅ Resumo - O que precisa fazer:

1. ✅ **Backup do banco** (obrigatório!)
2. ✅ **Rodar migração de timer state:** `python scripts/migrations/add_timer_state_fields.py`
3. ✅ **Verificar se todas as colunas foram criadas**
4. ✅ **Reiniciar o backend**
5. ✅ **Testar funcionalidades**

---

## 📝 Notas Importantes

- ✅ As migrações são **idempotentes** (podem rodar múltiplas vezes sem problema)
- ✅ Se uma coluna já existir, o script apenas pula e continua
- ✅ **NUNCA** delete colunas manualmente - sempre use migrations
- ✅ **SEMPRE** faça backup antes de rodar migrações

---

**Boa sorte com o deploy! 🚀**

