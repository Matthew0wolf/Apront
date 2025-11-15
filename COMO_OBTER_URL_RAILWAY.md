# Como Obter a URL Pública do Railway

## 📍 Método 1: Pela Interface do Railway (Mais Fácil)

### Passo a Passo:

1. **Acesse o Railway Dashboard**
   - Vá para [railway.app](https://railway.app)
   - Faça login na sua conta

2. **Selecione seu Projeto**
   - Clique no projeto "Apront" (ou o nome do seu projeto)

3. **Selecione o Serviço Backend**
   - Clique no serviço "Apront" (seu backend)

4. **Vá para Settings (Configurações)**
   - Clique na aba **"Settings"** no topo
   - Ou procure por **"Networking"** ou **"Domains"**

5. **Encontre a URL Pública**
   - Procure por uma seção chamada:
     - **"Networking"**
     - **"Domains"**
     - **"Public Domain"**
   - Você verá algo como:
     ```
     https://apront-production.up.railway.app
     ```
     ou
     ```
     https://apront-xxxxx.up.railway.app
     ```

## 📍 Método 2: Pela Aba Deployments

1. **Acesse Deployments**
   - No serviço backend, clique na aba **"Deployments"**

2. **Abra o Deployment Mais Recente**
   - Clique no deployment mais recente (geralmente o primeiro da lista)

3. **Verifique os Logs ou Detalhes**
   - A URL pode aparecer nos logs ou nos detalhes do deployment

## 📍 Método 3: Gerar Domínio Público (Se Não Tiver)

Se você não vê uma URL pública:

1. **Vá para Settings**
   - No serviço backend → **Settings**

2. **Procure por "Networking" ou "Domains"**
   - Role a página até encontrar essa seção

3. **Clique em "Generate Domain" ou "Add Domain"**
   - O Railway gerará automaticamente uma URL pública

## ✅ Como Testar se Está Funcionando

### 1. Teste Básico (Endpoint Raiz)
Acesse no navegador:
```
https://sua-url.railway.app/
```

**Resposta esperada:**
```json
{
  "message": "API Flask rodando! Use /api/rundowns para acessar os dados."
}
```

### 2. Teste de Endpoint da API
Acesse:
```
https://sua-url.railway.app/api/rundowns
```

**Resposta esperada:**
- Se não autenticado: erro de autenticação (normal)
- Se autenticado: lista de rundowns

### 3. Teste com cURL (Terminal)
```bash
curl https://sua-url.railway.app/
```

**Resposta esperada:**
```json
{"message":"API Flask rodando! Use /api/rundowns para acessar os dados."}
```

### 4. Teste de Health Check (Se Tiver)
```
https://sua-url.railway.app/health
```

## 🔧 Configurar Domínio Customizado (Opcional)

Se quiser usar seu próprio domínio:

1. **Vá para Settings → Networking**
2. **Clique em "Custom Domain"**
3. **Adicione seu domínio**
   - Exemplo: `api.seudominio.com`
4. **Configure o DNS**
   - Siga as instruções do Railway para configurar os registros DNS

## 📝 Exemplo de URLs Comuns

- **Produção:** `https://apront-production.up.railway.app`
- **Staging:** `https://apront-staging.up.railway.app`
- **Customizado:** `https://api.seudominio.com`

## ⚠️ Importante

- A URL pública é **HTTPS** por padrão (seguro)
- A porta **8080** é interna - não precisa usar na URL pública
- O Railway gerencia o roteamento automaticamente

## 🐛 Se Não Conseguir Encontrar

1. **Verifique se o serviço está rodando**
   - Vá para a aba **"Deployments"**
   - Verifique se há um deployment ativo e bem-sucedido

2. **Verifique os logs**
   - Na aba **"Logs"**, procure por mensagens de erro

3. **Verifique as configurações de rede**
   - Em **Settings → Networking**, verifique se há alguma restrição

## 📞 Próximos Passos

Depois de obter a URL:

1. **Teste a API** no navegador ou com ferramentas como Postman
2. **Configure o frontend** para usar essa URL
3. **Teste os endpoints** principais da sua aplicação

---

**Dica:** Salve a URL em um lugar seguro, pois você precisará dela para configurar o frontend!

