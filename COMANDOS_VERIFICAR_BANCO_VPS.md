# 🔍 Comandos para Verificar Banco na VPS

O PostgreSQL não está instalado localmente - o banco está em um serviço externo.

## 📋 Comandos para Executar na VPS

### **1️⃣ Ver Variáveis de Ambiente do Sistema**

```bash
env | grep -iE "(DATABASE|POSTGRES|PG)" | sort
```

### **2️⃣ Ver Variáveis de Ambiente do Docker (se estiver usando)**

```bash
docker exec $(docker ps -q -f name=backend) env | grep -iE "(DATABASE|POSTGRES|PG)" || echo "Backend não está em Docker"
```

### **3️⃣ Ver Arquivo .env do Backend**

```bash
cat ~/Apront/backend/.env 2>/dev/null | grep -iE "(DATABASE|POSTGRES|PG)"
```

### **4️⃣ Ver Processos em Execução (para ver variáveis)**

```bash
ps aux | grep -i "python.*app.py\|gunicorn\|backend" | head -3
```

### **5️⃣ Ver Logs do Backend (pode mostrar a DATABASE_URL)**

```bash
journalctl -u apront-backend -n 50 2>/dev/null | grep -iE "(database|postgres|DATABASE_URL)" || echo "Serviço não encontrado"
```

### **6️⃣ Ver Arquivo de Configuração do Systemd (se existir)**

```bash
cat /etc/systemd/system/apront-backend.service 2>/dev/null | grep -iE "(Environment|DATABASE)"
```

---

## 🚀 COMANDO COMPLETO (Copie e Cole Tudo)

Execute este comando na VPS:

```bash
echo "==========================================" && \
echo "1. VARIÁVEIS DE AMBIENTE DO SISTEMA:" && \
env | grep -iE "(DATABASE|POSTGRES|PG)" | sort && \
echo "" && \
echo "2. ARQUIVO .env:" && \
cat ~/Apront/backend/.env 2>/dev/null | grep -iE "(DATABASE|POSTGRES|PG)" || echo "Arquivo .env não encontrado" && \
echo "" && \
echo "3. PROCESSOS BACKEND:" && \
ps aux | grep -E "python.*app.py|gunicorn|backend" | grep -v grep | head -2 && \
echo "" && \
echo "4. CONTAINER DOCKER (se existir):" && \
docker ps | grep -i backend && \
echo "" && \
echo "5. LOGS RECENTES:" && \
journalctl -u apront-backend -n 20 2>/dev/null | grep -i "database\|DATABASE_URL" | tail -5 || echo "Sem logs de sistema"
```

---

## 💡 IMPORTANTE

Como o banco está em um serviço externo (Railway/similar), você tem 2 opções:

### **Opção A: Rodar migração via Python no backend**

```bash
cd ~/Apront/backend
python3 -c "
import os
from app import app
from models import db
from sqlalchemy import text

with app.app_context():
    db.session.execute(text('ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50)'))
    db.session.execute(text('ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0'))
    db.session.execute(text('ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE'))
    db.session.execute(text('ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT'))
    db.session.commit()
    print('✅ Migração concluída!')
"
```

### **Opção B: Conectar diretamente no banco externo**

Se você tiver a DATABASE_URL, podemos extrair as informações e conectar diretamente.

**Me envie o resultado do comando completo acima para eu te ajudar!**

