# 🔧 Solução Final: Forçar DATABASE_URL Correta

## 🔍 Problema Identificado

O código está detectando como **desenvolvimento** (porque não há variáveis Railway) e tentando carregar `.env`. Como não existe, pode estar usando algum fallback ou a variável não está sendo passada corretamente.

## ✅ Solução: Forçar Variáveis de Ambiente

### **1. Parar containers:**

```bash
cd /var/www/apront
docker compose down
```

### **2. Editar docker-compose.yml e FORÇAR FLASK_ENV=production:**

```bash
nano docker-compose.yml
```

**Encontre a seção do backend e GARANTA que está assim:**

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: apront-backend
  environment:
    # FORÇAR DATABASE_URL (sem depender de .env)
    - DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
    - REDIS_URL=redis://redis:6379/0
    
    # FORÇAR produção para não carregar .env
    - FLASK_ENV=production
    
    # Chaves (gere novas se necessário)
    - SECRET_KEY=GERE_UMA_CHAVE_ALEATORIA_AQUI
    - JWT_SECRET_KEY=OUTRA_CHAVE_ALEATORIA_AQUI
    
    # SMTP (se tiver)
    - SMTP_SERVER=smtp.sendgrid.net
    - SMTP_PORT=587
    - SMTP_USERNAME=apikey
    - SMTP_PASSWORD=SUA_API_KEY_SENDGRID
    - FROM_EMAIL=noreply@seu-dominio.com
  ports:
    - "127.0.0.1:5001:5001"
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

### **3. Gerar chaves aleatórias (se ainda não tiver):**

```bash
# Gerar SECRET_KEY
openssl rand -hex 32

# Gerar JWT_SECRET_KEY
openssl rand -hex 32
```

**Use essas chaves no docker-compose.yml acima.**

### **4. Rebuild completo (força reconstruir tudo):**

```bash
cd /var/www/apront

# Rebuild forçado (sem cache)
docker compose build --no-cache backend

# Iniciar
docker compose up -d

# Ver logs em tempo real
docker compose logs -f backend
```

### **5. Verificar se funcionou:**

Os logs devem mostrar:

```
🚀 Modo produção: usando apenas variáveis de ambiente do Railway (ignorando .env)
✅ Usando PostgreSQL: postgres:5432/apront_db
```

**NÃO deve mostrar:**
```
❌ localhost:5433
❌ Connection refused
```

## 🔍 Se Ainda Não Funcionar

### **Verificar variáveis dentro do container:**

```bash
# Aguardar container iniciar (pode demorar alguns segundos)
sleep 10

# Verificar variáveis
docker compose exec backend env | grep -E "DATABASE_URL|FLASK_ENV"
```

**Deve mostrar:**
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
FLASK_ENV=production
```

### **Testar conexão manualmente:**

```bash
docker compose exec backend python -c "
import os
import psycopg2
db_url = os.getenv('DATABASE_URL')
print('DATABASE_URL:', db_url)
try:
    conn = psycopg2.connect(db_url)
    print('✅ Conexão bem-sucedida!')
    conn.close()
except Exception as e:
    print(f'❌ Erro: {e}')
"
```

## 🎯 Solução Alternativa: Criar .env com DATABASE_URL Correta

Se ainda não funcionar, crie um `.env` no backend com a URL correta:

```bash
cd /var/www/apront/backend
nano .env
```

**Cole:**
```env
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
FLASK_ENV=production
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Depois reinicie:**
```bash
cd /var/www/apront
docker compose restart backend
docker compose logs -f backend
```

## 📋 Checklist Final

- [ ] `docker-compose.yml` com `FLASK_ENV=production`
- [ ] `docker-compose.yml` com `DATABASE_URL=postgresql://...@postgres:5432/...`
- [ ] Chaves geradas e configuradas
- [ ] Rebuild feito (`docker compose build --no-cache backend`)
- [ ] Containers iniciados
- [ ] Logs mostram conexão bem-sucedida

