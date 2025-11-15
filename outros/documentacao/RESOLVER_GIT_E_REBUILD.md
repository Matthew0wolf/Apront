# 🔧 Resolver Git e Rebuild do Frontend

## 🔍 Situação

Você fez commit na VPS e agora há branches divergentes. Precisamos resolver isso e fazer rebuild do frontend.

## ✅ Solução

### **1. Resolver conflito do Git:**

```bash
cd /var/www/apront

# Configurar merge como estratégia padrão
git config pull.rebase false

# Fazer pull forçando merge
git pull --no-rebase

# Se der conflito, aceitar a versão remota (mais recente)
git checkout --theirs .
git add .
git commit -m "Merge: aceitar versão remota"
```

**OU, se preferir forçar a versão remota:**

```bash
cd /var/www/apront

# Descartar mudanças locais e usar versão remota
git fetch origin
git reset --hard origin/main
```

### **2. Rebuild do Frontend:**

```bash
cd /var/www/apront

# Instalar dependências (se necessário)
npm install

# Build de produção
npm run build

# Verificar se build foi criado
ls -la dist/
```

### **3. Verificar Permissões:**

```bash
sudo chown -R www-data:www-data /var/www/apront/dist
sudo chmod -R 755 /var/www/apront/dist
```

### **4. Recarregar Nginx:**

```bash
sudo systemctl reload nginx
```

### **5. Testar:**

Acesse: `http://72.60.56.28`

O WebSocket deve conectar via `ws://72.60.56.28/socket.io` (através do Nginx).

## 🎯 Comandos Rápidos (Copie e Cole Tudo):

```bash
cd /var/www/apront
git fetch origin
git reset --hard origin/main
npm install
npm run build
sudo chown -R www-data:www-data /var/www/apront/dist
sudo chmod -R 755 /var/www/apront/dist
sudo systemctl reload nginx
```

## 🔍 Verificar se Funcionou

No console do navegador, você deve ver:
- ✅ `API_BASE_URL: http://72.60.56.28` (sem porta)
- ✅ `WS_URL: ws://72.60.56.28/socket.io` (através do Nginx)
- ✅ WebSocket conectando com sucesso

**NÃO deve mostrar:**
- ❌ `ws://72.60.56.28:5001` (porta direta)

