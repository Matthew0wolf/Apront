# ✅ Próximos Passos na VPS

## ✅ O que você já fez:
- ✅ Docker instalado
- ✅ Portainer rodando
- ✅ Nginx instalado
- ✅ Repositório clonado em `/var/www/apront`

## 🚀 Execute estes comandos na ordem:

### **1. Instalar Node.js:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version
npm --version
```

### **2. Build do Frontend:**

```bash
cd /var/www/apront

# Instalar dependências (pode demorar alguns minutos)
npm install

# Build de produção
npm run build

# Verificar se build foi criado
ls -la dist/
```

**Deve mostrar:** `dist/` com arquivos `index.html`, `assets/`, etc.

### **3. Gerar Chaves Aleatórias (IMPORTANTE):**

```bash
# Gerar SECRET_KEY
openssl rand -hex 32

# Gerar JWT_SECRET_KEY
openssl rand -hex 32
```

**⚠️ COPIE ESSAS DUAS CHAVES!** Você vai precisar delas no próximo passo.

### **4. Configurar docker-compose.yml:**

```bash
nano docker-compose.yml
```

**Substitua estas partes:**

1. **Senha do PostgreSQL:**
   - Procure: `apront_password_2024`
   - Substitua por: Uma senha forte (ex: `MinhaSenh@Forte123!`)

2. **SECRET_KEY:**
   - Procure: `your_secret_key_here_change_in_production`
   - Substitua por: A primeira chave que você gerou acima

3. **JWT_SECRET_KEY:**
   - Procure: `your_jwt_secret_here_change_in_production`
   - Substitua por: A segunda chave que você gerou acima

4. **SMTP (se já tiver SendGrid configurado):**
   - `SMTP_PASSWORD` → Sua API Key do SendGrid
   - `FROM_EMAIL` → Email verificado no SendGrid

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **5. Ajustar Porta do Backend no docker-compose.yml:**

Verifique se a porta está configurada como `127.0.0.1:5001:5001` (apenas localhost):

```bash
grep -n "5001" docker-compose.yml
```

Se não estiver, edite e mude para:
```yaml
ports:
  - "127.0.0.1:5001:5001"  # Apenas localhost (Nginx faz proxy)
```

### **6. Iniciar Containers Docker:**

```bash
cd /var/www/apront

# Build e iniciar containers
docker compose up -d

# Verificar se estão rodando
docker compose ps

# Ver logs (Ctrl+C para sair)
docker compose logs -f
```

**Aguarde alguns segundos** para os containers iniciarem completamente.

### **7. Verificar se Backend está Funcionando:**

```bash
# Testar se backend responde
curl http://127.0.0.1:5001/

# Deve retornar: {"message":"API Flask rodando! Use /api/rundowns para acessar os dados."}
```

### **8. Configurar Nginx:**

```bash
sudo nano /etc/nginx/sites-available/apront
```

**Cole esta configuração completa:**

```nginx
server {
    listen 80;
    server_name 72.60.56.28;  # Seu IP ou domínio se tiver
    
    # Frontend React (arquivos estáticos)
    location / {
        root /var/www/apront/dist;
        try_files $uri $uri/ /index.html;
        
        # Headers de segurança
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (proxy reverso)
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout para requisições longas
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket (Socket.IO)
    location /socket.io {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout para WebSocket
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Ativar configuração:**

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/apront /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se tudo OK, recarregar Nginx
sudo systemctl reload nginx
```

### **9. Configurar Firewall:**

```bash
# Permitir SSH (IMPORTANTE - faça antes de ativar!)
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir Portainer (opcional)
sudo ufw allow 9000/tcp

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

### **10. Testar o Sistema:**

1. **Acesse no navegador:** `http://72.60.56.28`
2. **Deve carregar o frontend React**
3. **Teste fazer um cadastro**

### **11. Verificar Logs (se houver problemas):**

```bash
# Logs do backend
docker compose logs -f backend

# Logs do PostgreSQL
docker compose logs -f postgres

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Status dos containers
docker compose ps
```

## 🔍 Troubleshooting

### **Frontend não carrega:**
```bash
# Verificar se build existe
ls -la /var/www/apront/dist/

# Verificar permissões
sudo chown -R www-data:www-data /var/www/apront/dist
```

### **Backend retorna 502:**
```bash
# Verificar se backend está rodando
docker compose ps backend

# Verificar se porta 5001 está acessível
curl http://127.0.0.1:5001/
```

### **Erro de conexão com banco:**
```bash
# Verificar logs do PostgreSQL
docker compose logs postgres

# Verificar se PostgreSQL está rodando
docker compose ps postgres
```

## 📋 Checklist Final

- [ ] Node.js instalado
- [ ] Frontend buildado (`dist/` existe)
- [ ] Chaves aleatórias geradas
- [ ] `docker-compose.yml` configurado com senhas e chaves
- [ ] Containers rodando (`docker compose ps`)
- [ ] Backend respondendo (`curl http://127.0.0.1:5001/`)
- [ ] Nginx configurado e rodando
- [ ] Firewall configurado
- [ ] Sistema acessível em `http://72.60.56.28`

## 🎯 Próximos Passos (Opcional)

1. **Configurar domínio** (se tiver)
2. **Configurar SSL/HTTPS** com Certbot
3. **Configurar SendGrid** para emails
4. **Configurar backup automático** do banco

## 💡 Dica

Se algo der errado, compartilhe:
- `docker compose ps`
- `docker compose logs backend`
- `sudo tail -20 /var/log/nginx/error.log`

