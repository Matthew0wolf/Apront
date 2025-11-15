# 🚂 Guia Completo de Deploy no Railway.app

## ✅ Por que Railway.app?

**Railway é a MELHOR opção gratuita para sua equipe de QA testar:**

- ✅ **Backend sempre ativo** (não suspende como Render)
- ✅ **Banco PostgreSQL gratuito** por mais tempo
- ✅ **Mais rápido** que Render
- ✅ **HTTPS automático** (seguro)
- ✅ **WebSocket suportado** (para seu sistema em tempo real)
- ✅ **Deploy automático** via GitHub
- ✅ **Logs em tempo real** para debug

**Limitações do plano gratuito:**
- ⚠️ $5 de créditos mensais (suficiente para testes de QA)
- ⚠️ Após esgotar créditos, precisa aguardar ou fazer upgrade

---

## 📋 Pré-requisitos

1. ✅ Conta no GitHub (gratuita)
2. ✅ Conta no Railway.app (gratuita - conecte com GitHub)
3. ✅ Repositório do projeto no GitHub

---

## 🚀 Passo a Passo Completo

### 1. Preparar Repositório no GitHub

```bash
# Se ainda não tiver o projeto no GitHub
cd Apront
git init
git add .
git commit -m "Preparado para deploy no Railway"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

**⚠️ IMPORTANTE:** Adicione `.env` ao `.gitignore` para não commitar senhas!

---

### 2. Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com sua conta GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha seu repositório
6. Railway criará um projeto vazio

---

### 3. Adicionar Banco PostgreSQL

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Railway criará automaticamente um banco PostgreSQL
4. **Anote a URL do banco** (aparece nas variáveis de ambiente)

---

### 4. Deploy do Backend

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"GitHub Repo"** novamente (ou **"Empty"** se já conectou)
3. Selecione seu repositório
4. Railway detectará automaticamente que é Python

#### 4.1. Configurar Build e Start

**Settings** → **Deploy**:
- **Root Directory**: `/backend` (ou deixe vazio se backend está na raiz)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`

#### 4.2. Variáveis de Ambiente (CRÍTICO!)

Vá em **Variables** e adicione:

```env
# Banco de Dados (Railway gera automaticamente, mas verifique)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Segurança (GERE CHAVES ÚNICAS E SEGURAS!)
SECRET_KEY=GERE_UMA_CHAVE_SUPER_SEGURA_AQUI_32_CARACTERES_MINIMO
JWT_SECRET_KEY=OUTRA_CHAVE_DIFERENTE_AQUI_32_CARACTERES_MINIMO

# Ambiente
FLASK_ENV=production
PORT=5001

# CORS (URL do frontend - será configurado depois)
CORS_ORIGINS=https://seu-frontend.up.railway.app

# Email (opcional, mas recomendado)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app_google
FROM_EMAIL=seu_email@gmail.com
```

**🔐 Como gerar chaves seguras:**

```bash
# No terminal (Linux/Mac) ou PowerShell (Windows)
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Execute 2 vezes para gerar `SECRET_KEY` e `JWT_SECRET_KEY` diferentes!

#### 4.3. Configurar Domínio

1. Vá em **Settings** → **Networking**
2. Clique em **"Generate Domain"**
3. Railway gerará uma URL como: `seu-backend-production.up.railway.app`
4. **Anote esta URL** (precisa para o frontend)

---

### 5. Deploy do Frontend

1. No mesmo projeto Railway, clique em **"+ New"**
2. Selecione **"GitHub Repo"** novamente
3. Selecione o mesmo repositório

#### 5.1. Configurar Build

**Settings** → **Deploy**:
- **Root Directory**: `/` (raiz do projeto)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npx serve -s dist -l 3000` (ou use Vercel/Netlify)

**OU melhor ainda:** Use **Vercel** ou **Netlify** para o frontend (são gratuitos e melhores para sites estáticos):

