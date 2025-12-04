# 🔍 Comandos para Descobrir Informações do Banco na VPS

## 📋 Descobrir Nome do Usuário e Banco de Dados

### **1️⃣ Verificar Usuário Atual do PostgreSQL**

```bash
# Ver qual usuário você está usando
whoami

# Tentar conectar como usuário postgres (comum em VPS)
psql -U postgres -l

# Tentar conectar como usuário root
psql -U root -l

# Tentar conectar sem especificar usuário (usa usuário atual do sistema)
psql -l
```

### **2️⃣ Listar Todos os Bancos de Dados**

```bash
# Tentar como postgres
psql -U postgres -l

# Tentar como root
psql -U root -l

# Tentar como seu usuário atual
psql -l

# Tentar como postgres e ver usuários
psql -U postgres -c "\du"
```

### **3️⃣ Verificar Variáveis de Ambiente**

```bash
# Ver todas as variáveis de ambiente relacionadas ao banco
env | grep -i postgres
env | grep -i database
env | grep -i db

# Ver arquivo .env do backend (se existir)
cat ~/Apront/backend/.env
cat ~/Apront/.env

# Ver configurações do backend
cat ~/Apront/backend/config.py
grep -r "DATABASE" ~/Apront/backend/
```

### **4️⃣ Verificar Arquivos de Configuração do Backend**

```bash
# Ver arquivo app.py para encontrar configuração do banco
cat ~/Apront/backend/app.py | grep -i database
cat ~/Apront/backend/app.py | grep -i postgres

# Ver arquivo config.py se existir
find ~/Apront -name "config.py" -exec cat {} \;

# Ver arquivos .env
find ~/Apront -name ".env" -exec cat {} \;
```

### **5️⃣ Tentar Conectar com Usuários Comuns**

```bash
# Tentar como postgres (mais comum em VPS)
psql -U postgres -d postgres -c "SELECT current_user;"

# Tentar como seu usuário do sistema
psql -d postgres -c "SELECT current_user;"

# Ver todos os usuários do PostgreSQL
psql -U postgres -c "\du"
```

### **6️⃣ Verificar Processos do PostgreSQL**

```bash
# Ver se o PostgreSQL está rodando e como
ps aux | grep postgres

# Ver configuração do PostgreSQL
cat /etc/postgresql/*/main/postgresql.conf | grep -i listen
```

### **7️⃣ Verificar Docker (se estiver usando)**

```bash
# Ver containers Docker
docker ps

# Ver logs do container do PostgreSQL
docker logs $(docker ps -q -f name=postgres)

# Entrar no container do PostgreSQL
docker exec -it $(docker ps -q -f name=postgres) psql -U postgres -l
```

---

## 🔍 Comandos Combinados (Execute um de cada vez)

### **Descobrir tudo de uma vez:**

```bash
echo "=== USUÁRIO ATUAL ==="
whoami

echo ""
echo "=== VARIÁVEIS DE AMBIENTE ==="
env | grep -iE "(postgres|database|db)" || echo "Nenhuma variável encontrada"

echo ""
echo "=== TENTANDO CONECTAR COMO POSTGRES ==="
psql -U postgres -l 2>/dev/null || echo "Não conseguiu conectar como postgres"

echo ""
echo "=== TENTANDO CONECTAR SEM USUÁRIO ==="
psql -l 2>/dev/null || echo "Não conseguiu conectar"

echo ""
echo "=== PROCURANDO ARQUIVO .env ==="
find ~ -name ".env" -type f 2>/dev/null | head -5

echo ""
echo "=== PROCURANDO CONFIGURAÇÃO NO APP.PY ==="
grep -i "database\|postgres" ~/Apront/backend/app.py 2>/dev/null | head -5 || echo "Arquivo não encontrado"
```

---

## 📝 Como Usar

1. **Copie e cole este comando no seu servidor:**

```bash
echo "=== USUÁRIO ATUAL ===" && whoami && echo "" && echo "=== VARIÁVEIS DE AMBIENTE ===" && env | grep -iE "(postgres|database|db)" && echo "" && echo "=== ARQUIVO .env ===" && cat ~/Apront/backend/.env 2>/dev/null || echo "Arquivo .env não encontrado" && echo "" && echo "=== CONFIGURAÇÃO NO APP.PY ===" && grep -iE "database_url|DATABASE|postgres" ~/Apront/backend/app.py 2>/dev/null | head -10
```

2. **Execute e me envie o resultado!**

Isso vai mostrar:
- Seu usuário atual
- Variáveis de ambiente
- Configurações do banco no código

---

## 🎯 Comandos Mais Prováveis

Na maioria das VPS, o usuário padrão é `postgres`. Tente:

```bash
# 1. Listar bancos como postgres
psql -U postgres -l

# 2. Se pedir senha, você pode precisar configurar autenticação ou usar sudo
sudo -u postgres psql -l

# 3. Ver usuários do PostgreSQL
sudo -u postgres psql -c "\du"
```

Me envie o resultado desses comandos e eu te ajudo a identificar qual é o usuário e banco correto! 🚀

