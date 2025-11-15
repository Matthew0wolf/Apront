# 🚀 Como Fazer Deploy do Frontend no Railway

## 📋 Passo a Passo Completo

### 1️⃣ Criar Novo Serviço no Railway

1. **No Dashboard do Railway:**
   - Abra seu projeto "Apront"
   - Clique no botão **"+ New"** ou **"New Service"**
   - Selecione **"GitHub Repo"** (se seu código está no GitHub)
     - OU **"Empty Service"** se quiser fazer upload manual

2. **Se escolher GitHub Repo:**
   - Selecione o repositório
   - O Railway vai detectar automaticamente que é um projeto Node.js/React

### 2️⃣ Configurar o Serviço

O Railway detecta automaticamente projetos React/Vite pelo `package.json`, mas você precisa configurar:

#### A. Configurar o Root Directory (Se Necessário)

Se o frontend está na raiz do projeto:
- **Root Directory:** Deixe vazio ou `/`

Se o frontend está em uma subpasta:
- **Root Directory:** `/` (o frontend está na raiz junto com o backend)

#### B. Configurar Build Command

1. Vá em **Settings** → **Build**
2. **Build Command:** (deixe vazio ou configure)
   ```
   npm install && npm run build
   ```
   O Railway geralmente detecta automaticamente!

#### C. Configurar Start Command

1. Vá em **Settings** → **Deploy**
2. **Start Command:** 
   ```
   npm run preview
   ```
   OU use um servidor estático:
   ```
   npx serve -s dist -l $PORT
   ```

### 3️⃣ Instalar Servidor Estático (Recomendado)

Para servir os arquivos buildados, você precisa de um servidor. Adicione ao `package.json`:

```json
"scripts": {
  "dev": "vite --host :: --port 3000",
  "build": "vite build",
  "preview": "vite preview --host :: --port 3000",
  "start": "npx serve -s dist -l $PORT"
}
```

E adicione `serve` como dependência (ou devDependency):

```bash
npm install --save-dev serve
```

### 4️⃣ Configurar Variáveis de Ambiente

**IMPORTANTE:** Configure a URL do backend!

1. No serviço do frontend, vá em **Settings** → **Variables**
2. Adicione:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://apront-production.up.railway.app`
   - **Apply to:** `Production` (ou `All Environments`)

### 5️⃣ Configurar Porta

O Railway define automaticamente a variável `PORT`. Certifique-se de que o servidor usa essa porta:

**Opção 1: Usar `serve` (Recomendado)**
```json
"start": "npx serve -s dist -l $PORT"
```

**Opção 2: Usar `vite preview`**
```json
"start": "vite preview --host 0.0.0.0 --port $PORT"
```

### 6️⃣ Criar Arquivo de Configuração (Opcional mas Recomendado)

Crie um arquivo `railway.json` na raiz do projeto:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve -s dist -l $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🔧 Configuração Completa do package.json

Atualize seu `package.json` para incluir o script de start:

```json
{
  "scripts": {
    "dev": "vite --host :: --port 3000",
    "build": "vite build",
    "preview": "vite preview --host :: --port 3000",
    "start": "npx serve -s dist -l $PORT"
  },
  "devDependencies": {
    "serve": "^14.2.1"
  }
}
```

## 📝 Checklist de Configuração

- [ ] Serviço criado no Railway
- [ ] Root Directory configurado (se necessário)
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npx serve -s dist -l $PORT`
- [ ] Variável `VITE_API_BASE_URL` configurada
- [ ] `serve` instalado como dependência
- [ ] Script `start` adicionado ao `package.json`

## 🚀 Deploy

1. **Faça commit e push** das alterações (se usar GitHub)
2. O Railway vai **detectar automaticamente** e iniciar o build
3. Aguarde o build completar
4. Verifique os logs para confirmar que está rodando

## ✅ Verificação

Após o deploy:

1. **Acesse a URL pública** do frontend (aparece em Settings → Networking)
2. **Abra o Console do Navegador** (F12)
3. **Verifique se aparece:**
   ```
   🚀 Ambiente de produção detectado, usando: https://apront-production.up.railway.app
   ✅ Backend respondeu: 200 OK
   ```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'serve'"
**Solução:** Adicione `serve` ao `package.json`:
```bash
npm install --save-dev serve
```

### Erro: "Port already in use"
**Solução:** Use `$PORT` no comando:
```json
"start": "npx serve -s dist -l $PORT"
```

### Frontend não conecta ao backend
**Solução:** Verifique se `VITE_API_BASE_URL` está configurada corretamente

### Build falha
**Solução:** Verifique os logs do Railway para ver o erro específico

## 📚 Próximos Passos

1. ✅ Backend funcionando: `https://apront-production.up.railway.app`
2. ⏳ Frontend: Siga este guia
3. ⏳ Testar integração completa
4. ⏳ Configurar domínio customizado (opcional)

---

**Dica:** O Railway detecta automaticamente projetos Node.js/React pelo `package.json`. Você só precisa configurar as variáveis de ambiente e o comando de start!

