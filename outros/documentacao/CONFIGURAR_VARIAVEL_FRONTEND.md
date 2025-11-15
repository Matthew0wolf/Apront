# ⚠️ IMPORTANTE: Configurar Variável de Ambiente no Frontend

## 🔴 Problema Atual

O frontend não está conseguindo conectar ao backend porque a variável `VITE_API_BASE_URL` **não está configurada** no Railway.

## ✅ Solução: Configurar Variável no Railway

### Passo a Passo:

1. **No Railway Dashboard:**
   - Abra seu projeto "Apront"
   - Clique no serviço do **frontend** (não o backend!)

2. **Vá em Settings → Variables:**
   - Clique na aba **"Variables"**

3. **Adicione a Variável:**
   - Clique em **"+ New Variable"**
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://apront-production.up.railway.app`
   - **Apply to:** Selecione **"Production"** (ou "All Environments")
   - Clique em **"Add"**

4. **Verifique se Apareceu:**
   ```
   VITE_API_BASE_URL = https://apront-production.up.railway.app
   ```

5. **Redeploy do Frontend:**
   - Após adicionar a variável, o Railway fará redeploy automaticamente
   - OU vá em **"Deployments"** → **"Redeploy"**

## 🔍 Como Verificar se Está Funcionando

### 1. Abra o Console do Navegador (F12)

Depois do redeploy, você deve ver:

```
🚀 Ambiente de produção detectado, usando: https://apront-production.up.railway.app
✅ Backend respondeu: 200 OK
✅ Backend ativo: {message: "API Flask rodando! Use /api/rundowns para acessar os dados."}
```

### 2. Se Ainda Der Erro

Verifique:
- ✅ A variável está configurada corretamente?
- ✅ O valor está correto: `https://apront-production.up.railway.app`
- ✅ Foi aplicada para "Production"?
- ✅ O frontend foi redeployado após adicionar a variável?

## 📝 Nota Importante

**Variáveis de ambiente do Vite (`VITE_*`) são injetadas no BUILD, não no runtime!**

Isso significa:
- ✅ Você precisa configurar a variável **ANTES** do build
- ✅ Se você adicionar a variável depois, precisa fazer **novo build/deploy**
- ✅ O Railway faz isso automaticamente quando você adiciona a variável

## 🎯 Resumo

1. ✅ Backend funcionando: `https://apront-production.up.railway.app`
2. ⏳ Frontend: Adicione `VITE_API_BASE_URL = https://apront-production.up.railway.app`
3. ⏳ Aguarde redeploy automático
4. ⏳ Teste novamente o cadastro

---

**Dica:** Se você já adicionou a variável mas ainda não funciona, faça um redeploy manual do frontend!

