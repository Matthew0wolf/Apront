# 🔧 Configurar Backend no Railway

## ⚠️ Problema Identificado

O serviço "Apront" está rodando como **frontend (Node.js)** em vez de **backend (Python)** porque o Railway detectou o `package.json` na raiz.

## ✅ Solução: Configurar Root Directory

### Passo a Passo:

1. **No Railway Dashboard:**
   - Abra o serviço **"Apront"** (backend)
   - Vá em **"Settings"**
   - Procure por **"Root Directory"** ou **"Source"**

2. **Configure o Root Directory:**
   - **Root Directory:** `/backend`
   - Isso fará o Railway usar apenas a pasta `backend` e ignorar o `package.json` da raiz

3. **Configure o Start Command:**
   - Vá em **"Settings"** → **"Deploy"**
   - **Start Command:** `python app.py`
   - OU deixe vazio para usar o padrão do Railway

4. **Salve as configurações**

5. **Faça Redeploy:**
   - Vá em **"Deployments"**
   - Clique em **"Redeploy"**

## 🔍 Verificar se Funcionou

Após o redeploy, os logs devem mostrar:

```
==================================================
   SISTEMA APRONT - INICIANDO BACKEND
==================================================

📦 Verificando dependências do backend...
   Instalando dependências Python...
✅ Dependências verificadas!

🚀 Iniciando Backend Flask...
📡 Backend será iniciado na porta 8080

🔧 Configurando CORS:
   Ambiente: PRODUÇÃO
   Origens permitidas: *
✅ CORS configurado (usando apenas headers manuais)
```

**Se aparecer "npm" ou "Accepting connections":** O Root Directory não foi configurado corretamente.

## 📝 Alternativa: Usar Dockerfile

Se o Root Directory não funcionar, você pode:

1. **Configurar para usar Dockerfile:**
   - **Settings** → **Build** → **Builder**
   - Selecione **"Dockerfile"**
   - **Dockerfile Path:** `backend/Dockerfile`

2. **Redeploy**

## 🎯 Resumo

- ✅ **Root Directory:** `/backend`
- ✅ **Start Command:** `python app.py` (ou deixar vazio)
- ✅ **Redeploy** após configurar

---

**Configure o Root Directory e me envie os novos logs!**

