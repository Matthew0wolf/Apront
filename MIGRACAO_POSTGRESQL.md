# 🐘 Guia de Migração para PostgreSQL

## 📋 **Pré-requisitos**

- ✅ Docker e Docker Compose instalados
- ✅ Backup do banco SQLite existente (`backend/rundowns.db`)

---

## 🚀 **Passo a Passo - Migração**

### **1. Subir o PostgreSQL com Docker**

```bash
# No diretório raiz do projeto
docker-compose up -d postgres redis

# Verificar se os containers estão rodando
docker-compose ps
```

Você deve ver:
```
NAME                IMAGE               STATUS
apront-postgres     postgres:15-alpine  Up
apront-redis        redis:7-alpine      Up
```

---

### **2. Executar Script de Migração**

```bash
# Entrar no diretório backend
cd backend

# Instalar dependências (se ainda não instalou)
pip install psycopg2-binary python-dotenv

# Executar migração
python migrate_to_postgres.py
```

**O script vai:**
1. ✅ Conectar no SQLite (`rundowns.db`)
2. ✅ Conectar no PostgreSQL
3. ✅ Listar todas as tabelas
4. ⚠️  Pedir confirmação
5. ✅ Migrar dados respeitando foreign keys
6. ✅ Verificar migração

---

### **3. Configurar Variáveis de Ambiente**

**Opção A: Arquivo .env (Recomendado)**

Crie o arquivo `backend/.env`:

```bash
DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5432/apront_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your_super_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_here
FLASK_ENV=development
```

**Opção B: Variáveis de Ambiente do Sistema**

Windows PowerShell:
```powershell
$env:DATABASE_URL="postgresql://apront_user:apront_password_2024@localhost:5432/apront_db"
```

Windows CMD:
```cmd
set DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5432/apront_db
```

Linux/Mac:
```bash
export DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5432/apront_db
```

---

### **4. Reiniciar o Backend**

**Com Docker:**
```bash
# No diretório raiz
docker-compose up -d backend
```

**Sem Docker (local):**
```bash
cd backend
python app.py
```

Você deve ver:
```
🐘 Usando PostgreSQL: localhost:5432/apront_db
 * Running on http://0.0.0.0:5001
```

---

### **5. Verificar Migração**

1. **Teste a aplicação:**
   - Acesse http://localhost:5173
   - Faça login
   - Verifique se seus rundowns aparecem
   - Teste criar um novo item

2. **Verifique o banco via PgAdmin (opcional):**
```bash
# Subir PgAdmin
docker-compose --profile admin up -d pgadmin

# Acesse: http://localhost:5050
# Email: admin@apront.com
# Senha: admin123
```

---

## 🔧 **Usando Docker Compose Completo**

### **Subir tudo de uma vez:**

```bash
# No diretório raiz
docker-compose up -d
```

Isso inicia:
- ✅ PostgreSQL (porta 5432)
- ✅ Redis (porta 6379)
- ✅ Backend Flask (porta 5001)

### **Ver logs:**

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas postgres
docker-compose logs -f postgres
```

### **Parar tudo:**

```bash
docker-compose down
```

### **Parar e remover volumes (⚠️ PERDA DE DADOS):**

```bash
docker-compose down -v
```

---

## 📊 **Comparação: SQLite vs PostgreSQL**

| Aspecto | SQLite | PostgreSQL |
|---------|--------|------------|
| **Concorrência** | ❌ Trava com 5+ usuários | ✅ Suporta milhares |
| **Performance** | ⚠️ Boa para leitura | ✅ Ótima para tudo |
| **Backup** | 📁 Copiar arquivo | ✅ Dump automatizado |
| **Escalabilidade** | ❌ Limitada | ✅ Ilimitada |
| **Produção** | ❌ Não recomendado | ✅ Padrão da indústria |
| **Desenvolvimento** | ✅ Simples | ⚠️ Requer Docker |

---

## 🐛 **Resolução de Problemas**

### **Erro: "Connection refused" ao migrar**

```bash
# Verificar se o PostgreSQL está rodando
docker-compose ps postgres

# Se não estiver, inicie:
docker-compose up -d postgres

# Aguarde 10 segundos e tente novamente
```

### **Erro: "psycopg2 not found"**

```bash
pip install psycopg2-binary
```

### **Erro: "Database does not exist"**

O Docker Compose cria automaticamente. Se não criou:

```bash
# Entrar no container do PostgreSQL
docker exec -it apront-postgres psql -U apront_user -d postgres

# Criar o banco manualmente
CREATE DATABASE apront_db;
\q
```

### **Erro: "Permission denied"**

```bash
# Windows: Execute o terminal como Administrador
# Linux/Mac: Use sudo
sudo docker-compose up -d
```

### **Backend não conecta no PostgreSQL**

Verifique a variável de ambiente:

```bash
# Ver variável
echo $DATABASE_URL  # Linux/Mac
echo %DATABASE_URL% # Windows CMD
$env:DATABASE_URL   # Windows PowerShell

# Se vazia, configure novamente
```

---

## ✅ **Checklist de Migração**

- [ ] Docker instalado e rodando
- [ ] Backup do `backend/rundowns.db` feito
- [ ] PostgreSQL rodando (`docker-compose up -d postgres`)
- [ ] Script de migração executado com sucesso
- [ ] Variável `DATABASE_URL` configurada
- [ ] Backend reiniciado
- [ ] Login funciona
- [ ] Rundowns aparecem
- [ ] Criação de itens funciona
- [ ] WebSocket sincroniza

---

## 🔄 **Rollback para SQLite (se necessário)**

Se algo der errado, volte para SQLite:

```bash
# 1. Parar backend
docker-compose stop backend
# OU pressione Ctrl+C se rodando local

# 2. Remover variável DATABASE_URL
# Windows PowerShell:
Remove-Item Env:\DATABASE_URL
# Linux/Mac:
unset DATABASE_URL

# 3. Reiniciar backend
cd backend
python app.py
```

O backend volta automaticamente para SQLite.

---

## 📝 **Próximos Passos**

Após migração bem-sucedida:

1. ✅ Configure backup automático do PostgreSQL
2. ✅ Configure Redis para cache (já está pronto no Docker)
3. ✅ Teste performance com múltiplos usuários
4. ✅ Configure monitoramento (opcional)

---

## 🆘 **Suporte**

Se encontrar problemas:

1. Veja os logs: `docker-compose logs -f`
2. Verifique conexões: `docker-compose ps`
3. Teste conectividade:
   ```bash
   docker exec -it apront-postgres psql -U apront_user -d apront_db -c "SELECT 1;"
   ```

---

**Migração criada em:** Sprint 3  
**Versão:** 1.0  
**Status:** ✅ Testado e funcional

