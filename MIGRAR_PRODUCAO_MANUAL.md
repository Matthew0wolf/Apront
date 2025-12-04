# 🔧 Como Rodar Migração em Produção (Passo a Passo)

## 🎯 Problema Atual

Você está recebendo este erro:
```
(psycopg2.errors.UndefinedColumn) column rundowns.timer_started_at does not exist
```

Isso significa que as **colunas de timer state não existem no banco de produção**.

---

## 📋 Passo a Passo para Rodar a Migração

### 1️⃣ **Encontrar o Diretório do Projeto**

No servidor de produção, encontre onde o projeto está:

```bash
# Opções comuns:
cd /var/www/apront/backend
# ou
cd /home/apront/backend
# ou
cd ~/apront/backend
# ou onde você colocou o projeto
```

**Para descobrir onde está:**
```bash
# Procurar pelo diretório
find / -name "add_timer_state_fields.py" 2>/dev/null

# Ou listar diretórios comuns
ls -la /var/www/
ls -la /home/
```

### 2️⃣ **Entrar no Diretório do Backend**

Uma vez encontrado, entre no diretório:
```bash
cd /caminho/para/o/projeto/backend
```

### 3️⃣ **Verificar se o Python está Instalado**

```bash
python3 --version
# ou
python --version
```

Se não tiver Python, instale:
```bash
sudo apt update
sudo apt install python3 python3-pip
```

### 4️⃣ **Rodar a Migração**

```bash
python3 scripts/migrations/add_timer_state_fields.py
```

**OU se `python3` não funcionar:**
```bash
python scripts/migrations/add_timer_state_fields.py
```

### 5️⃣ **Verificar se Funcionou**

Você deve ver algo como:
```
============================================================
MIGRATION: Adicionando campos de estado do timer ao Rundown
============================================================
Tipo de banco detectado: PostgreSQL
Adicionando coluna timer_started_at...
✅ Coluna timer_started_at adicionada com sucesso!
Adicionando coluna timer_elapsed_base...
✅ Coluna timer_elapsed_base adicionada com sucesso!
Adicionando coluna is_timer_running...
✅ Coluna is_timer_running adicionada com sucesso!
Adicionando coluna current_item_index_json...
✅ Coluna current_item_index_json adicionada com sucesso!

✅ Migração concluída com sucesso!
```

### 6️⃣ **Verificar as Colunas no Banco**

Conecte no PostgreSQL e verifique:

```bash
psql -h localhost -U seu_usuario -d apront_db
```

Depois dentro do psql:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json');
```

Você deve ver as 4 colunas listadas.

### 7️⃣ **Reiniciar o Backend**

Após a migração, **reinicie o backend**:

```bash
# Se estiver usando systemd:
sudo systemctl restart apront-backend
# ou
sudo systemctl restart gunicorn

# Se estiver rodando manualmente:
# Pare o processo (Ctrl+C) e inicie novamente
cd /caminho/para/o/projeto/backend
python3 app.py
```

---

## 🚨 **Se Der Erro**

### Erro: "No module named 'app'"

O script precisa estar no diretório `backend` e ter acesso ao `app.py`. 

Certifique-se de estar no diretório correto:
```bash
pwd  # Deve mostrar: /caminho/.../backend
ls   # Deve mostrar: app.py, models.py, etc.
```

### Erro: "Permission denied"

```bash
# Dar permissão de execução
chmod +x scripts/migrations/add_timer_state_fields.py
```

### Erro: "Connection refused" ou "Database error"

Verifique as variáveis de ambiente do banco:
```bash
echo $DATABASE_URL
# ou
cat .env | grep DATABASE
```

---

## ✅ **Comando Completo (Copiar e Colar)**

Se você souber o caminho do projeto:

```bash
# Substitua /caminho/para/projeto pelo caminho real
cd /caminho/para/projeto/backend
python3 scripts/migrations/add_timer_state_fields.py
```

---

## 📞 **Precisa de Ajuda?**

Se não conseguir encontrar o diretório, me informe:
1. O caminho onde você faz o deploy do projeto
2. Como você acessa o servidor (SSH)
3. Qual comando você usa para iniciar o backend

