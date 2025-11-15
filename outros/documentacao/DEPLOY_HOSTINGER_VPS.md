# 🚀 Deploy na Hostinger VPS

## 📋 Requisitos do Sistema Apront

- **Backend:** Flask (Python 3.11) + PostgreSQL + Redis
- **Frontend:** React + Vite (build estático)
- **WebSocket:** Flask-SocketIO
- **Servidor Web:** Nginx (para servir frontend e proxy reverso)

## 🎯 Opções Recomendadas na Hostinger

### **Opção 1: Docker + Portainer (RECOMENDADO) ⭐**

A melhor opção porque:
- ✅ Já tem `docker-compose.yml` configurado
- ✅ Fácil gerenciamento via Portainer
- ✅ Isolamento de serviços
- ✅ Fácil backup e restore

**Aplicativos a instalar:**
1. **Docker** - Para rodar containers
2. **Portainer** - Interface web para gerenciar Docker
3. **Nginx** (manual ou via LEMP) - Para servir frontend e proxy

### **Opção 2: LEMP Stack + Python Manual**

Se preferir instalação manual:
- **LEMP Stack** - Nginx + MySQL (mas vamos usar PostgreSQL)
- Instalar Python 3.11 manualmente
- Configurar Nginx manualmente

## 🔧 Passo a Passo: Opção 1 (Docker + Portainer)

### **1. Instalar Docker na Hostinger**

Acesse sua VPS via SSH e execute:

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version
```

### **2. Instalar Portainer (Opcional mas Recomendado)**

```bash
# Criar volume para Portainer
docker volume create portainer_data

# Rodar Portainer
docker run -d -p 9000:9000 --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acesse: `http://seu-ip:9000` e configure o Portainer.

### **3. Instalar Nginx**

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### **4. Preparar Projeto na VPS**

```bash
# Criar diretório do projeto
sudo mkdir -p /var/www/apront
sudo chown $USER:$USER /var/www/apront

# Clonar ou fazer upload do projeto
cd /var/www/apront
# Se usar Git:
git clone seu-repositorio .
# Ou faça upload via SFTP/FTP
```

### **5. Configurar Backend (Docker Compose)**

Edite o `docker-compose.yml` para produção:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: apront-postgres
    environment:
      POSTGRES_USER: apront_user
      POSTGRES_PASSWORD: SUA_SENHA_FORTE_AQUI
      POSTGRES_DB: apront_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - apront-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: apront-redis
    volumes:
      - redis_data:/data
    networks:
      - apront-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: apront-backend
    environment:
      - DATABASE_URL=postgresql://apront_user:SUA_SENHA_FORTE_AQUI@postgres:5432/apront_db
      - REDIS_URL=redis://redis:6379/0
      - FLASK_ENV=production
      - SECRET_KEY=SUA_SECRET_KEY_FORTE_AQUI
      - JWT_SECRET_KEY=SUA_JWT_SECRET_KEY_FORTE_AQUI
      - SMTP_SERVER=smtp.sendgrid.net
      - SMTP_PORT=587
      - SMTP_USERNAME=apikey
      - SMTP_PASSWORD=SUA_API_KEY_SENDGRID
      - FROM_EMAIL=noreply@seu_dominio.com
    ports:
      - "127.0.0.1:5001:5001"  # Apenas localhost (Nginx faz proxy)
    volumes:
      - ./backend:/app
      - backend_uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    networks:
      - apront-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  backend_uploads:

networks:
  apront-network:
    driver: bridge
```

### **6. Build do Frontend**

```bash
cd /var/www/apront

# Instalar Node.js (se não tiver)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar dependências e build
npm install
npm run build

# O build estará em: dist/
```

### **7. Configurar Nginx**

Crie `/etc/nginx/sites-available/apront`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Frontend React (arquivos estáticos)
    location / {
        root /var/www/apront/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets
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
        
        # Timeout para WebSocket
        proxy_read_timeout 86400;
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
        proxy_read_timeout 86400;
    }
}
```

Ative o site:

```bash
sudo ln -s /etc/nginx/sites-available/apront /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl reload nginx
```

### **8. Iniciar Serviços**

```bash
cd /var/www/apront

# Iniciar containers Docker
docker compose up -d

# Verificar logs
docker compose logs -f
```

### **9. Configurar SSL (HTTPS) - Opcional mas Recomendado**

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
sudo certbot renew --dry-run
```

## 🔧 Passo a Passo: Opção 2 (LEMP + Python Manual)

Se preferir não usar Docker:

### **1. Instalar LEMP Stack**

Na Hostinger, escolha **"LEMP Stack"** no painel.

### **2. Instalar PostgreSQL**

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco de dados
sudo -u postgres psql
CREATE USER apront_user WITH PASSWORD 'sua_senha_forte';
CREATE DATABASE apront_db OWNER apront_user;
\q
```

### **3. Instalar Python 3.11**

```bash
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev -y
```

### **4. Configurar Backend**

```bash
cd /var/www/apront/backend

# Criar ambiente virtual
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Criar arquivo .env
nano .env
```

Conteúdo do `.env`:
```
DATABASE_URL=postgresql://apront_user:sua_senha@localhost:5432/apront_db
REDIS_URL=redis://localhost:6379/0
FLASK_ENV=production
SECRET_KEY=sua_secret_key_forte
JWT_SECRET_KEY=sua_jwt_secret_key_forte
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=sua_api_key_sendgrid
FROM_EMAIL=noreply@seu_dominio.com
```

### **5. Criar Serviço Systemd**

Crie `/etc/systemd/system/apront-backend.service`:

```ini
[Unit]
Description=Apront Backend Flask
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/var/www/apront/backend
Environment="PATH=/var/www/apront/backend/venv/bin"
ExecStart=/var/www/apront/backend/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Ative o serviço:

```bash
sudo systemctl daemon-reload
sudo systemctl enable apront-backend
sudo systemctl start apront-backend
sudo systemctl status apront-backend
```

### **6. Configurar Nginx (mesmo da Opção 1)**

Use a mesma configuração Nginx da Opção 1.

## 📋 Checklist Final

- [ ] Docker instalado (Opção 1) ou LEMP + Python (Opção 2)
- [ ] PostgreSQL rodando
- [ ] Redis rodando
- [ ] Backend rodando (Docker ou Systemd)
- [ ] Frontend buildado em `dist/`
- [ ] Nginx configurado e rodando
- [ ] SSL configurado (opcional)
- [ ] Variáveis de ambiente configuradas
- [ ] SMTP configurado (SendGrid recomendado)
- [ ] Firewall configurado (portas 80, 443 abertas)

## 🔒 Segurança

1. **Firewall:**
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

2. **Senhas Fortes:**
- Use senhas fortes para PostgreSQL
- Gere SECRET_KEY e JWT_SECRET_KEY aleatórios
- Configure SMTP com SendGrid

3. **Backup:**
```bash
# Backup do banco de dados
docker exec apront-postgres pg_dump -U apront_user apront_db > backup.sql
```

## 🎯 Recomendação Final

**Use a Opção 1 (Docker + Portainer)** porque:
- ✅ Mais fácil de gerenciar
- ✅ Isolamento de serviços
- ✅ Fácil backup/restore
- ✅ Já tem docker-compose.yml pronto
- ✅ Portainer facilita muito o gerenciamento

## 📞 Próximos Passos

1. Escolha a opção (Docker ou Manual)
2. Siga os passos acima
3. Teste o sistema
4. Configure domínio e SSL
5. Configure monitoramento (opcional)

