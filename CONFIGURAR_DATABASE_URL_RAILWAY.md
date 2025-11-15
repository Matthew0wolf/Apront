# ✅ Configurar DATABASE_URL no Railway - Passo a Passo

## 📋 Informações do Seu PostgreSQL

Baseado na tela que você mostrou:
- **Nome do Serviço:** `Postgres`
- **Referência Correta:** `${{ Postgres.DATABASE_URL }}`
- **Username:** `postgres`
- **Password:** `pjBCaJAUmtbzsxWbFCmtVuGExrEdczWh`
- **Public Network:** `gondola.proxy.rlwy.net:47023`
- **Private Network:** `postgres.railway.internal:5432`

---

## ✅ Passo a Passo para Configurar

### Passo 1: Ir para o Serviço Backend

1. No Railway, vá para o serviço **Backend** (não o Postgres)
2. Clique em **"Variables"** (ou **"Variables"** na barra lateral)

### Passo 2: Deletar DATABASE_URL Incorreta (SE EXISTIR)

1. Procure por `DATABASE_URL` na lista
2. Se existir e contiver `localhost:5433`, **DELETE completamente**
3. Clique no ícone de lixeira (🗑️) ao lado da variável
4. Confirme a exclusão

### Passo 3: Adicionar DATABASE_URL Correta

1. Clique em **"+ New Variable"** ou **"Add Variable"**
2. Configure:
   - **Variable Name:** `DATABASE_URL`
   - **Variable Value:** `${{ Postgres.DATABASE_URL }}`
   
   **⚠️ IMPORTANTE:**
   - Use exatamente: `${{ Postgres.DATABASE_URL }}`
   - Com espaço após `{{` e antes de `}}`
   - O nome `Postgres` deve ser exatamente como aparece no Railway

3. Clique em **"Add"** ou **"Save"**

### Passo 4: Verificar Outras Variáveis Necessárias

Certifique-se de ter também:

- `SECRET_KEY` = [chave gerada - não pode estar vazio]
- `JWT_SECRET_KEY` = [outra chave gerada - não pode estar vazio]
- `FLASK_ENV` = `production` (opcional)
- `PORT` = `8080` (opcional - Railway pode usar automaticamente)

### Passo 5: Aguardar Redeploy

1. Após salvar, o Railway deve fazer **redeploy automático**
2. Se não fizer, vá em **"Deployments"** → **"Redeploy"**
3. Aguarde o deploy completar

---

## 🔍 Verificação nos Logs

Após o redeploy, você deve ver nos logs:

### ✅ Sucesso:
```
🔍 Ambiente detectado: PRODUÇÃO (Railway)
✅ Usando PostgreSQL: [host-railway]:[port]/[database]
OK: Seguranca e rate limiting ativados
```

**NÃO deve aparecer:**
- ❌ `localhost:5433`
- ❌ `ERRO CRÍTICO`
- ❌ `Connection refused`

---

## 🆘 Se Ainda Der Erro

### Problema 1: "Referência não encontrada"

**Causa:** Nome do serviço está errado

**Solução:**
1. Verifique o nome exato do serviço PostgreSQL
2. Deve ser exatamente `Postgres` (case-sensitive)
3. Use: `${{ Postgres.DATABASE_URL }}`

### Problema 2: "Ainda aparece localhost"

**Causa:** Variável antiga não foi deletada

**Solução:**
1. Delete completamente a variável `DATABASE_URL` antiga
2. Adicione novamente com `${{ Postgres.DATABASE_URL }}`
3. Faça redeploy

### Problema 3: "Variável vazia"

**Causa:** Referência está incorreta ou serviço não está ativo

**Solução:**
1. Verifique se o serviço PostgreSQL está rodando
2. Verifique se o nome está correto: `Postgres`
3. Tente usar variáveis individuais (veja alternativa abaixo)

---

## 🔄 Alternativa: Usar Variáveis Individuais

Se `${{ Postgres.DATABASE_URL }}` não funcionar, você pode usar variáveis individuais:

### No Serviço Backend → Variables, adicione:

```env
PGHOST=postgres.railway.internal
PGPORT=5432
PGUSER=postgres
PGPASSWORD=pjBCaJAUmtbzsxWbFCmtVuGExrEdczWh
PGDATABASE=railway
```

**Nota:** O código já está preparado para usar essas variáveis automaticamente!

---

## 📝 Checklist Final

- [ ] Variável `DATABASE_URL` antiga (com localhost) foi deletada
- [ ] Nova variável `DATABASE_URL=${{ Postgres.DATABASE_URL }}` foi adicionada
- [ ] Nome do serviço está correto: `Postgres`
- [ ] Variáveis de segurança (`SECRET_KEY`, `JWT_SECRET_KEY`) estão configuradas
- [ ] Redeploy foi feito
- [ ] Logs mostram URL correta (sem localhost)

---

## 💡 Dica Importante

O Railway injeta automaticamente a URL correta quando você usa `${{ Postgres.DATABASE_URL }}`. Isso é melhor do que usar valores hardcoded porque:

- ✅ Funciona automaticamente
- ✅ Atualiza se o banco mudar
- ✅ Mais seguro (não expõe credenciais)

---

**Última atualização:** 2025-01-15

