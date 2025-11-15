# 🔍 Diagnosticar Erro de Conexão Frontend → Backend

## ⚠️ Problema Comum

A variável `VITE_API_BASE_URL` está configurada, mas o frontend ainda não conecta.

**Causa:** Variáveis `VITE_*` são injetadas no **BUILD**, não no runtime!

## 🔍 Passo 1: Verificar no Console do Navegador

1. **Abra o frontend no navegador:**
   ```
   https://react-frontend-production-4c4d.up.railway.app
   ```

2. **Abra o Console (F12 → Console)**

3. **Procure por estas mensagens:**

   ✅ **Se aparecer:**
   ```
   🚀 Ambiente de produção detectado, usando: https://apront-production.up.railway.app
   ✅ Backend respondeu: 200 OK
   ```
   → **Está funcionando!** A variável foi injetada corretamente.

   ⚠️ **Se aparecer:**
   ```
   ⚠️ VITE_API_BASE_URL não configurado. Usando URL padrão do backend.
   ✅ Backend respondeu: 200 OK
   ```
   → **Está funcionando com fallback!** Mas configure a variável para produção.

   ❌ **Se aparecer:**
   ```
   ❌ ERRO: Não foi possível conectar ao backend!
   ❌ URL tentada: https://...
   ```
   → **Problema de conexão!** Veja Passo 2.

## 🔧 Passo 2: Forçar Redeploy do Frontend

**IMPORTANTE:** Se você adicionou a variável **DEPOIS** do build, precisa fazer **novo build**!

### No Railway:

1. **Vá para o serviço do frontend**
2. **Vá em "Deployments"**
3. **Clique em "Redeploy"** no deployment mais recente
   - OU clique nos **3 pontinhos (⋮)** → **"Redeploy"**

4. **Aguarde o build terminar** (pode levar 2-5 minutos)

5. **Teste novamente** após o redeploy

## 🔍 Passo 3: Verificar Valor da Variável

1. **No Railway:**
   - Serviço do frontend → **Settings** → **Variables**
   - Verifique se `VITE_API_BASE_URL` está com o valor:
     ```
     https://apront-production.up.railway.app
     ```

2. **Verifique se está aplicada para "Production":**
   - Deve estar marcado em **"Production"** (ou "All Environments")

## 🔍 Passo 4: Verificar CORS no Backend

Se o console mostra que está tentando conectar, mas dá erro de CORS:

1. **Verifique os logs do backend no Railway**
2. **Procure por erros de CORS**

O CORS já foi corrigido para permitir qualquer origem no Railway, mas verifique se o backend foi redeployado também.

## 🎯 Solução Rápida

### Opção 1: Redeploy Manual (Recomendado)

1. **Frontend:** Settings → Deployments → Redeploy
2. **Aguarde build terminar**
3. **Teste novamente**

### Opção 2: Verificar se o Código Atualizado Foi Deployado

O código tem um **fallback** que usa automaticamente `https://apront-production.up.railway.app` quando detecta Railway.

**Verifique no console:**
- Se aparecer a mensagem de fallback, o código atualizado foi deployado
- Se não aparecer, o código antigo ainda está rodando

## 📝 Checklist

- [ ] Variável `VITE_API_BASE_URL` configurada no Railway
- [ ] Valor correto: `https://apront-production.up.railway.app`
- [ ] Aplicada para "Production"
- [ ] Frontend foi **redeployado** após adicionar a variável
- [ ] Console do navegador mostra qual URL está sendo usada
- [ ] Backend está respondendo (teste: `https://apront-production.up.railway.app/`)

## 🚨 Se Ainda Não Funcionar

1. **Abra o Console do Navegador (F12)**
2. **Copie TODAS as mensagens de erro**
3. **Me envie:**
   - Mensagens do console
   - URL que aparece em "API configurada"
   - Erro exato que aparece ao tentar cadastrar

---

**Dica:** O fallback que adicionei deve fazer funcionar mesmo sem a variável, mas é melhor configurar corretamente para produção!

