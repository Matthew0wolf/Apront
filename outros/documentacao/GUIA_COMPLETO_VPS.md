# 🚀 Guia Completo: Configurar Sistema Apront na VPS Hostinger

## 📋 Pré-requisitos

- ✅ Docker já instalado pela Hostinger
- ✅ Acesso SSH à VPS
- ✅ Domínio configurado (opcional, mas recomendado)

## 🔧 PASSO 1: Conectar na VPS via SSH

### No Windows (PowerShell ou CMD):

```bash
ssh root@seu-ip-da-vps
# ou
ssh seu-usuario@seu-ip-da-vps
```

### Ou use um cliente SSH como:
- **PuTTY** (Windows)
- **Terminal** (Mac/Linux)
- **VS Code** com extensão Remote SSH

## 🔧 PASSO 2: Verificar Docker

```bash
# Verificar se Docker está instalado
docker --version
docker compose version

# Se não estiver, instalar Docker Compose (se necessário)
sudo apt update
sudo apt install docker-compose-plugin -y
```

## 🔧 PASSO 3: Preparar Estrutura de Diretórios

```bash
# Criar diretório do projeto
sudo mkdir -p /var/www/apront
sudo chown $USER:$USER /var/www/apront

# Entrar no diretório
cd /var/www/apront
```

## 🔧 PASSO 4: Fazer Upload do Projeto

### Opção A: Via Git (Recomendado)

```bash
# Se seu projeto está no GitHub/GitLab
git clone https://github.com/seu-usuario/seu-repositorio.git .

# Ou se já tem o repositório local, faça push e depois clone
```

### Opção B: Via SFTP/FTP

1. Use **FileZilla**, **WinSCP** ou **VS Code** com extensão SFTP
2. Conecte na VPS
3. Faça upload de toda a pasta `Apront` para `/var/www/apront`

### Opção C: Via SCP (linha de comando)

```bash
# No seu computador local (Windows PowerShell)
scp -r "C:\caminho\para\Apront" root@seu-ip:/var/www/apront
```

## 🔧 PASSO 5: Instalar Node.js (para build do frontend)

```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version
npm --version
```

## 🔧 PASSO 6: Build do Frontend

```bash
cd /var/www/apront

# Instalar dependências
npm install

# Fazer build de produção
npm run build

# Verificar se o build foi criado
ls -la dist/
```

O build estará em: `/var/www/apront/dist/`

## 🔧 PASSO 7: Configurar docker-compose.yml para Produção

Edite o arquivo `docker-compose.yml`:

```bash
nano docker-compose.yml
```

Substitua pelo conteúdo abaixo (ajuste as senhas e variáveis):

```yaml
version: '3.8'

services:
  # Banco de dados PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: apront-postgres
    environment:
      POSTGRES_USER: apront_user
      POSTGRES_PASSWORD: SUA_SENHA_FORTE_AQUI_ALTERE
      POSTGRES_DB: apront_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - apront-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U apront_user -d apront_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis para cache
  redis:
    image: redis:7-alpine
    container_name: apront-redis
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - apront-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Flask
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: apront-backend
    environment:
      # Banco de dados
      - DATABASE_URL=postgresql://apront_user:SUA_SENHA_FORTE_AQUI_ALTERE@postgres:5432/apront_db
      - REDIS_URL=redis://redis:6379/0
      
      # Flask
      - FLASK_ENV=production
      - SECRET_KEY=GERE_UMA_CHAVE_ALEATORIA_FORTE_AQUI
      - JWT_SECRET_KEY=OUTRA_CHAVE_ALEATORIA_FORTE_AQUI
      
      # SMTP (SendGrid recomendado)
      - SMTP_SERVER=smtp.sendgrid.net
      - SMTP_PORT=587
      - SMTP_USERNAME=apikey
      - SMTP_PASSWORD=SUA_API_KEY_SENDGRID_AQUI
      - FROM_EMAIL=noreply@seu-dominio.com
      
      # Porta
      - PORT=5001
    ports:
      - "127.0.0.1:5001:5001"  # Apenas localhost (Nginx faz proxy)
    volumes:
      - ./backend:/app
      - backend_uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - apront-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  backend_uploads:
    driver: local

networks:
  apront-network:
    driver: bridge
```

**IMPORTANTE:** Altere:
- `SUA_SENHA_FORTE_AQUI_ALTERE` - Senha forte para PostgreSQL
- `GERE_UMA_CHAVE_ALEATORIA_FORTE_AQUI` - Gere uma chave aleatória
- `OUTRA_CHAVE_ALEATORIA_FORTE_AQUI` - Outra chave aleatória
- `SUA_API_KEY_SENDGRID_AQUI` - API Key do SendGrid
- `noreply@seu-dominio.com` - Email verificado no SendGrid

**Para gerar chaves aleatórias:**
```bash
# Gerar SECRET_KEY
openssl rand -hex 32

# Gerar JWT_SECRET_KEY
openssl rand -hex 32
```

