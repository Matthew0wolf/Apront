# ✅ Corrigir Erro 500 ao Deletar Rundown

## ✅ O que foi corrigido:

1. **Cascade delete adicionado** para `RundownMember` no modelo `Rundown`
2. **Função de delete melhorada** para garantir deleção correta e tratamento de erros

## 📋 Próximos Passos:

### **1. Atualizar código:**

```bash
cd /var/www/apront
git fetch origin
git reset --hard origin/main
```

### **2. Reiniciar backend:**

```bash
docker compose restart backend
```

### **3. Testar deletar rundown:**

1. **Acesse:** `http://72.60.56.28`
2. **Tente deletar um rundown novamente**
3. **Deve funcionar sem erro 500**

## 🔍 Se ainda der erro:

### **Ver logs do backend:**

```bash
docker compose logs -f backend
```

**Tente deletar novamente e observe os logs para ver o erro específico.**

### **Verificar se há membros do rundown:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "
SELECT COUNT(*) as total_members FROM rundown_members WHERE rundown_id = 1;
"
```

### **Deletar membros manualmente (se necessário):**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "
DELETE FROM rundown_members WHERE rundown_id = 1;
"
```

## 📋 Comandos Completos:

```bash
cd /var/www/apront && git fetch origin && git reset --hard origin/main && docker compose restart backend
```

Depois, **teste deletar o rundown novamente**.

