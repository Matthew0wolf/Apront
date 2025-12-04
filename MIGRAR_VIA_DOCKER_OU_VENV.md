# 🔧 Como Rodar Migração quando Flask não está instalado

## ❌ Problema

```
ModuleNotFoundError: No module named 'flask'
```

O Flask não está no Python global, mas o backend está rodando (então tem Flask em algum lugar).

## ✅ Soluções

### **Solução 1: Via Ambiente Virtual**

Se houver um ambiente virtual:

```bash
# Ativar ambiente virtual
source ~/Apront/backend/venv/bin/activate
# ou
source ~/Apront/venv/bin/activate

# Rodar migração
cd ~/Apront/backend
python3 << 'PYEOF'
import os, sys
from pathlib import Path
sys.path.insert(0, str(Path.home() / 'Apront' / 'backend'))
from app import app
from models import db
from sqlalchemy import text
with app.app_context():
    print("=" * 60)
    print("MIGRATION: Adicionando campos de timer")
    print("=" * 60)
    for col, typ in [
        ("timer_started_at", "VARCHAR(50)"),
        ("timer_elapsed_base", "INTEGER DEFAULT 0"),
        ("is_timer_running", "BOOLEAN DEFAULT FALSE"),
        ("current_item_index_json", "TEXT")
    ]:
        try:
            db.session.execute(text(f"ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS {col} {typ}"))
            db.session.commit()
            print(f"✅ {col} adicionada")
        except Exception as e:
            if 'already exists' in str(e).lower() or 'exist' in str(e).lower():
                print(f"ℹ️  {col} já existe")
            else:
                print(f"⚠️  Erro: {e}")
                db.session.rollback()
    result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'rundowns' AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json') ORDER BY column_name"))
    columns = result.fetchall()
    print("\n✅ Colunas verificadas:")
    for col in columns:
        print(f"   - {col[0]}")
    print("\n" + "=" * 60)
    print("✅ Migração concluída!")
    print("=" * 60)
PYEOF
```

### **Solução 2: Via Docker**

Se o backend estiver em Docker:

```bash
# Encontrar container
CONTAINER=$(docker ps -q -f name=backend)

# Rodar migração no container
docker exec -it $CONTAINER python3 << 'PYEOF'
import os, sys
from pathlib import Path
sys.path.insert(0, '/app/backend')
from app import app
from models import db
from sqlalchemy import text
with app.app_context():
    print("=" * 60)
    print("MIGRATION: Adicionando campos de timer")
    print("=" * 60)
    for col, typ in [
        ("timer_started_at", "VARCHAR(50)"),
        ("timer_elapsed_base", "INTEGER DEFAULT 0"),
        ("is_timer_running", "BOOLEAN DEFAULT FALSE"),
        ("current_item_index_json", "TEXT")
    ]:
        try:
            db.session.execute(text(f"ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS {col} {typ}"))
            db.session.commit()
            print(f"✅ {col} adicionada")
        except Exception as e:
            if 'already exists' in str(e).lower():
                print(f"ℹ️  {col} já existe")
            else:
                print(f"⚠️  Erro: {e}")
    print("✅ Migração concluída!")
PYEOF
```

### **Solução 3: Via psql Direto (Mais Simples!)**

Como o banco está em localhost:5433, você pode conectar direto:

```bash
# Instalar cliente PostgreSQL se necessário
apt install postgresql-client -y

# Conectar e rodar SQL
PGPASSWORD=apront_password_2024 psql -h localhost -p 5433 -U apront_user -d apront_db << EOF
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;
SELECT column_name FROM information_schema.columns WHERE table_name = 'rundowns' AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json');
EOF
```

## 🚀 Primeiro: Descobrir Como o Backend Está Rodando

Execute este comando:

```bash
echo "=== PROCESSOS ===" && ps aux | grep -E "python.*app.py|gunicorn|backend" | grep -v grep && echo "" && echo "=== AMBIENTE VIRTUAL ===" && ls -la ~/Apront/backend/venv 2>/dev/null || ls -la ~/Apront/venv 2>/dev/null || echo "Nenhum venv encontrado" && echo "" && echo "=== DOCKER ===" && docker ps | grep -i backend || echo "Nenhum container backend"
```

Me envie o resultado para eu te dizer qual solução usar!

