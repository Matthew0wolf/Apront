# Guia de Deploy no Render.com (Gratuito)

## 📋 Pré-requisitos

1. Conta no GitHub (gratuita)
2. Conta no Render.com (gratuita)
3. Repositório do projeto no GitHub

## 🚀 Passo a Passo

### 1. Preparar o Repositório no GitHub

```bash
# Se ainda não tiver o projeto no GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

### 2. Deploy do Backend no Render

1. Acesse [render.com](https://render.com) e faça login com GitHub
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `apront-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && python app.py`
   - **Root Directory**: `/backend` (ou deixe vazio se a raiz for o backend)

5. **Variáveis de Ambiente** (Environment Variables):
   ```
   PORT=5001
   FLASK_ENV=production
   SECRET_KEY=seu_secret_key_super_seguro_aqui
   JWT_SECRET_KEY=seu_jwt_secret_key_super_seguro_aqui
   DATABASE_URL=postgresql://... (será gerado no próximo passo)
   REDIS_URL=redis://... (opcional, se usar Redis)
   ```

### 3. Criar Banco PostgreSQL no Render

1. **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `apront-db`
   - **Database**: `apront_db`
   - **User**: `apront_user`
   - **Region**: Escolha o mais próximo
3. Copie a **Internal Database URL** (para usar dentro do Render)
4. Copie a **External Database URL** (para acessar de fora, se necessário)
5. Cole a **Internal Database URL** na variável `DATABASE_URL` do backend

### 4. Deploy do Frontend no Render

1. **"New +"** → **"Static Site"**
2. Configure:
   - **Name**: `apront-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. **Variáveis de Ambiente**:
   ```
   VITE_API_BASE_URL=https://apront-backend.onrender.com
   ```

### 5. Atualizar Configuração do Frontend

Você precisará atualizar `src/config/api.js` para usar a URL do backend em produção:

```javascript
const getApiUrl = () => {
  // Em produção, usa a URL do Render
  if (window.location.hostname.includes('render.com') || 
      window.location.hostname.includes('onrender.com')) {
    return 'https://apront-backend.onrender.com';
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

### 6. Configurar CORS no Backend

Certifique-se de que `cors_config.py` permite o domínio do frontend:

```python
# Adicione o domínio do Render
allowed_origins = [
    "https://apront-frontend.onrender.com",
    "http://localhost:3000",  # Para desenvolvimento local
]
```

## ⚠️ Limitações do Plano Gratuito

- **Backend**: Suspende após 15 minutos de inatividade (primeira requisição pode demorar ~30s)
- **Banco de Dados**: 90 dias gratuitos, depois precisa pagar ou migrar
- **Frontend**: Sem limitações significativas
- **Tráfego**: Limitado, mas suficiente para testes

## 🔄 Alternativa: Railway.app

Railway é similar ao Render, mas:
- ✅ Não suspende o backend (sempre ativo)
- ✅ Banco PostgreSQL gratuito por mais tempo
- ✅ Mais rápido que Render
- ⚠️ Limite de créditos mensais (mas suficiente para testes)

### Deploy no Railway:

1. Acesse [railway.app](https://railway.app)
2. Conecte com GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Adicione serviços:
   - **PostgreSQL** (banco de dados)
   - **Web Service** (backend Python)
   - **Static Site** (frontend)

## 📝 Notas Importantes

1. **WebSocket**: Render e Railway suportam WebSocket, mas pode precisar de configuração adicional
2. **Uploads**: Arquivos salvos localmente serão perdidos. Use serviços como AWS S3 ou Cloudinary
3. **Redis**: Pode usar Redis gratuito do [Upstash](https://upstash.com) se necessário
4. **HTTPS**: Render e Railway fornecem HTTPS automaticamente

## 🆚 Comparação: Render vs VPS

| Aspecto | Render/Railway | VPS |
|---------|----------------|-----|
| **Configuração** | Automática | Manual |
| **Manutenção** | Baixa | Alta |
| **Custo** | Gratuito (limitado) | ~$5-10/mês |
| **Controle** | Limitado | Total |
| **Escalabilidade** | Fácil | Manual |
| **Ideal para** | Testes, MVP | Produção avançada |

## ✅ Próximos Passos

1. Teste localmente com Docker: `docker-compose up`
2. Faça deploy no Render/Railway seguindo este guia
3. Compartilhe a URL do frontend para testes
4. Monitore logs no painel do Render/Railway

