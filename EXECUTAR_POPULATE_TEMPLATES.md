# 📦 Executar População de Templates (Corrigido)

## ✅ Solução

O script foi corrigido. Execute na VPS:

### **1. Atualizar código:**

```bash
cd /var/www/apront
git fetch origin
git reset --hard origin/main
```

### **2. Executar script de população:**

```bash
docker compose exec backend python scripts/populate/populate_templates.py
```

**OU execute diretamente do diretório /app:**

```bash
docker compose exec backend bash -c "cd /app && python scripts/populate/populate_templates.py"
```

### **3. Verificar se templates foram criados:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "SELECT id, name, category, author FROM templates ORDER BY id;"
```

**Deve mostrar 5 templates.**

### **4. Verificar contagem:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "SELECT COUNT(*) as total_templates FROM templates;"
```

**Deve mostrar `total_templates = 5`**

### **5. Testar no navegador:**

1. **Acesse:** `http://72.60.56.28/templates`
2. **Limpe o cache:** `Ctrl+Shift+R`
3. **Os templates devem aparecer**

## 🔍 Se ainda der erro:

### **Opção A: Executar com caminho absoluto:**

```bash
docker compose exec backend python /app/scripts/populate/populate_templates.py
```

### **Opção B: Executar dentro do container:**

```bash
docker compose exec backend bash
cd /app
python scripts/populate/populate_templates.py
exit
```

### **Opção C: Verificar se arquivo existe:**

```bash
docker compose exec backend ls -la /app/scripts/populate/populate_templates.py
```

## 📋 Comando Completo (Copie e Cole):

```bash
cd /var/www/apront && git fetch origin && git reset --hard origin/main && docker compose exec backend python scripts/populate/populate_templates.py && docker compose exec postgres psql -U apront_user -d apront_db -c "SELECT COUNT(*) as total FROM templates;"
```

