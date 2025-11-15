# 🔧 Solução: Erro de Conexão PostgreSQL no Docker

## ❌ Erro Encontrado

```
connection to server at "localhost" (::1), port 5433 failed: Connection refused
```

## 🔍 Causa

O backend está tentando conectar em `localhost:5433`, mas no Docker Compose:
- PostgreSQL está no container `postgres` na porta `5432` (porta interna)
- Dentro do Docker, containers se comunicam pelo nome do serviço, não por `localhost`

## ✅ Solução

### **1. Verificar se há arquivo .env no backend:**

```bash
cd /var/www/apront/backend
ls -la .env
```

**Se existir um arquivo `.env`, edite-o:**

```bash
nano backend/.env
```

**Verifique se há uma linha `DATABASE_URL` com `localhost` ou `127.0.0.1`:**

```env
# ERRADO (dentro do Docker):
DATABASE_URL=postgresql://apront_user:senha@localhost:5433/apront_db

# CORRETO (dentro do Docker):
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
```

**OU remova a linha `DATABASE_URL` do `.env`** para usar a variável do `docker-compose.yml`.

### **2. Verificar docker-compose.yml:**

```bash
cd /var/www/apront
cat docker-compose.yml | grep DATABASE_URL
```

**Deve mostrar:**
```yaml
- DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
```

**⚠️ IMPORTANTE:** 
- Use `postgres:5432` (nome do serviço + porta interna)
- **NÃO** use `localhost:5433` (porta externa)

### **3. Verificar se PostgreSQL está rodando:**

```bash
docker compose ps postgres
```

**Deve mostrar:** `Up` e `healthy`

### **4. Verificar logs do PostgreSQL:**

```bash
docker compose logs postgres
```

**Deve mostrar:** PostgreSQL iniciado e escutando na porta 5432

### **5. Reiniciar containers:**

```bash
cd /var/www/apront

# Parar tudo
docker compose down

# Iniciar novamente
docker compose up -d

# Ver logs do backend
docker compose logs -f backend
```

## 🔧 Solução Rápida (Passo a Passo)

### **Opção 1: Remover/Corrigir .env do Backend**

```bash
cd /var/www/apront/backend

# Se existir .env, faça backup
cp .env .env.backup

# Edite o .env
nano .env
```

**Remova ou comente a linha `DATABASE_URL`** (deixe o docker-compose.yml definir):

```env
# DATABASE_URL=postgresql://...  # Comentado - usando do docker-compose.yml
```

**OU corrija para:**

```env
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **Opção 2: Garantir que docker-compose.yml está correto**

```bash
cd /var/www/apront
nano docker-compose.yml
```

**Verifique a seção do backend:**

```yaml
backend:
  environment:
    - DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db
    # ⚠️ Use 'postgres' (nome do serviço), não 'localhost'
    # ⚠️ Use porta 5432 (porta interna), não 5433
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **3. Reiniciar:**

```bash
docker compose down
docker compose up -d
docker compose logs -f backend
```

## 📋 Checklist

- [ ] Verificado se há `.env` no backend com `DATABASE_URL` incorreta
- [ ] `.env` corrigido ou removido
- [ ] `docker-compose.yml` com `DATABASE_URL` usando `postgres:5432`
- [ ] PostgreSQL rodando (`docker compose ps postgres`)
- [ ] Containers reiniciados
- [ ] Backend conectando corretamente

## 🔍 Verificar se Funcionou

```bash
# Ver logs do backend
docker compose logs backend | grep -i "database\|postgres\|connected"

# Deve mostrar algo como:
# ✅ Usando PostgreSQL: postgres:5432/apront_db
# ✅ Conectado ao banco de dados
```

## 💡 Explicação

**Dentro do Docker Compose:**
- Containers se comunicam pelo **nome do serviço** (`postgres`, `redis`, `backend`)
- **NÃO** usam `localhost` ou `127.0.0.1`
- Usam a **porta interna** do container (5432), não a porta externa (5433)

**Porta 5433:5432** significa:
- `5433` = porta no **host** (máquina VPS)
- `5432` = porta no **container** (PostgreSQL)

**Para comunicação entre containers:**
- Use: `postgres:5432` ✅
- **NÃO** use: `localhost:5433` ❌

