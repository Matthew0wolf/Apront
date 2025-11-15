# 🎯 Guia Visual: Deploy do Frontend no Railway

## 📍 Passo 1: Criar Novo Serviço

1. **No Dashboard do Railway:**
   - Abra seu projeto "Apront"
   - Você verá o serviço "Apront" (backend) já rodando
   - Clique no botão **"+ New"** ou **"New Service"** (canto superior direito)

2. **Escolha a Fonte:**
   - Se seu código está no **GitHub:**
     - Clique em **"GitHub Repo"**
     - Selecione seu repositório
     - O Railway detecta automaticamente que é React/Vite
   
   - Se não está no GitHub:
     - Clique em **"Empty Service"**
     - Depois faça upload do código

## 📍 Passo 2: Configurar o Serviço

### A. Root Directory
- Deixe **vazio** ou **`/`** (o frontend está na raiz do projeto)

### B. Settings → Build
1. Clique em **"Settings"** no serviço do frontend
2. Vá na aba **"Build"**
3. **Build Command:** (geralmente detecta automaticamente)
   ```
   npm install && npm run build
   ```
   Se já aparecer, não precisa mudar!

### C. Settings → Deploy
1. Na aba **"Deploy"**
2. **Start Command:**
   ```
   npx serve -s dist -l $PORT
   ```
   ⚠️ **IMPORTANTE:** Cole exatamente isso!

## 📍 Passo 3: Configurar Variável de Ambiente (CRÍTICO!)

1. **No serviço do frontend:**
   - Vá em **Settings** → **Variables**

2. **Adicione nova variável:**
   - Clique em **"+ New Variable"**
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://apront-production.up.railway.app`
   - **Apply to:** Selecione **"Production"** (ou "All Environments")
   - Clique em **"Add"**

3. **Verifique se apareceu na lista:**
   ```
   VITE_API_BASE_URL = https://apront-production.up.railway.app
   ```

## 📍 Passo 4: Deploy Automático

Se você conectou o GitHub:
- O Railway detecta automaticamente mudanças
- Faz deploy automaticamente quando você faz push

Se não conectou:
- Clique em **"Deploy"** ou **"Redeploy"**
- Aguarde o build completar

## ✅ Verificação

### 1. Verifique os Logs
- Vá na aba **"Logs"**
- Você deve ver:
  ```
  ✓ Build completed
  ✓ Starting server on port XXXX
  ```

### 2. Obtenha a URL Pública
- Vá em **Settings** → **Networking**
- Você verá a URL pública, algo como:
  ```
  https://apront-frontend-production.up.railway.app
  ```

### 3. Teste no Navegador
1. Abra a URL pública
2. Abra o **Console do Navegador** (F12)
3. Você deve ver:
   ```
   🚀 Ambiente de produção detectado, usando: https://apront-production.up.railway.app
   ✅ Backend respondeu: 200 OK
   ```

## 🎨 O Que o Railway Detecta Automaticamente

O Railway é **inteligente** e detecta automaticamente:

- ✅ **Node.js/React** pelo `package.json`
- ✅ **Build command** pelo script `build` no `package.json`
- ✅ **Dependências** pelo `package-lock.json`

Você só precisa configurar:
- ⚙️ **Start Command** (para servir os arquivos buildados)
- 🔑 **Variável de Ambiente** `VITE_API_BASE_URL`

## 📋 Checklist Rápido

- [ ] Novo serviço criado no Railway
- [ ] Root Directory: `/` (ou vazio)
- [ ] Build Command: `npm install && npm run build` (ou automático)
- [ ] Start Command: `npx serve -s dist -l $PORT`
- [ ] Variável `VITE_API_BASE_URL` configurada
- [ ] Deploy iniciado
- [ ] Logs mostram sucesso
- [ ] URL pública obtida
- [ ] Frontend carrega no navegador
- [ ] Console mostra conexão com backend

## 🐛 Problemas Comuns

### ❌ "Cannot find module 'serve'"
**Solução:** O `package.json` já foi atualizado com `serve`. Se ainda der erro:
- Verifique se fez commit e push das mudanças
- Ou adicione manualmente: `npm install --save-dev serve`

### ❌ "Port already in use"
**Solução:** Use `$PORT` no comando (já está correto no guia)

### ❌ Frontend não conecta ao backend
**Solução:** 
- Verifique se `VITE_API_BASE_URL` está configurada
- Verifique se o valor está correto: `https://apront-production.up.railway.app`
- Verifique se aplicou para "Production"

### ❌ Build falha
**Solução:**
- Verifique os logs do Railway
- Certifique-se de que todas as dependências estão no `package.json`

## 🎉 Pronto!

Depois de seguir esses passos, seu frontend estará rodando no Railway e conectado ao backend!

---

**Dica:** O Railway detecta automaticamente projetos React/Vite. Você só precisa configurar o Start Command e a variável de ambiente!

