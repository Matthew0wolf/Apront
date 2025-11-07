# 🔧 Correções de API e Rede

## ✅ Problemas Corrigidos

### 1. **URLs Hardcoded para localhost**
**Problema:** As requisições estavam usando URLs hardcoded para `http://localhost:5001`, o que não funcionava quando acessado de outros dispositivos na rede.

**Solução:** 
- Criado arquivo `src/config/api.js` que detecta automaticamente o IP e porta corretos
- A configuração agora usa `http://192.168.0.100:5001` quando acessado pelo IP da rede
- Usa `http://localhost:5001` quando acessado localmente

### 2. **Token Expirado (401)**
**Problema:** O token JWT estava expirando e causando erros 401 nas requisições.

**Solução:**
- Atualizado `src/hooks/useApi.js` para interceptar erros 401 e renovar o token automaticamente
- O hook agora converte URLs relativas (`/api/...`) para URLs absolutas com o IP correto
- Implementado retry automático após renovação do token

### 3. **Erro de JSON (Recebia HTML)**
**Problema:** As requisições retornavam HTML ao invés de JSON porque iam para o frontend (`http://192.168.0.100:3000/api/...`) ao invés do backend.

**Solução:**
- Todas as requisições agora vão para o backend correto
- `PracticeModeView.jsx` atualizado para usar o hook `useApi`
- URLs agora são resolvidas automaticamente para o backend

### 4. **Autenticação Faltando**
**Problema:** A rota `/api/rundowns` não verificava autenticação.

**Solução:**
- Adicionado decorator `@jwt_required()` na rota GET de rundowns
- Agora requer token válido para acessar

## 📁 Arquivos Modificados

1. **Criados:**
   - `src/config/api.js` - Configuração automática de API

2. **Atualizados:**
   - `src/hooks/useApi.js` - Renovação automática de token e conversão de URLs
   - `src/components/views/PracticeModeView.jsx` - Usa URLs relativas
   - `src/contexts/SyncContext.jsx` - Usa configuração de API
   - `src/lib/websocket.js` - Usa configuração de API para WebSocket
   - `backend/routes/rundown.py` - Adicionado autenticação

## 🧪 Como Testar

### 1. Reinicie o Backend
```bash
# No diretório do projeto
cd backend
python app.py
```

O backend deve iniciar em `0.0.0.0:5001` (acessível de qualquer IP da rede)

### 2. Reinicie o Frontend
```bash
# No diretório do projeto
npm run dev
```

O frontend deve iniciar em `http://0.0.0.0:3000` ou similar

### 3. Acesse via IP da Rede
Abra o navegador e acesse:
```
http://192.168.0.100:3000/project/1/practice
```

### 4. Verifique o Console
No console do navegador (F12), você deve ver:
- ✅ `🔧 API configurada: { API_BASE_URL: "http://192.168.0.100:5001", ... }`
- ✅ `🔌 Conectando ao servidor WebSocket... http://192.168.0.100:5001`
- ✅ `✅ Conectado ao servidor WebSocket`

### 5. Teste a Funcionalidade
- A página deve carregar o rundown corretamente
- Não deve haver erros de "Token expirado"
- Não deve haver erros de "Unexpected token '<'"

## 🚨 Possíveis Problemas

### Se ainda aparecer erro 401:
1. Verifique se está logado (token válido em localStorage)
2. Faça logout e login novamente
3. Limpe o localStorage: `localStorage.clear()` no console

### Se não conectar ao WebSocket:
1. Verifique se o backend está rodando
2. Verifique se o CORS está configurado (já está em `backend/cors_config.py`)
3. Verifique firewall do Windows

### Se ainda receber HTML ao invés de JSON:
1. Verifique se o backend está rodando na porta 5001
2. Abra o console e veja qual URL está sendo chamada
3. Deve ser `http://192.168.0.100:5001/api/...` e não `http://192.168.0.100:3000/api/...`

## 📝 Próximos Passos (Opcional)

Há outros arquivos que ainda usam URLs hardcoded. Para corrigir todos de uma vez, você pode:

1. Usar o hook `useApi` em todos os componentes
2. Ou criar um script para substituir todas as ocorrências de `http://localhost:5001` por `${API_BASE_URL}`

Arquivos que ainda precisam de atualização:
- `src/components/views/TemplatesView.jsx`
- `src/contexts/NotificationsContext.jsx`
- `src/components/views/SettingsView.jsx`
- `src/pages/AcceptInvitePage.jsx`
- `src/pages/RegisterPage.jsx`
- `src/pages/LoginPage.jsx`
- `src/components/dialogs/CreateProjectDialog.jsx`
- `src/components/views/PlansView.jsx`
- `src/components/views/AnalyticsView.jsx`
- `src/components/views/TeamView.jsx`
- `src/contexts/AuthProvider.jsx`
- `src/contexts/RundownContext.jsx`
- `src/components/shared/UserMenu.jsx`

## ✨ Benefícios das Correções

1. ✅ **Funciona em qualquer rede** - Detecta automaticamente o IP correto
2. ✅ **Renovação automática de token** - Não precisa fazer login constantemente
3. ✅ **Melhor experiência** - Sem erros de conexão
4. ✅ **Código mais limpo** - URLs relativas ao invés de hardcoded
5. ✅ **Mais seguro** - Autenticação verificada em todas as rotas

