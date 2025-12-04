# 🚀 Como Rodar a Migração AGORA (Sem Flask)

## ❌ Problema

Você está vendo este erro:
```
ModuleNotFoundError: No module named 'flask'
```

Isso acontece porque o script Python precisa do Flask, mas o ambiente não tem.

---

## ✅ Solução: SQL Direto (Mais Fácil e Confiável)

### **Opção 1: Copiar e Colar SQL**

1. **Conecte no PostgreSQL:**

```bash
psql -h localhost -U seu_usuario -d apront_db
```

2. **Cole e execute estas 4 linhas:**

```sql
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;
```

3. **Verifique se funcionou:**

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json');
```

Você deve ver **4 linhas**! ✅

4. **Reinicie o backend:**

```bash
sudo systemctl restart apront-backend
# ou
sudo systemctl restart gunicorn
```

---

### **Opção 2: Executar SQL de Um Arquivo**

1. **No servidor, copie o arquivo SQL:**

```bash
cat > /tmp/migrar.sql << 'EOF'
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;
EOF
```

2. **Execute o SQL:**

```bash
psql -h localhost -U seu_usuario -d apront_db -f /tmp/migrar.sql
```

---

### **Opção 3: Uma Linha de Comando**

Execute tudo de uma vez:

```bash
psql -h localhost -U seu_usuario -d apront_db << EOF
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;
SELECT column_name FROM information_schema.columns WHERE table_name = 'rundowns' AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json');
EOF
```

---

## 🔍 Como Descobrir o Nome do Banco

Se você não souber o nome do banco, execute:

```bash
psql -h localhost -U seu_usuario -l
```

Você verá uma lista de bancos. Procure por um que tenha nome relacionado ao projeto (ex: `apront`, `apront_db`, etc.)

---

## ✅ Depois da Migração

1. ✅ Reinicie o backend
2. ✅ Teste o sistema
3. ✅ O erro 500 vai parar
4. ✅ O timer não vai mais iniciar automaticamente

---

## 📝 SQL Completo (Copiar e Colar)

```sql
-- Adicionar as 4 colunas
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_started_at VARCHAR(50);
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS timer_elapsed_base INTEGER DEFAULT 0;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS is_timer_running BOOLEAN DEFAULT FALSE;
ALTER TABLE rundowns ADD COLUMN IF NOT EXISTS current_item_index_json TEXT;

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rundowns' 
  AND column_name IN ('timer_started_at', 'timer_elapsed_base', 'is_timer_running', 'current_item_index_json');
```

---

## 🆘 Precisa de Ajuda?

Se não conseguir conectar no PostgreSQL, me informe:
- Como você acessa o banco normalmente?
- Qual usuário você usa?
- O banco está no mesmo servidor ou em outro?

