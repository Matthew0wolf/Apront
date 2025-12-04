# 🔧 Como Rodar Migração em Produção

## ❌ Problema Atual

Você está recebendo este erro:
```
(psycopg2.errors.UndefinedColumn) column rundowns.timer_started_at does not exist
GET /api/rundowns/101/timer-state 500 (INTERNAL SERVER ERROR)
```

E o timer está iniciando automaticamente "ao vivo" quando você entra como operador.

---

## ✅ Solução Rápida

### **Opção 1: Usando Python (Recomendado)**

No servidor de produção, execute:

```bash
# 1. Encontrar onde está o projeto
find / -name "add_timer_state_fields.py" 2>/dev/null

# 2. Entrar no diretório do backend (onde está o app.py)
cd /caminho/encontrado/../backend

# 3. Rodar migração (use python3 se python não funcionar)
python3 scripts/migrations/add_timer_state_fields.py
```

### **Opção 2: Usando SQL Direto (Mais Rápido)**

Se você tem acesso ao PostgreSQL, pode rodar o SQL diretamente:

```bash
# Conectar no PostgreSQL
psql -h localhost -U seu_usuario -d apront_db
```

Depois, cole e execute este SQL:

```sql
-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
    -- Adicionar timer_started_at (VARCHAR(50))
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rundowns' AND column_name = 'timer_started_at'
    ) THEN
        ALTER TABLE rundowns ADD COLUMN timer_started_at VARCHAR(50);
        RAISE NOTICE 'Coluna timer_started_at adicionada!';
    END IF;
    
    -- Adicionar timer_elapsed_base (INTEGER)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rundowns' AND column_name = 'timer_elapsed_base'
    ) THEN
        ALTER TABLE rundowns ADD COLUMN timer_elapsed_base INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna timer_elapsed_base adicionada!';
    END IF;
    
    -- Adicionar is_timer_running (BOOLEAN)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rundowns' AND column_name = 'is_timer_running'
    ) THEN
        ALTER TABLE rundowns ADD COLUMN is_timer_running BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna is_timer_running adicionada!';
    END IF;
    
    -- Adicionar current_item_index_json (TEXT)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rundowns' AND column_name = 'current_item_index_json'
    ) THEN
        ALTER TABLE rundowns ADD COLUMN current_item_index_json TEXT;
        RAISE NOTICE 'Coluna current_item_index_json adicionada!';
    END IF;
END $$;

-- Verificar se funcionou
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json');
```

Você deve ver as 4 colunas listadas! ✅

---

## 📋 Passo a Passo Detalhado

### 1️⃣ **Encontrar o Diretório do Projeto**

No servidor, execute:

```bash
# Procurar pelo script de migração
find / -name "add_timer_state_fields.py" 2>/dev/null

# Ou procurar pelo app.py
find / -name "app.py" -path "*/backend/*" 2>/dev/null

# Ou listar diretórios comuns
ls -la /var/www/
ls -la /home/
ls -la /opt/
```

### 2️⃣ **Entrar no Diretório**

Uma vez encontrado, entre no diretório `backend`:

```bash
cd /caminho/para/o/projeto/backend
pwd  # Confirma que está no lugar certo
ls   # Deve mostrar: app.py, models.py, etc.
```

### 3️⃣ **Rodar Migração com Python**

```bash
# Use python3 (não python)
python3 scripts/migrations/add_timer_state_fields.py
```

**OU se o script estiver em outro lugar:**

```bash
# Encontrar o caminho completo
find / -name "add_timer_state_fields.py" 2>/dev/null

# Rodar direto pelo caminho completo
python3 /caminho/completo/add_timer_state_fields.py
```

### 4️⃣ **Verificar se Funcionou**

Execute no PostgreSQL:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json');
```

Se todas as 4 colunas aparecerem, está tudo certo! ✅

### 5️⃣ **Reiniciar o Backend**

Após a migração, **reinicie o backend**:

```bash
# Se usar systemd:
sudo systemctl restart apront-backend

# Se rodar manualmente:
# Pare o processo e inicie novamente
```

---

## 🚨 Se Der Erro

### "No module named 'app'"

O script precisa estar no mesmo diretório do `app.py`. Certifique-se de estar em:

```bash
cd /caminho/para/backend  # Deve ter app.py aqui
python3 scripts/migrations/add_timer_state_fields.py
```

### "Permission denied"

```bash
chmod +x scripts/migrations/add_timer_state_fields.py
```

### "Command 'python' not found"

Use `python3` em vez de `python`:

```bash
python3 scripts/migrations/add_timer_state_fields.py
```

---

## ✅ Comandos Completos (Copiar e Colar)

### **Se souber o caminho do projeto:**

```bash
cd /var/www/apront/backend
python3 scripts/migrations/add_timer_state_fields.py
```

### **Se não souber o caminho:**

```bash
# Encontrar
PROJECT_DIR=$(find / -name "add_timer_state_fields.py" 2>/dev/null | head -1 | xargs dirname | xargs dirname | xargs dirname)
cd "$PROJECT_DIR/backend"
python3 scripts/migrations/add_timer_state_fields.py
```

---

## 📝 Resumo

1. ✅ Encontrar o diretório do projeto
2. ✅ Entrar em `backend`
3. ✅ Rodar: `python3 scripts/migrations/add_timer_state_fields.py`
4. ✅ Verificar as colunas no banco
5. ✅ Reiniciar o backend

**Depois disso, o erro 500 vai parar e o timer não vai mais iniciar automaticamente!** ✅

