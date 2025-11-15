# 🔍 Verificar Erro 500 ao Deletar Rundown

## ❌ Problema

Erro 500 ao tentar deletar um rundown.

## 📋 Diagnóstico:

### **1. Ver logs do backend em tempo real:**

```bash
docker compose logs -f backend
```

**Tente deletar o rundown novamente e observe os logs para ver o erro específico.**

### **2. Verificar últimos erros:**

```bash
docker compose logs backend | grep -i "error\|exception\|traceback" | tail -50
```

### **3. Verificar se rundown existe e pertence à empresa:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "
SELECT r.id, r.title, r.company_id, u.company_id as user_company_id, u.email
FROM rundowns r
LEFT JOIN users u ON u.id = (SELECT user_id FROM users LIMIT 1)
WHERE r.id = 1;
"
```

### **4. Verificar constraints de foreign key:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'rundowns';
"
```

### **5. Testar deletar diretamente no banco (CUIDADO):**

```bash
# Primeiro, verificar o que será deletado
docker compose exec postgres psql -U apront_user -d apront_db -c "
SELECT * FROM rundowns WHERE id = 1;
"

# Se quiser testar deletar (CUIDADO: isso deleta permanentemente)
# docker compose exec postgres psql -U apront_user -d apront_db -c "DELETE FROM rundowns WHERE id = 1;"
```

## 🔧 Possíveis Causas:

1. **Foreign Key Constraint:** Alguma tabela relacionada está impedindo a deleção
2. **Company ID mismatch:** Rundown não pertence à empresa do usuário
3. **Erro no broadcast:** Problema ao notificar via WebSocket
4. **Erro de permissão:** Usuário não tem permissão

## ✅ Solução Temporária (se for problema de foreign key):

Se o problema for foreign key, pode ser necessário deletar em cascata ou desabilitar temporariamente:

```bash
# Verificar se há itens relacionados
docker compose exec postgres psql -U apront_user -d apront_db -c "
SELECT COUNT(*) as total_items FROM rundown_items WHERE rundown_id = 1;
SELECT COUNT(*) as total_folders FROM rundown_folders WHERE rundown_id = 1;
"
```

## 📋 Comando para Ver Logs em Tempo Real:

```bash
docker compose logs -f backend
```

**Mantenha aberto e tente deletar o rundown novamente para ver o erro completo.**

