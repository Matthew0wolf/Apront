# 🔧 Solução: Erro de Conexão com Banco no Railway

## ❌ Problema

Erro nos logs:
```
psycopg2.OperationalError: connection to server at "localhost" (::1), port 5433 failed: Connection refused
connection to server at "localhost" (127.0.0.1), port 5433 failed: Connection refused
```

**Causa:** A aplicação está tentando conectar ao PostgreSQL em `localhost:5433`, mas no Railway o banco não está em localhost.

---

## ✅ Solução Rápida

### Passo 1: Verificar Serviço PostgreSQL no Railway

1. Acesse seu projeto no Railway
2. Verifique se há um serviço **PostgreSQL** criado
3. Se não houver, crie:
   - Clique em **"+ New"**
   - Selecione **"Database"** → **"Add PostgreSQL"**
   - Anote o nome do serviço (ex: `Postgres`)

### Passo 2: Configurar Variável de Ambiente Correta

1. Vá no serviço **Backend** (não no PostgreSQL)
2. Clique em **"Variables"**
3. Procure por `DATABASE_URL`
4. **Se existir e estiver com `localhost`**, DELETE essa variável
5. Adicione/Edite `DATABASE_URL` com o valor:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**⚠️ IMPORTANTE:** 
- Substitua `Postgres` pelo nome exato do seu serviço PostgreSQL
- Use a sintaxe `${{NomeDoServico.DATABASE_URL}}` (com chaves duplas)
- Isso faz o Railway injetar automaticamente a URL correta do banco

### Passo 3: Verificar Outras Variáveis

O Railway também pode fornecer variáveis individuais. Verifique se existem:

- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

Se existirem, você pode deletá-las (o código agora constrói a URL automaticamente).

### Passo 4: Fazer Redeploy

1. Após configurar a variável, o Railway deve fazer redeploy automaticamente
2. Se não fizer, vá em **"Deployments"** → **"Redeploy"**
3. Aguarde o deploy completar

### Passo 5: Verificar Logs

Nos logs, você deve ver:
```
✅ Usando PostgreSQL: [host-do-railway]:[porta]/[database]
```

**NÃO deve aparecer:**
- ❌ `localhost:5433`
- ❌ `127.0.0.1:5433`

---

## 🔍 Como Verificar se Está Correto

### 1. Verificar Variáveis de Ambiente

No Railway, vá em **Backend** → **Variables** e verifique:

✅ **Correto:**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

❌ **Incorreto:**
```
DATABASE_URL=postgresql://user:pass@localhost:5433/db
DATABASE_URL=postgresql://user:pass@127.0.0.1:5433/db
```

### 2. Verificar Logs do Deploy

Após o redeploy, verifique os logs. Deve aparecer:

✅ **Correto:**
```
✅ Usando PostgreSQL: [algum-host-railway]:[porta]/[database]
```

❌ **Incorreto:**
```
Usando PostgreSQL: localhost:5433/apront_db
⚠️  AVISO: DATABASE_URL contém 'localhost' mas está em produção!
```

---

## 🆘 Problemas Comuns

### Problema 1: "Não encontro a variável ${{Postgres.DATABASE_URL}}"

**Solução:**
1. Verifique o nome exato do serviço PostgreSQL no Railway
2. O nome pode ser diferente (ex: `PostgreSQL`, `postgres`, `db`)
3. Use o nome exato: `${{NomeExatoDoServico.DATABASE_URL}}`

### Problema 2: "Ainda aparece localhost nos logs"

**Solução:**
1. Delete completamente a variável `DATABASE_URL` antiga
2. Adicione novamente com `${{Postgres.DATABASE_URL}}`
3. Faça redeploy

### Problema 3: "Railway não está fazendo redeploy automático"

**Solução:**
1. Vá em **Deployments**
2. Clique em **"Redeploy"** no último deployment
3. Ou faça um commit vazio no GitHub para forçar redeploy

### Problema 4: "Ainda dá erro de conexão"

**Solução:**
1. Verifique se o serviço PostgreSQL está rodando (deve aparecer como serviço separado)
2. Verifique se o serviço PostgreSQL está no mesmo projeto Railway
3. Tente deletar e recriar a variável `DATABASE_URL`

---

## 📝 Checklist de Verificação

- [ ] Serviço PostgreSQL criado no Railway
- [ ] Variável `DATABASE_URL` configurada com `${{Postgres.DATABASE_URL}}`
- [ ] Nome do serviço PostgreSQL está correto na variável
- [ ] Variáveis antigas com `localhost` foram removidas
- [ ] Redeploy feito após configurar variáveis
- [ ] Logs mostram URL correta (sem localhost)
- [ ] Aplicação inicia sem erros de conexão

---

## 💡 Dica Extra

Se você tiver múltiplos serviços PostgreSQL no Railway, certifique-se de usar o nome correto:

- Se o serviço se chama `Postgres` → `${{Postgres.DATABASE_URL}}`
- Se o serviço se chama `PostgreSQL` → `${{PostgreSQL.DATABASE_URL}}`
- Se o serviço se chama `db` → `${{db.DATABASE_URL}}`

---

## 🔗 Referências

- [Documentação Railway - Variáveis de Ambiente](https://docs.railway.app/develop/variables)
- [Documentação Railway - PostgreSQL](https://docs.railway.app/databases/postgresql)

---

**Última atualização:** 2025-01-15

