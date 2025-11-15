# 🔍 Verificar e Corrigir Problema na VPS

## ✅ DATABASE_URL está Correta

Você confirmou que está:
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
```

## 🔍 Próximos Passos de Diagnóstico

### **1. Verificar se PostgreSQL está rodando:**

```bash
cd /var/www/apront
docker compose ps postgres
```

**Deve mostrar:** `Up` e `healthy`

### **2. Verificar logs do PostgreSQL:**

```bash
docker compose logs postgres | tail -20
```

**Deve mostrar:** PostgreSQL iniciado e escutando

### **3. Testar conexão do backend ao PostgreSQL:**

```bash
# Entrar no container do backend
docker compose exec backend bash

# Dentro do container, testar conexão
python -c "
import os
import psycopg2
db_url = os.getenv('DATABASE_URL')
print(f'DATABASE_URL: {db_url}')
try:
    conn = psycopg2.connect(db_url)
    print('✅ Conexão bem-sucedida!')
    conn.close()
except Exception as e:
    print(f'❌ Erro: {e}')
"

# Sair do container
exit
```

### **4. Verificar variáveis de ambiente no container:**

```bash
docker compose exec backend env | grep -i database
```

**Deve mostrar:**
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
```

### **5. Ver logs completos do backend:**

```bash
docker compose logs backend | tail -50
```

**Procure por:**
- `✅ Usando PostgreSQL: postgres:5432/apront_db`
- `❌ localhost:5433`
- `Connection refused`

## 🔧 Soluções Possíveis

### **Solução 1: Forçar FLASK_ENV=production**

O código pode estar detectando como desenvolvimento. Edite o `docker-compose.yml`:

```bash
cd /var/www/apront
nano docker-compose.yml
```

**Garanta que está assim:**

```yaml
backend:
  environment:
    - DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
    - REDIS_URL=redis://redis:6379/0
    - FLASK_ENV=production  # ← Garanta que está como 'production'
    - SECRET_KEY=SUA_SECRET_KEY
    - JWT_SECRET_KEY=SUA_JWT_SECRET_KEY
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **Solução 2: Verificar se há código usando localhost:5433**

```bash
cd /var/www/apront/backend
grep -r "localhost.*5433\|5433" .
```

**Se encontrar algo, compartilhe o resultado.**

### **Solução 3: Rebuild do container backend**

```bash
cd /var/www/apront

# Parar tudo
docker compose down

# Rebuild do backend (força reconstruir)
docker compose build --no-cache backend

# Iniciar
docker compose up -d

# Ver logs
docker compose logs -f backend
```

### **Solução 4: Verificar rede Docker**

```bash
# Verificar se containers estão na mesma rede
docker network ls
docker network inspect apront_apront-network
```

**Deve mostrar:** `postgres`, `redis`, `backend` na mesma rede

## 🧪 Teste Completo

Execute este script de teste:

```bash
cd /var/www/apront

# 1. Verificar containers
echo "=== Containers ==="
docker compose ps

# 2. Verificar PostgreSQL
echo "=== PostgreSQL ==="
docker compose exec postgres pg_isready -U apront_user -d apront_db

# 3. Verificar variáveis no backend
echo "=== Variáveis Backend ==="
docker compose exec backend env | grep DATABASE_URL

# 4. Testar conexão
echo "=== Teste Conexão ==="
docker compose exec backend python -c "
import os
print('DATABASE_URL:', os.getenv('DATABASE_URL'))
"
```

## 📋 Compartilhe os Resultados

Execute os comandos acima e compartilhe:
1. Resultado de `docker compose ps postgres`
2. Resultado de `docker compose exec backend env | grep DATABASE_URL`
3. Últimas 30 linhas de `docker compose logs backend`

Isso vai ajudar a identificar exatamente onde está o problema!

