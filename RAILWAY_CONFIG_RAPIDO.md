# 🚂 Configuração Rápida no Railway - Guia Prático

## ⚡ Configurações Essenciais (FAÇA AGORA!)

### 1. 📦 Adicionar Banco PostgreSQL

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Railway criará automaticamente
4. **IMPORTANTE:** Anote o nome do serviço (ex: `Postgres`)

---

### 2. ⚙️ Configurar Backend (Serviço Principal)

#### 2.1. Settings → Deploy

- **Root Directory**: `backend` (se seu backend está na pasta `backend/`)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`

#### 2.2. Settings → Networking

- Clique em **"Generate Domain"**
- Anote a URL gerada (ex: `seu-backend-production.up.railway.app`)

---

### 3. 🔐 Variáveis de Ambiente (CRÍTICO!)

Vá em **Variables** do serviço Backend e adicione:

#### 3.1. Banco de Dados (Railway gera automaticamente)

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**💡 Dica:** Railway cria automaticamente a variável `${{Postgres.DATABASE_URL}}` quando você adiciona o PostgreSQL. Use essa referência!

#### 3.2. Segurança (GERE AGORA!)

```bash
# Execute no terminal para gerar chaves seguras:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Execute **2 vezes** e adicione:

```env
SECRET_KEY=PRIMEIRA_CHAVE_GERADA_AQUI
JWT_SECRET_KEY=SEGUNDA_CHAVE_GERADA_AQUI
```

#### 3.3. Ambiente e Porta

```env
FLASK_ENV=production
PORT=5001
```

**⚠️ IMPORTANTE:** Railway pode usar a variável `PORT` automaticamente. Se der erro, tente usar `$PORT` no código ou remova essa variável.

#### 3.4. CORS (Configure depois do frontend estar no ar)

```env
CORS_ORIGINS=https://seu-frontend.up.railway.app
```

Ou se usar Vercel/Netlify para frontend:

```env
CORS_ORIGINS=https://seu-frontend.vercel.app
```

---

### 4. 🔄 Inicializar Banco de Dados

Após o primeiro deploy, você precisa criar as tabelas. Opções:

#### Opção A: Via Railway CLI (Recomendado)

```bash
# Instale Railway CLI
npm i -g @railway/cli

# Login
railway login

# Conecte ao projeto
railway link

# Execute script de inicialização
railway run python backend/scripts/populate/populate_plans.py
railway run python backend/scripts/populate/populate_templates.py
```

#### Opção B: Via Logs do Railway

1. Vá em **Deployments** → Último deployment → **Logs**
2. Verifique se há erros de conexão com banco
3. Se necessário, execute comandos via Railway Shell

#### Opção C: Criar endpoint temporário

Adicione temporariamente em `backend/app.py`:

```python
@app.route('/init-db', methods=['POST'])
def init_db():
    from scripts.populate.populate_plans import create_plans
    from scripts.populate.populate_templates import populate_templates
    create_plans()
    populate_templates()
    return jsonify({'message': 'Banco inicializado'})
```

**⚠️ REMOVA DEPOIS!** É apenas para inicialização.

---

### 5. 📊 Verificar se Está Funcionando

1. Acesse: `https://seu-backend-production.up.railway.app/`
2. Deve retornar: `{"message": "API Flask rodando! Use /api/rundowns para acessar os dados."}`
3. Verifique os logs no Railway para erros

---

### 6. 🎨 Frontend (Opcional - Pode fazer depois)

#### Opção A: Railway (mesmo projeto)

1. **"+ New"** → **"GitHub Repo"** → Mesmo repositório
2. **Settings → Deploy:**
   - **Root Directory**: `/` (raiz)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`
3. **Variables:**
   ```env
   VITE_API_BASE_URL=https://seu-backend-production.up.railway.app
   ```

#### Opção B: Vercel (Recomendado - Melhor para frontend)

1. Acesse [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables:**
     ```env
     VITE_API_BASE_URL=https://seu-backend-production.up.railway.app
     ```

---

## ✅ Checklist Rápido

- [ ] PostgreSQL adicionado ao projeto
- [ ] Backend configurado com Root Directory = `backend`
- [ ] Variáveis de ambiente configuradas:
  - [ ] `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - [ ] `SECRET_KEY` (chave única gerada)
  - [ ] `JWT_SECRET_KEY` (chave única gerada)
  - [ ] `FLASK_ENV=production`
- [ ] Domínio gerado e anotado
- [ ] Banco de dados inicializado (tabelas criadas)
- [ ] Backend respondendo na URL gerada
- [ ] Frontend configurado (Railway ou Vercel)
- [ ] CORS configurado com URL do frontend

---

## 🆘 Problemas Comuns

### ❌ "ModuleNotFoundError"
**Solução:** Verifique se `requirements.txt` está completo e se o build está instalando dependências.

### ❌ "Port already in use"
**Solução:** Railway usa `$PORT` automaticamente. No código, use:
```python
port = int(os.getenv('PORT', 5001))
```

### ❌ "Database connection failed"
**Solução:** 
1. Verifique se PostgreSQL está rodando (deve aparecer como serviço separado)
2. Verifique se `DATABASE_URL` está correto
3. Use `${{Postgres.DATABASE_URL}}` (referência automática do Railway)

### ❌ "CORS error"
**Solução:** Adicione a URL do frontend em `CORS_ORIGINS` nas variáveis de ambiente.

---

## 💡 Dicas Importantes

1. **Logs em Tempo Real:** Railway mostra logs em tempo real. Use para debug!
2. **Créditos:** Monitore uso em **Settings → Usage**
3. **Redeploy:** Qualquer push no GitHub redeploya automaticamente
4. **Variáveis Secretas:** Railway protege automaticamente variáveis sensíveis
5. **HTTPS:** Railway fornece HTTPS automaticamente (use `https://` nas URLs)

---

## 📝 Próximos Passos Após Configurar

1. ✅ Testar login/cadastro
2. ✅ Criar usuários de teste para QA
3. ✅ Verificar se WebSocket está funcionando
4. ✅ Testar todas as funcionalidades principais
5. ✅ Compartilhar URLs com equipe de QA

---

## 🔗 Links Úteis

- **Railway Dashboard:** https://railway.app/dashboard
- **Documentação Railway:** https://docs.railway.app
- **Status Railway:** https://status.railway.app

---

**Tempo estimado para configurar:** 10-15 minutos ⏱️

