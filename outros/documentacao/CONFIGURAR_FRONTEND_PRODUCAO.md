# Configurar Frontend para Produção no Railway

## 🎯 Objetivo

Configurar o frontend para usar a URL do backend em produção:
```
https://apront-production.up.railway.app
```

## 📋 Método 1: Variável de Ambiente (Recomendado)

### Para Deploy no Railway/Vercel/Netlify:

1. **Configure a variável de ambiente no build:**
   - Nome: `VITE_API_BASE_URL`
   - Valor: `https://apront-production.up.railway.app`

2. **O arquivo `src/config/api.js` já está preparado** para usar essa variável automaticamente!

### Como Configurar:

#### No Railway (se o frontend também estiver no Railway):
1. Vá para o serviço do frontend
2. Settings → Variables
3. Adicione:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://apront-production.up.railway.app`

#### No Vercel/Netlify:
1. Vá para Project Settings → Environment Variables
2. Adicione:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://apront-production.up.railway.app`

## 📋 Método 2: Atualizar URLs Hardcoded

Alguns arquivos ainda usam `http://localhost:5001` diretamente. Você precisa atualizá-los:

### Arquivos que Precisam de Atualização:

1. **`src/components/views/TemplatesView.jsx`**
2. **`src/contexts/NotificationsContext.jsx`**
3. **`src/components/views/SettingsView.jsx`**
4. **`src/pages/AcceptInvitePage.jsx`**
5. **`src/components/views/PlansView.jsx`**
6. **`src/components/views/AnalyticsView.jsx`**
7. **`src/components/views/TeamView.jsx`**
8. **`src/components/shared/UserMenu.jsx`**

### Solução: Usar `API_BASE_URL` do Config

Em vez de:
```javascript
fetch('http://localhost:5001/api/templates')
```

Use:
```javascript
import { API_BASE_URL } from '@/config/api';
fetch(`${API_BASE_URL}/api/templates`)
```

## 🔧 Exemplo de Correção

### Antes:
```javascript
const res = await fetch('http://localhost:5001/api/templates', {
  // ...
});
```

### Depois:
```javascript
import { API_BASE_URL } from '@/config/api';

const res = await fetch(`${API_BASE_URL}/api/templates`, {
  // ...
});
```

## ✅ Verificação

Após configurar:

1. **Faça o build do frontend:**
   ```bash
   npm run build
   ```

2. **Verifique o console do navegador:**
   - Deve mostrar: `🚀 Ambiente de produção detectado, usando: https://apront-production.up.railway.app`
   - Deve mostrar: `✅ Backend respondeu: 200 OK`

3. **Teste a aplicação:**
   - Tente fazer login
   - Tente acessar rundowns
   - Verifique se todas as requisições funcionam

## 🚀 Próximos Passos

1. **Configure a variável de ambiente** `VITE_API_BASE_URL`
2. **Atualize os arquivos** que ainda usam `localhost:5001` diretamente
3. **Faça o build e deploy** do frontend
4. **Teste todas as funcionalidades**

## 📝 Nota Importante

O arquivo `src/config/api.js` já está preparado para:
- ✅ Detectar produção automaticamente
- ✅ Usar `VITE_API_BASE_URL` se configurado
- ✅ Fallback para localhost em desenvolvimento
- ✅ Configurar WebSocket automaticamente (ws/wss)

Você só precisa:
1. Configurar a variável de ambiente no build
2. Atualizar os arquivos que ainda usam `localhost:5001` diretamente

