# 📦 Guia: Migrar Dados do SQLite para PostgreSQL

## ✅ Banco SQLite Encontrado!

Você tem um banco SQLite antigo (`rundowns.db`) com **180 KB** de dados que precisa ser migrado para o novo PostgreSQL no Docker.

---

## 🚀 Como Migrar

### Passo 1: Verificar se o PostgreSQL está rodando

```powershell
docker ps --filter "name=apront-postgres"
```

Deve mostrar o container `apront-postgres` rodando.

**Se não estiver rodando:**
```powershell
cd Apront
docker-compose up -d postgres
```

### Passo 2: Configurar variável de ambiente

```powershell
cd Apront\backend
$env:DATABASE_URL="postgresql://apront_user:apront_password_2024@localhost:5433/apront_db"
```

### Passo 3: Executar migração

```powershell
cd Apront\backend\scripts\migrations
python migrate_to_postgres.py
```

O script vai:
1. ✅ Conectar ao SQLite (`rundowns.db`)
2. ✅ Conectar ao PostgreSQL (Docker - porta 5433)
3. ✅ Listar todas as tabelas encontradas
4. ✅ Perguntar se deseja continuar
5. ✅ Migrar todos os dados
6. ✅ Verificar se a migração foi bem-sucedida

### Passo 4: Confirmar migração

Quando o script perguntar:
```
⚠️  Deseja continuar com a migração? (sim/não):
```

Digite: `sim` ou `s`

---

## 📋 O que será migrado

O script migra todas as tabelas na ordem correta (respeitando foreign keys):

1. ✅ `plans` - Planos SaaS
2. ✅ `companies` - Empresas
3. ✅ `users` - Usuários
4. ✅ `rundowns` - Rundowns/Projetos
5. ✅ `rundown_members` - Membros dos rundowns
6. ✅ `folders` - Pastas
7. ✅ `items` - Itens
8. ✅ `invites` - Convites
9. ✅ `subscriptions` - Assinaturas

**E todas as outras tabelas que existirem no SQLite!**

---

## ⚠️ Importante

### Antes de Migrar

1. **Faça backup do banco SQLite:**
   ```powershell
   cd Apront\backend
   Copy-Item rundowns.db rundowns.db.backup
   ```

2. **Verifique se o PostgreSQL está vazio ou tem dados importantes:**
   - Se o PostgreSQL já tem dados, o script usa `ON CONFLICT DO NOTHING` (não sobrescreve)
   - Se quiser substituir tudo, limpe o banco primeiro

### Durante a Migração

- ✅ O script mostra progresso de cada tabela
- ✅ Se houver erro em uma tabela, continua com as outras
- ✅ Usa transações (se der erro, faz rollback)

### Após a Migração

1. **Verifique os dados:**
   - O script mostra contagem de registros migrados
   - Verifique se os dados estão corretos

2. **Teste o sistema:**
   - Faça login com um usuário migrado
   - Verifique se os rundowns aparecem
   - Teste funcionalidades principais

---

## 🔍 Verificação Manual

Após migrar, você pode verificar manualmente:

```powershell
# Conectar ao PostgreSQL
docker exec -it apront-postgres psql -U apront_user -d apront_db

# Contar registros
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM rundowns;
SELECT COUNT(*) FROM items;

# Ver alguns dados
SELECT * FROM users LIMIT 5;
SELECT * FROM rundowns LIMIT 5;

# Sair
\q
```

---

## 🆘 Troubleshooting

### Erro: "Arquivo rundowns.db não encontrado"

**Solução:** Certifique-se de estar no diretório `backend`:
```powershell
cd Apront\backend
python scripts\migrations\migrate_to_postgres.py
```

### Erro: "Erro ao conectar no PostgreSQL"

**Solução:** Verifique se:
1. PostgreSQL está rodando: `docker ps --filter "name=apront-postgres"`
2. Porta está correta (5433)
3. Variável `DATABASE_URL` está configurada

### Erro: "value too long for type"

**Solução:** Já corrigimos os campos de data e password_hash. Se ainda der erro, me avise qual campo.

### Dados duplicados

**Solução:** O script usa `ON CONFLICT DO NOTHING`, então não sobrescreve dados existentes. Se quiser substituir:
1. Limpe o banco PostgreSQL primeiro
2. Execute a migração novamente

---

## ✅ Resumo

1. ✅ Banco SQLite encontrado (180 KB)
2. ⬜ Verificar PostgreSQL rodando
3. ⬜ Configurar `DATABASE_URL`
4. ⬜ Executar script de migração
5. ⬜ Verificar dados migrados
6. ⬜ Testar sistema

---

**Execute a migração e seus dados antigos estarão no novo banco!** 🎉