Salve o arquivo: `Ctrl+O`, `Enter`, `Ctrl+X`

## 🔧 PASSO 8: Instalar e Configurar Nginx

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração do site
sudo nano /etc/nginx/sites-available/apront
```

Cole o seguinte conteúdo (ajuste o domínio):

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Se não tiver domínio, use o IP da VPS
    # server_name _;

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

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

Ative o site:

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/apront /etc/nginx/sites-enabled/

# Remover site padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se tudo OK, recarregar Nginx
sudo systemctl reload nginx
```

## 🔧 PASSO 9: Iniciar Containers Docker

```bash
cd /var/www/apront

# Build e iniciar containers
docker compose up -d

# Verificar se estão rodando
docker compose ps

# Ver logs
docker compose logs -f
```

Aguarde alguns segundos para os containers iniciarem completamente.

## 🔧 PASSO 10: Configurar Firewall

```bash
# Instalar UFW (se não tiver)
sudo apt install ufw -y

# Permitir SSH (IMPORTANTE - faça antes de ativar!)
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Se quiser acessar Portainer (opcional)
sudo ufw allow 9000/tcp

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

## 🔧 PASSO 11: Instalar Portainer (Opcional mas Recomendado)

```bash
# Criar volume
docker volume create portainer_data

# Rodar Portainer
docker run -d -p 9000:9000 --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acesse: `http://seu-ip:9000` e configure a senha do Portainer.

## 🔧 PASSO 12: Configurar SSL/HTTPS (Opcional mas Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL (substitua pelo seu domínio)
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

O Certbot vai:
- Obter certificado SSL gratuito (Let's Encrypt)
- Configurar HTTPS automaticamente
- Renovar automaticamente

## 🔧 PASSO 13: Verificar se Tudo Está Funcionando

```bash
# Verificar containers
docker compose ps

# Verificar Nginx
sudo systemctl status nginx

# Verificar logs do backend
docker compose logs backend

# Verificar logs do PostgreSQL
docker compose logs postgres
```

## 🔧 PASSO 14: Configurar Variáveis de Ambiente do Frontend

Se você precisa configurar a URL da API no frontend, edite:

```bash
# Criar arquivo .env.production (se necessário)
nano /var/www/apront/.env.production
```

Adicione:
```
VITE_API_BASE_URL=https://seu-dominio.com
```

Depois faça rebuild:
```bash
npm run build
```

## 🔧 PASSO 15: Testar o Sistema

1. **Acesse o frontend:** `http://seu-ip` ou `https://seu-dominio.com`
2. **Teste cadastro:** Tente criar uma conta
3. **Verifique logs:** `docker compose logs -f backend`

## 📋 Comandos Úteis

```bash
# Ver containers rodando
docker compose ps

# Ver logs de um serviço
docker compose logs -f backend
docker compose logs -f postgres

# Reiniciar um serviço
docker compose restart backend

# Parar tudo
docker compose down

# Iniciar tudo
docker compose up -d

# Rebuild após mudanças
docker compose up -d --build

# Ver uso de recursos
docker stats

# Backup do banco de dados
docker exec apront-postgres pg_dump -U apront_user apront_db > backup.sql

# Restaurar backup
docker exec -i apront-postgres psql -U apront_user apront_db < backup.sql
```

## ⚠️ Troubleshooting

### Backend não inicia
```bash
# Ver logs detalhados
docker compose logs backend

# Verificar variáveis de ambiente
docker compose exec backend env
```

### Nginx retorna 502 Bad Gateway
```bash
# Verificar se backend está rodando
docker compose ps

# Verificar se porta 5001 está acessível
curl http://127.0.0.1:5001/
```

### Frontend não carrega
```bash
# Verificar se build existe
ls -la /var/www/apront/dist/

# Verificar permissões
sudo chown -R www-data:www-data /var/www/apront/dist
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Ver logs do PostgreSQL
docker compose logs postgres
```

## 🎯 Checklist Final

- [ ] Docker instalado e funcionando
- [ ] Projeto enviado para `/var/www/apront`
- [ ] Frontend buildado (`dist/` existe)
- [ ] `docker-compose.yml` configurado com senhas fortes
- [ ] Nginx configurado e rodando
- [ ] Containers Docker rodando (`docker compose ps`)
- [ ] Firewall configurado
- [ ] SSL configurado (opcional)
- [ ] Portainer instalado (opcional)
- [ ] Sistema testado e funcionando

## 🚀 Próximos Passos

1. **Configurar domínio** (se ainda não tiver)
2. **Configurar SendGrid** para emails
3. **Configurar backup automático** do banco de dados
4. **Configurar monitoramento** (opcional)

## 📞 Precisa de Ajuda?

Se encontrar algum erro, compartilhe:
- Logs do backend: `docker compose logs backend`
- Logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
- Status dos containers: `docker compose ps`

