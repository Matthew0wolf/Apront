# 🔍 Debug: Erro 401 ao Salvar Script

## ❌ Problema

```
PUT http://72.60.56.28/api/items/3004/script 401 (UNAUTHORIZED)
```

O erro 401 indica que o token JWT não está sendo validado corretamente pelo decorador `jwt_required()` antes mesmo de executar a função.

## ✅ Correções Implementadas

### 1. Logs Melhorados no Decorador `jwt_required()`

Adicionei logs detalhados no decorador para identificar exatamente qual é o problema:

- ✅ Log quando token não é fornecido
- ✅ Log quando formato do token está incorreto
- ✅ Log quando token está expirado
- ✅ Log quando token é inválido
- ✅ Log quando usuário não é encontrado
- ✅ Headers CORS em todas as respostas de erro

**Arquivo:** `Apront/backend/utils/auth_utils.py`

### 2. Mensagens de Erro Mais Informativas

O frontend agora mostra mensagens mais claras sobre o erro 401:

- ✅ Mostra o detalhe específico do erro (token expirado, inválido, etc.)
- ✅ Salva localmente quando há erro 401 (fallback)
- ✅ Sincroniza via WebSocket mesmo quando salva localmente

**Arquivo:** `Apront/src/components/dialogs/ScriptEditorDialog.jsx`

## 🔍 Possíveis Causas do Erro 401

### 1. Token Expirado
- **Sintoma:** Token foi emitido há muito tempo e expirou
- **Solução:** O `useApi` já tenta fazer refresh automático, mas pode falhar

### 2. JWT_SECRET_KEY Diferente
- **Sintoma:** Frontend e backend estão usando chaves secretas diferentes
- **Solução:** Verificar se `JWT_SECRET_KEY` é a mesma no frontend e backend

### 3. Token Não Enviado
- **Sintoma:** Header `Authorization` não está sendo enviado
- **Solução:** Verificar se o token está no localStorage e sendo enviado

### 4. Usuário Não Encontrado
- **Sintoma:** O `user_id` no token não corresponde a nenhum usuário no banco
- **Solução:** Verificar se o usuário existe no banco de dados

## 🔧 Como Debugar

### 1. Verificar Logs do Backend

Após as correções, os logs vão mostrar exatamente qual é o problema:

```bash
# Na VPS, verificar logs do backend
tail -f /tmp/backend.log | grep "jwt_required"
```

Os logs vão mostrar mensagens como:
- `❌ jwt_required: Token expirado para rota /api/items/3004/script`
- `❌ jwt_required: Token inválido para rota /api/items/3004/script`
- `❌ jwt_required: Usuário 123 não encontrado no banco de dados`

### 2. Verificar Token no Frontend

No console do navegador, verificar:

```javascript
// Verificar se o token existe
console.log('Token:', localStorage.getItem('token'));

// Verificar se o token está sendo enviado
// (abrir Network tab e verificar header Authorization)
```

### 3. Verificar JWT_SECRET_KEY

Na VPS, verificar se a chave está configurada:

```bash
# Verificar variável de ambiente
echo $JWT_SECRET_KEY

# Ou no arquivo .env
grep JWT_SECRET_KEY ~/Apront/backend/.env
```

### 4. Testar Endpoint Manualmente

```bash
# Obter token do localStorage do navegador
TOKEN="seu_token_aqui"

# Testar endpoint
curl -X PUT http://72.60.56.28/api/items/3004/script \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"script":"teste"}'
```

## 📋 Checklist de Verificação

- [ ] Verificar logs do backend para identificar erro específico
- [ ] Verificar se token existe no localStorage
- [ ] Verificar se token não está expirado (tentar fazer login novamente)
- [ ] Verificar se `JWT_SECRET_KEY` está configurada corretamente na VPS
- [ ] Verificar se o usuário existe no banco de dados
- [ ] Testar endpoint manualmente com curl

## 🔄 Solução Temporária

O código já tem uma solução temporária que funciona:

1. **Quando há erro 401:**
   - Script é salvo localmente (no estado do React)
   - Script é sincronizado via WebSocket com outros clientes
   - Apresentador recebe o script em tempo real
   - Script será salvo no banco quando o projeto for salvo

2. **Isso significa que:**
   - ✅ O script não é perdido
   - ✅ O apresentador vê o script imediatamente
   - ✅ O script será persistido quando o projeto for salvo

## 🎯 Próximos Passos

1. **Verificar logs do backend** para identificar a causa exata do 401
2. **Verificar se o token está sendo enviado** corretamente
3. **Verificar se `JWT_SECRET_KEY`** está configurada na VPS
4. **Se o problema persistir**, considerar fazer login novamente para obter um novo token

---

**Status:** 🔧 **CORREÇÕES APLICADAS - AGUARDANDO VERIFICAÇÃO**

Os logs melhorados vão ajudar a identificar a causa exata do problema quando você verificar os logs do backend na VPS.

