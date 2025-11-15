# 🔧 Corrigir DATABASE_URL na VPS

## 🔍 Verificar o Problema

Execute na VPS:

```bash
cd /var/www/apront

# Verificar DATABASE_URL no docker-compose.yml
grep -A 5 "DATABASE_URL" docker-compose.yml
```

## ✅ Solução: Editar docker-compose.yml

```bash
cd /var/www/apront
nano docker-compose.yml
```

### **Encontre a seção do backend e verifique:**

```yaml
backend:
  environment:
    - DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
```

### **⚠️ IMPORTANTE:**
- Use `postgres:5432` (nome do serviço Docker + porta interna)
- **NÃO** use `localhost:5433` (porta externa)
- **NÃO** use `127.0.0.1:5433`

### **Se estiver errado, corrija para:**

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: apront-backend
  environment:
    # Banco de dados - USE 'postgres' (nome do serviço), não 'localhost'
    - DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
    - REDIS_URL=redis://redis:6379/0
    
    # Flask
    - FLASK_ENV=production
    - SECRET_KEY=SUA_SECRET_KEY_AQUI
    - JWT_SECRET_KEY=SUA_JWT_SECRET_KEY_AQUI
    
    # SMTP (se tiver)
    - SMTP_SERVER=smtp.sendgrid.net
    - SMTP_PORT=587
    - SMTP_USERNAME=apikey
    - SMTP_PASSWORD=SUA_API_KEY_SENDGRID
    - FROM_EMAIL=noreply@seu-dominio.com
  ports:
    - "127.0.0.1:5001:5001"  # Apenas localhost (Nginx faz proxy)
  volumes:
    - ./backend:/app
    - backend_uploads:/app/uploads
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
  networks:
    - apront-network
  restart: unless-stopped
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

## 🔄 Reiniciar Containers

```bash
cd /var/www/apront

# Parar tudo
docker compose down

# Iniciar novamente
docker compose up -d

# Ver logs do backend
docker compose logs -f backend
```

## 🔍 Verificar se Funcionou

Os logs devem mostrar:

```
✅ Usando PostgreSQL: postgres:5432/apront_db
```

**NÃO deve mostrar:**
```
❌ localhost:5433
❌ Connection refused
```

## 🧪 Testar Conexão

```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Deve mostrar: Up (healthy)

# Testar conexão do backend
docker compose exec backend python -c "from app import app; print('OK')"

# Ver logs detalhados
docker compose logs backend | grep -i "database\|postgres\|connected"
```

## 📋 Checklist

- [ ] `docker-compose.yml` com `DATABASE_URL=postgresql://...@postgres:5432/...`
- [ ] **NÃO** tem `localhost` ou `127.0.0.1` na DATABASE_URL
- [ ] PostgreSQL rodando (`docker compose ps postgres`)
- [ ] Containers reiniciados
- [ ] Logs mostram conexão bem-sucedida

## 💡 Por Que `postgres:5432`?

**Dentro do Docker Compose:**
- Containers se comunicam pelo **nome do serviço** definido no `docker-compose.yml`
- O serviço PostgreSQL se chama `postgres` (linha 5 do docker-compose.yml)
- A porta interna do PostgreSQL é `5432`
- A porta externa `5433:5432` é apenas para acesso do **host** (VPS), não para comunicação entre containers

**Exemplo:**
```yaml
services:
  postgres:  # ← Este é o nome usado na DATABASE_URL
    ports:
      - "5433:5432"  # 5433=host, 5432=container
```

**Para o backend conectar:**
- ✅ `postgres:5432` (nome do serviço + porta interna)
- ❌ `localhost:5433` (porta externa do host)

