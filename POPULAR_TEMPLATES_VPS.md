# 📦 Popular Templates no Banco de Dados (VPS)

## ✅ Solução

Execute o script de população de templates dentro do container do backend.

## 📋 Passos:

### **1. Executar script de população:**

```bash
docker compose exec backend python scripts/populate/populate_templates.py
```

**Ou se preferir, execute diretamente:**

```bash
cd /var/www/apront
docker compose exec backend python -c "
import sys
sys.path.insert(0, '/app')
from scripts.populate.populate_templates import *
"
```

### **2. Verificar se templates foram criados:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "SELECT id, name, category, author FROM templates ORDER BY id;"
```

**Deve mostrar 5 templates:**
- Transmissão de Futebol Completa
- Telejornal Diário
- Show Musical ao Vivo
- Podcast Entrevista
- Evento Corporativo

### **3. Verificar contagem:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "SELECT COUNT(*) as total_templates FROM templates;"
```

**Deve mostrar `total_templates = 5`**

### **4. Testar no navegador:**

1. **Acesse:** `http://72.60.56.28/templates`
2. **Limpe o cache:** `Ctrl+Shift+R`
3. **Os templates devem aparecer**

## 🔍 Troubleshooting:

### **Se der erro de importação:**

```bash
# Verificar se o script existe
docker compose exec backend ls -la /app/scripts/populate/populate_templates.py

# Executar com caminho completo
docker compose exec backend python /app/scripts/populate/populate_templates.py
```

### **Se templates não aparecerem:**

```bash
# Verificar estrutura JSON
docker compose exec postgres psql -U apront_user -d apront_db -c "SELECT name, structure_json IS NOT NULL as has_structure FROM templates;"
```

### **Se quiser limpar e recriar:**

```bash
# CUIDADO: Isso apaga todos os templates!
docker compose exec postgres psql -U apront_user -d apront_db -c "DELETE FROM templates;"
docker compose exec backend python scripts/populate/populate_templates.py
```

## 📋 Comando Completo (Copie e Cole):

```bash
cd /var/www/apront && docker compose exec backend python scripts/populate/populate_templates.py && docker compose exec postgres psql -U apront_user -d apront_db -c "SELECT COUNT(*) as total FROM templates;"
```

## ✅ Templates que serão criados:

1. **Transmissão de Futebol Completa** (Esportes)
2. **Telejornal Diário** (Jornalismo)
3. **Show Musical ao Vivo** (Entretenimento)
4. **Podcast Entrevista** (Podcast)
5. **Evento Corporativo** (Corporativo)

Todos com estrutura completa de pastas e itens!

