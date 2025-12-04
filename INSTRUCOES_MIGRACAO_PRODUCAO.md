# 🚀 Instruções Rápidas para Rodar Migração em Produção

## ❌ Problema

Você está vendo este erro:
```
(psycopg2.errors.UndefinedColumn) column rundowns.timer_started_at does not exist
GET /api/rundowns/101/timer-state 500 (INTERNAL SERVER ERROR)
```

E o timer está iniciando automaticamente "ao vivo" quando você entra como operador.

---

## ✅ Solução Rápida - 3 Opções

### **Opção 1: SQL Direto (Mais Rápido)**

Se você tem acesso ao PostgreSQL, execute estes comandos:

```bash
# Conectar no PostgreSQL
psql -h localhost -U seu_usuario -d apront_db
```

Depois cole este SQL:

```sql
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;
```

**OU execute tudo de uma vez:**

```bash
psql -h localhost -U seu_usuario -d apront_db << EOF
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;
EOF
```

### **Opção 2: Usando Python3**

No servidor, encontre onde está o projeto:

```bash
# Procurar o diretório
find / -name "app.py" -path "*/backend/*" 2>/dev/null
```

Depois entre no diretório e rode:

```bash
cd /caminho/encontrado
python3 scripts/migrations/add_timer_state_fields.py
```

**IMPORTANTE:** Use `python3` e não `python`!

### **Opção 3: Copiar Script Python**

Se não encontrar o script, crie um arquivo temporário:

```bash
cat > /tmp/migrate_timer.py << 'EOF'
#!/usr/bin/env python3
import sys
sys.path.insert(0, '/caminho/para/backend')  # AJUSTE ESTE CAMINHO
from app import app
from models import db
from sqlalchemy import text

with app.app_context():
    db.session.execute(text("ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50)"))
    db.session.execute(text("ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0"))
    db.session.execute(text("ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE"))
    db.session.execute(text("ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT"))
    db.session.commit()
    print("✅ Migração concluída!")
EOF

python3 /tmp/migrate_timer.py
```

---

## 🔍 Verificar se Funcionou

Execute no PostgreSQL:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json');
```

Você deve ver **4 linhas** (uma para cada coluna). ✅

---

## 🔄 Depois da Migração

**Reinicie o backend:**

```bash
# Se usar systemd:
sudo systemctl restart apront-backend

# Ou pare e inicie novamente manualmente
```

---

## ✅ Pronto!

Depois disso:
- ✅ O erro 500 vai parar
- ✅ O timer não vai mais iniciar automaticamente
- ✅ Tudo vai funcionar normalmente

---

## 📞 Precisa de Ajuda?

Me informe:
1. Onde está o projeto no servidor (caminho)
2. Como você acessa o PostgreSQL (usuário, senha, host)

