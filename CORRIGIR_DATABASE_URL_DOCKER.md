# 🔧 Corrigir DATABASE_URL no Docker Compose

## ❌ Problema

Backend está tentando conectar em `localhost:5433` em vez de `postgres:5432`.

## ✅ Solução

O `docker-compose.yml` foi corrigido. Agora execute na VPS:

### **1. Parar containers:**

```bash
cd /var/www/apront
docker compose down
```

### **2. Verificar se arquivo .env do backend existe e está correto:**

```bash
cat backend/.env
```

**Deve mostrar:**
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
REDIS_URL=redis://redis:6379/0
FLASK_ENV=production
SECRET_KEY=SUA_SECRET_KEY_AQUI
JWT_SECRET_KEY=SUA_JWT_SECRET_KEY_AQUI
```

**Se não existir ou estiver incorreto, crie/edite:**

```bash
nano backend/.env
```

**Cole:**
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
REDIS_URL=redis://redis:6379/0
FLASK_ENV=production
SECRET_KEY=SUA_SECRET_KEY_AQUI
JWT_SECRET_KEY=SUA_JWT_SECRET_KEY_AQUI
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **3. Rebuild e iniciar containers:**

```bash
docker compose build --no-cache backend
docker compose up -d
```

### **4. Verificar logs:**

```bash
docker compose logs backend | tail -30
```

**Procure por:**
- ✅ `Usando PostgreSQL: postgres:5432/apront_db`
- ✅ `WebSocket CORS: Permitindo qualquer origem em produção`
- ❌ **NÃO deve mostrar:** `localhost:5433`

### **5. Se ainda der erro, verificar variáveis dentro do container:**

```bash
docker compose exec backend env | grep -E "DATABASE_URL|FLASK_ENV"
```

**Deve mostrar:**
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
FLASK_ENV=production
```

## 📋 Comandos Completos:

```bash
cd /var/www/apront
docker compose down
cat backend/.env
# Se .env não existir ou estiver errado, edite com nano
docker compose build --no-cache backend
docker compose up -d
docker compose logs backend | tail -30
```

## ✅ Checklist:

- [ ] `docker-compose.yml` com `FLASK_ENV=production`
- [ ] `backend/.env` existe e está correto
- [ ] `DATABASE_URL` aponta para `postgres:5432` (não `localhost:5433`)
- [ ] Containers rebuildados e iniciados
- [ ] Logs mostram conexão correta com PostgreSQL

