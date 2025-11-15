# 🧪 Testar Conexão com o Backend

## 🔍 Passo 1: Testar Backend Diretamente

Abra no navegador ou use curl:

```
https://apront-production.up.railway.app/
```

**Deve retornar:**
```json
{"message": "API Flask rodando! Use /api/rundowns para acessar os dados."}
```

Se não retornar isso, o backend não está acessível.

## 🔍 Passo 2: Verificar Console do Navegador

1. **Abra o frontend:**
   ```
   https://react-frontend-production-4c4d.up.railway.app
   ```

2. **Abra o Console (F12 → Console)**

3. **Procure por estas mensagens no início (quando a página carrega):**

   ```
   🔧 API configurada: {
     frontend: "https://...",
     hostname: "react-frontend-production-4c4d.up.railway.app",
     API_BASE_URL: "https://apront-production.up.railway.app",
     WS_URL: "wss://apront-production.up.railway.app"
   }
   ```

4. **Procure por mensagens de teste de conectividade:**
   - ✅ `✅ Backend respondeu: 200 OK` → Backend está acessível
   - ❌ `❌ ERRO: Não foi possível conectar ao backend!` → Problema de conexão

## 🔍 Passo 3: Testar Requisição Manual

No Console do Navegador (F12), execute:

```javascript
fetch('https://apront-production.up.railway.app/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Teste',
    email: 'teste@teste.com',
    password: 'teste123',
    company: 'Teste'
  })
})
.then(res => {
  console.log('✅ Status:', res.status);
  console.log('✅ Headers:', res.headers);
  return res.json();
})
.then(data => console.log('✅ Resposta:', data))
.catch(err => {
  console.error('❌ Erro:', err);
  console.error('❌ Tipo:', err.name);
  console.error('❌ Mensagem:', err.message);
});
```

**Resultados possíveis:**

1. **✅ Status 200 ou 400:** Backend está funcionando! (400 é normal para dados inválidos)
2. **❌ CORS Error:** Problema de CORS - backend precisa permitir a origem do frontend
3. **❌ Network Error:** Backend não está acessível ou está offline
4. **❌ Timeout:** Backend está lento ou não responde

## 🔍 Passo 4: Verificar CORS

Se der erro de CORS, verifique:

1. **No Console, procure por:**
   ```
   Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
   ```

2. **Verifique os headers da resposta:**
   - Deve ter `Access-Control-Allow-Origin: *` ou o domínio do frontend

3. **Teste com curl (no terminal):**
   ```bash
   curl -X OPTIONS https://apront-production.up.railway.app/api/auth/register \
     -H "Origin: https://react-frontend-production-4c4d.up.railway.app" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

   **Deve retornar headers CORS:**
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
   ```

## 🎯 Diagnóstico Rápido

### Se o backend não responde (Passo 1):
- ✅ Verifique se o backend está rodando no Railway
- ✅ Verifique os logs do backend
- ✅ Verifique se a URL está correta

### Se o backend responde mas o frontend não conecta:
- ✅ Verifique CORS (Passo 4)
- ✅ Verifique o console do navegador (Passo 2)
- ✅ Teste requisição manual (Passo 3)

### Se der erro de CORS:
- ✅ O backend precisa permitir a origem do frontend
- ✅ Verifique se `cors_config.py` foi atualizado
- ✅ Faça redeploy do backend também

---

**Envie os resultados dos testes para diagnóstico completo!**

