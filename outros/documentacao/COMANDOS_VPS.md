# 🚀 Comandos para Executar na VPS

## ✅ O que você já fez:
- ✅ Docker instalado e funcionando
- ✅ Docker Compose instalado
- ✅ Portainer instalado e rodando
- ✅ Nginx instalado
- ✅ Diretório `/var/www/apront` criado

## 🔧 Próximos Comandos:

### **1. Clonar Repositório (use HTTPS):**

```bash
cd /var/www/apront
git clone https://github.com/Matthew0wolf/Apront.git .
```

**OU se o repositório for privado, use:**

```bash
# Primeiro, instale suas credenciais Git ou use token
git clone https://SEU_TOKEN@github.com/Matthew0wolf/Apront.git .
```

### **2. Verificar se clonou corretamente:**

```bash
ls -la
# Deve mostrar: backend/, src/, package.json, docker-compose.yml, etc.
```

### **3. Instalar Node.js:**

```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version
npm --version
```

### **4. Build do Frontend:**

```bash
cd /var/www/apront

# Instalar dependências
npm install

# Build de produção
npm run build

# Verificar se build foi criado
ls -la dist/
```

### **5. Gerar Chaves Aleatórias:**

```bash
# Gerar SECRET_KEY
openssl rand -hex 32

# Gerar JWT_SECRET_KEY
openssl rand -hex 32
```

**Copie essas chaves! Você vai precisar delas no próximo passo.**

### **6. Configurar docker-compose.yml:**

```bash
nano docker-compose.yml
```

**Substitua:**
- `SUA_SENHA_FORTE_AQUI_ALTERE` → Senha forte para PostgreSQL
- `GERE_UMA_CHAVE_ALEATORIA_FORTE_AQUI` → Primeira chave gerada acima
- `OUTRA_CHAVE_ALEATORIA_FORTE_AQUI` → Segunda chave gerada acima
- `SUA_API_KEY_SENDGRID_AQUI` → API Key do SendGrid (se tiver)
- `noreply@seu-dominio.com` → Email verificado no SendGrid

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **7. Iniciar Containers:**

```bash
cd /var/www/apront
docker compose up -d

# Verificar se estão rodando
docker compose ps

# Ver logs
docker compose logs -f
```

### **8. Configurar Nginx:**

```bash
sudo nano /etc/nginx/sites-available/apront
```

**Cole esta configuração:**

```nginx
server {
    listen 80;
    server_name 72.60.56.28;  # Seu IP ou domínio
    
    # Frontend React
    location / {
        root /var/www/apront/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
    }
}
```

**Ativar:**

```bash
sudo ln -s /etc/nginx/sites-available/apront /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### **9. Configurar Firewall:**

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 9000/tcp  # Portainer
sudo ufw enable
```

### **10. Testar:**

Acesse: `http://72.60.56.28`

## 🔍 Verificar Logs:

```bash
# Logs do backend
docker compose logs -f backend

# Logs do PostgreSQL
docker compose logs -f postgres

# Status dos containers
docker compose ps
```

## ⚠️ Se o Repositório for Privado:

Se o `git clone` falhar por ser privado, você tem 3 opções:

### **Opção 1: Usar Token do GitHub**

1. Vá em GitHub → Settings → Developer settings → Personal access tokens
2. Gere um token com permissão `repo`
3. Use:
```bash
git clone https://SEU_TOKEN@github.com/Matthew0wolf/Apront.git .
```

### **Opção 2: Fazer Upload via SFTP**

Use FileZilla, WinSCP ou VS Code para fazer upload da pasta completa.

### **Opção 3: Configurar SSH Key**

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "seu-email@example.com"

# Mostrar chave pública
cat ~/.ssh/id_ed25519.pub

# Adicionar no GitHub → Settings → SSH keys
```

