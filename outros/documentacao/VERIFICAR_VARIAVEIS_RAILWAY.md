# ✅ Verificação e Configuração de Variáveis no Railway

## 📋 Situação Atual

Você tem:
- ✅ 1 Service Variable (variável de serviço)
- ✅ Shared Variables (variáveis compartilhadas)
- ✅ 7 variáveis automáticas do Railway
- ❌ **FALTA:** `DATABASE_URL` (não está visível)

---

## 🔍 Passo 1: Verificar o que já existe

### 1.1. Ver a Service Variable

1. Na tela de **Variables** do serviço Backend
2. Procure pela variável que aparece como "1 Service Variable"
3. Clique nela para ver o nome e valor
4. **Anote** o que encontrar

### 1.2. Ver Shared Variables

1. Na mesma tela, procure por "Shared Variable"
2. Clique para expandir e ver quais são
3. **Anote** todas as variáveis compartilhadas

---

## 🎯 Passo 2: Verificar se há Serviço PostgreSQL

### 2.1. Ver todos os serviços do projeto

1. No Railway, vá para a **página principal do projeto**
2. Veja todos os serviços listados
3. Procure por um serviço **PostgreSQL** ou **Database**

### 2.2. Anotar o nome exato

**Exemplos de nomes comuns:**
- `Postgres`
- `PostgreSQL`
- `postgres`
- `db`
- `database`

**⚠️ IMPORTANTE:** Anote o nome **exato** (case-sensitive!)

---

## ✅ Passo 3: Adicionar DATABASE_URL

### 3.1. Se você TEM serviço PostgreSQL

1. Vá em **Backend → Variables**
2. Clique em **"+ New Variable"** ou **"New Variable"**
3. Configure:
   - **Name:** `DATABASE_URL`
   - **Value:** `${{NomeDoServicoPostgreSQL.DATABASE_URL}}`
   
   **Exemplo:**
   - Se o serviço se chama `Postgres` → `${{Postgres.DATABASE_URL}}`
   - Se o serviço se chama `PostgreSQL` → `${{PostgreSQL.DATABASE_URL}}`

4. Clique em **"Add"** ou **"Save"**

### 3.2. Se você NÃO TEM serviço PostgreSQL

**Você precisa criar primeiro:**

1. No Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Aguarde o Railway criar o serviço
4. Anote o nome do serviço criado
5. Volte para **Backend → Variables**
6. Adicione `DATABASE_URL=${{NomeDoServico.DATABASE_URL}}`

---

## 🔐 Passo 4: Adicionar Variáveis de Segurança

### 4.1. Gerar chaves seguras

Execute no terminal local (ou use um gerador online):

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Execute **2 vezes** para gerar 2 chaves diferentes.

### 4.2. Adicionar no Railway

1. Vá em **Backend → Variables**
2. Adicione:

**Variável 1:**
- **Name:** `SECRET_KEY`
- **Value:** `[PRIMEIRA_CHAVE_GERADA]`

**Variável 2:**
- **Name:** `JWT_SECRET_KEY`
- **Value:** `[SEGUNDA_CHAVE_GERADA]`

---

## ⚙️ Passo 5: Adicionar Variáveis Opcionais (Recomendadas)

### 5.1. Variáveis de Ambiente

Adicione estas variáveis no **Backend → Variables**:

```env
FLASK_ENV=production
PORT=8080
```

**Nota:** Railway pode usar `PORT` automaticamente. Se der erro, remova essa variável.

---

## 📝 Checklist Final

Após configurar, você deve ter:

### Variáveis Obrigatórias:
- [ ] `DATABASE_URL=${{NomeDoServico.DATABASE_URL}}`
- [ ] `SECRET_KEY=[chave_gerada]`
- [ ] `JWT_SECRET_KEY=[chave_gerada]`

### Variáveis Opcionais (Recomendadas):
- [ ] `FLASK_ENV=production`
- [ ] `PORT=8080` (ou deixe Railway usar automaticamente)

### Variáveis Automáticas (já existem):
- [x] `RAILWAY_PRIVATE_DOMAIN`
- [x] `RAILWAY_PROJECT_NAME`
- [x] `RAILWAY_ENVIRONMENT_NAME`
- [x] `RAILWAY_SERVICE_NAME`
- [x] `RAILWAY_PROJECT_ID`
- [x] `RAILWAY_ENVIRONMENT_ID`
- [x] `RAILWAY_SERVICE_ID`

---

## 🚨 Problemas Comuns

### Problema 1: "Não encontro o serviço PostgreSQL"

**Solução:**
1. Verifique se você está no projeto correto
2. Procure por "Database" ou "Postgres" na lista de serviços
3. Se não existir, crie um novo (Passo 3.2)

### Problema 2: "Erro ao usar ${{...}}"

**Possíveis causas:**
- Nome do serviço está errado (case-sensitive!)
- Serviço PostgreSQL não está ativo
- Sintaxe incorreta (deve ser exatamente `${{Nome.VARIAVEL}}`)

**Solução:**
1. Verifique o nome exato do serviço
2. Certifique-se que o serviço está rodando
3. Use a sintaxe exata: `${{NomeDoServico.DATABASE_URL}}`

### Problema 3: "Variável vazia causa erro"

**Solução:**
1. Não deixe variáveis com valor vazio
2. Se uma variável não é necessária, delete-a
3. Se é necessária, configure um valor válido

---

## 🔄 Após Configurar

1. **Salve** todas as variáveis
2. O Railway deve fazer **redeploy automático**
3. Se não fizer, vá em **Deployments → Redeploy**
4. Verifique os **logs** para confirmar que está funcionando

---

## 📊 O que você deve ver nos logs

### ✅ Sucesso:
```
✅ Construído DATABASE_URL a partir de variáveis individuais do Railway
✅ Usando PostgreSQL: [host]:[port]/[database]
OK: Seguranca e rate limiting ativados
```

### ❌ Erro (se ainda houver problema):
```
⚠️  ERRO: DATABASE_URL contém 'localhost' mas está em produção!
❌ ERRO CRÍTICO: Não foi possível configurar conexão com banco de dados!
```

---

## 💡 Dica Extra

Se você não conseguir usar `${{...}}`, pode usar variáveis individuais:

1. Vá no serviço **PostgreSQL → Variables**
2. Anote os valores de:
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`
3. Vá em **Backend → Variables**
4. Adicione essas variáveis manualmente (ou use referências se disponível)

O código já está preparado para usar essas variáveis individuais automaticamente!

---

**Última atualização:** 2025-01-15

