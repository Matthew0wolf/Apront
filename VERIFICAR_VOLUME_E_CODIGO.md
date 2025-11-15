# 🔍 Verificar Volume e Código no Container

## ❌ Problema

Email ainda usando `localhost:3000` e logs de debug não aparecem.

## 🔍 Verificar se há volume montado:

```bash
grep -A 15 "backend:" /var/www/apront/docker-compose.yml | grep -A 10 "volumes:"
```

**Se houver volume montando `./backend:/app`, o código no container é o mesmo do host.**

## 🔍 Verificar código no container:

```bash
docker compose exec backend grep -A 5 "FRONTEND_URL lido" /app/email_utils.py
```

**Deve mostrar a linha que adicionamos.**

## 🔍 Verificar se código foi atualizado no host:

```bash
grep -A 5 "FRONTEND_URL lido" /var/www/apront/backend/email_utils.py
```

**Se não aparecer, o código não foi atualizado no host!**

## ✅ Solução:

### **1. Se houver volume montado:**

O código no container é o mesmo do host. Atualizar no host:

```bash
cd /var/www/apront
git fetch origin
git reset --hard origin/main
docker compose restart backend
```

### **2. Se NÃO houver volume:**

Precisa fazer rebuild da imagem:

```bash
cd /var/www/apront
git fetch origin
git reset --hard origin/main
docker compose down
docker compose up -d --build backend
```

### **3. Forçar rebuild completo:**

```bash
cd /var/www/apront
git fetch origin
git reset --hard origin/main
docker compose down
docker compose build --no-cache backend
docker compose up -d backend
```

## 🚀 Comando Completo para Diagnóstico:

```bash
cd /var/www/apront && \
echo "=== 1. Verificando volume ===" && \
grep -A 15 "backend:" docker-compose.yml | grep -A 10 "volumes:" && \
echo "" && \
echo "=== 2. Verificando código no host ===" && \
grep -n "FRONTEND_URL lido" backend/email_utils.py && \
echo "" && \
echo "=== 3. Verificando código no container ===" && \
docker compose exec backend grep -n "FRONTEND_URL lido" /app/email_utils.py && \
echo "" && \
echo "=== 4. Atualizando código ===" && \
git fetch origin && \
git reset --hard origin/main && \
echo "" && \
echo "=== 5. Reiniciando backend ===" && \
docker compose restart backend
```

## 📋 Depois de executar:

Envie um novo convite e veja TODOS os logs (sem filtro):

```bash
docker compose logs -f backend
```

**Procure por QUALQUER linha com "EMAIL" ou "invite".**

