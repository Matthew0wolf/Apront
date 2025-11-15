# 🔧 Corrigir .env Existente

## ❌ Problema Encontrado

O arquivo `.env` existe e tem:
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5433/apront_db
```

**Isso está ERRADO para Docker Compose!** Deve usar `postgres:5432` (nome do serviço Docker).

## ✅ Solução: Editar .env

Execute na VPS:

```bash
cd /var/www/apront/backend
nano .env
```

### **Encontre a linha:**
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5433/apront_db
```

### **Altere para:**
```
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
```

**⚠️ MUDANÇAS:**
- `localhost` → `postgres` (nome do serviço Docker)
- `5433` → `5432` (porta interna do container)

### **Também altere:**
```
FLASK_ENV=development
```

**Para:**
```
FLASK_ENV=production
```

### **E altere as chaves de segurança:**
```
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production
```

**Para chaves geradas (execute antes):**
```bash
openssl rand -hex 32  # Para SECRET_KEY
openssl rand -hex 32  # Para JWT_SECRET_KEY
```

### **Arquivo .env completo corrigido:**

```env
# Configurações de Email SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=matheusdev0998@gmail.com
SMTP_PASSWORD=qcwv mxid pmpd ixku
FROM_EMAIL=matheusdev0998@gmail.com

# Banco de Dados PostgreSQL (Docker Compose)
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db

# Redis
REDIS_URL=redis://redis:6379/0

# Segurança (SUBSTITUA pelas chaves geradas)
SECRET_KEY=SUA_SECRET_KEY_GERADA_AQUI
JWT_SECRET_KEY=SUA_JWT_SECRET_KEY_GERADA_AQUI

# Ambiente
FLASK_ENV=production
PORT=5001
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

## 🔄 Reiniciar Backend

```bash
cd /var/www/apront
docker compose restart backend
docker compose logs -f backend
```

## ✅ Verificar se Funcionou

Os logs devem mostrar:

```
📝 Carregando variáveis do arquivo .env (desenvolvimento local)
✅ Usando PostgreSQL: postgres:5432/apront_db
```

**NÃO deve mostrar:**
```
❌ localhost:5433
❌ Connection refused
```

## 📋 Resumo das Mudanças

| Antes (ERRADO) | Depois (CORRETO) |
|----------------|------------------|
| `localhost:5433` | `postgres:5432` |
| `FLASK_ENV=development` | `FLASK_ENV=production` |
| Chaves "dev-..." | Chaves geradas aleatoriamente |

## 🎯 Por Que Isso Resolve?

- **`postgres:5432`** = Nome do serviço Docker + porta interna
- **`localhost:5433`** = Porta externa do host (não funciona dentro do container)

Dentro do Docker Compose, containers se comunicam pelo **nome do serviço**, não por `localhost`.