1. Acesse [vercel.com](https://vercel.com) ou [netlify.com](https://netlify.com)
2. Conecte seu repositório GitHub
3. Configure:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**: `VITE_API_BASE_URL=https://seu-backend.up.railway.app`

#### 5.2. Atualizar Configuração do Frontend

Você precisa atualizar `src/config/api.js`:

```javascript
const getApiUrl = () => {
  // Em produção (Railway/Vercel/Netlify)
  if (window.location.hostname.includes('railway.app') || 
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('netlify.app')) {
    return 'https://seu-backend-production.up.railway.app';
  }
  
  // Localhost para desenvolvimento
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  
  // Rede local
  return `http://${window.location.hostname}:5001`;
};
```

---

### 6. Configurar CORS no Backend

O código já está preparado! Basta adicionar a variável de ambiente:

```env
CORS_ORIGINS=https://seu-frontend.vercel.app,https://seu-frontend.netlify.app
```

Ou se usar Railway para frontend também:

```env
CORS_ORIGINS=https://seu-frontend.up.railway.app
```

---

### 7. Testar o Deploy

1. Acesse a URL do backend: `https://seu-backend.up.railway.app/`
2. Deve retornar: `{"message": "API Flask rodando! Use /api/rundowns para acessar os dados."}`
3. Acesse a URL do frontend
4. Tente fazer login

---

## 🔒 Checklist de Segurança

Antes de compartilhar com a equipe de QA, verifique:

- [ ] ✅ `SECRET_KEY` e `JWT_SECRET_KEY` são únicas e seguras (32+ caracteres)
- [ ] ✅ `.env` está no `.gitignore` (não commitar senhas!)
- [ ] ✅ CORS configurado apenas para domínios permitidos
- [ ] ✅ Banco de dados usa senha forte (Railway gera automaticamente)
- [ ] ✅ HTTPS habilitado (Railway faz automaticamente)
- [ ] ✅ Rate limiting ativo (já está no código)
- [ ] ✅ Logs de segurança ativos (já está no código)

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

1. No Railway, clique no serviço (Backend)
2. Aba **"Deployments"** → Clique no deployment mais recente
3. Aba **"Logs"** → Veja logs em tempo real

### Verificar Uso de Créditos

1. Clique no seu nome (canto superior direito)
2. **"Usage"** → Veja créditos restantes

---

## 🆘 Troubleshooting

### Backend não inicia

**Erro:** `ModuleNotFoundError`
- **Solução:** Verifique se `requirements.txt` tem todas as dependências

**Erro:** `Port already in use`
- **Solução:** Railway usa variável `PORT` automaticamente, não precisa configurar

**Erro:** `Database connection failed`
- **Solução:** Verifique se `DATABASE_URL` está correto nas variáveis de ambiente

### Frontend não conecta ao Backend

**Erro:** `CORS error`
- **Solução:** Adicione a URL do frontend em `CORS_ORIGINS`

**Erro:** `Network error`
- **Solução:** Verifique se a URL do backend em `api.js` está correta

### WebSocket não funciona

Railway suporta WebSocket, mas pode precisar configurar:
- Verifique se está usando `socketio.run()` no backend (já está!)
- Frontend deve usar `wss://` (HTTPS) em produção

---

## 📝 Próximos Passos

1. ✅ Deploy completo funcionando
2. ✅ Criar usuários de teste para a equipe de QA
3. ✅ Compartilhar URLs com a equipe
4. ✅ Monitorar logs durante os testes
5. ✅ Coletar feedback e ajustar

---

## 🆚 Railway vs VPS

| Aspecto | Railway | VPS |
|---------|---------|-----|
| **Configuração** | 10 minutos | 2-4 horas |
| **Manutenção** | Zero | Alta |
| **Custo** | $5 créditos/mês (grátis) | $5-10/mês fixo |
| **Escalabilidade** | Automática | Manual |
| **Ideal para** | Testes, MVP, QA | Produção avançada |

**Para testes de QA, Railway é perfeito!** 🎯

---

## 💡 Dicas Finais

1. **Backup do banco:** Railway permite exportar dados facilmente
2. **Variáveis sensíveis:** Use Railway Secrets para senhas
3. **Múltiplos ambientes:** Crie projetos separados (dev, staging, prod)
4. **Monitoramento:** Configure alertas no Railway para erros

---

## ✅ Resumo Rápido

1. Subir código no GitHub
2. Criar projeto no Railway
3. Adicionar PostgreSQL
4. Deploy backend com variáveis de ambiente
5. Deploy frontend (Railway ou Vercel)
6. Configurar CORS
7. Testar e compartilhar com QA

**Tempo estimado:** 15-30 minutos ⏱️

