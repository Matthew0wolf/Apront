# 🎯 Configurar na Interface da Hostinger VPS

## 📋 Informações da Sua VPS

- **IP:** 72.60.56.28
- **Hostname:** srv1130753.hstgr.cloud
- **Opções:** Compose manualmente OU Compose a partir de URL

## ✅ RECOMENDAÇÃO: Escolha "Compose manualmente"

### Por quê?
- Você já tem um `docker-compose.yml` configurado
- Pode ajustar as configurações antes de iniciar
- Mais controle sobre o processo

## 🚀 Passo a Passo na Interface Hostinger

### **OPÇÃO 1: Compose Manualmente (RECOMENDADO)**

1. **Clique em "Compose manualmente"**

2. **Na interface, você verá um editor de texto**

3. **Cole o conteúdo do seu `docker-compose.yml`** (ajustado para produção):

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
      - "127.0.0.1:5001:5001"
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

4. **IMPORTANTE:** Antes de salvar, altere:
   - `SUA_SENHA_FORTE_AQUI_ALTERE` → Senha forte para PostgreSQL
   - `GERE_UMA_CHAVE_ALEATORIA_FORTE_AQUI` → Chave aleatória (veja como gerar abaixo)
   - `OUTRA_CHAVE_ALEATORIA_FORTE_AQUI` → Outra chave aleatória
   - `SUA_API_KEY_SENDGRID_AQUI` → API Key do SendGrid (se já tiver)
   - `noreply@seu-dominio.com` → Email verificado no SendGrid

5. **Salve e inicie**

### **OPÇÃO 2: Compose a partir de URL**

Se você colocar o `docker-compose.yml` em um repositório Git público:

1. **Clique em "Compose a partir de URL"**
2. **Cole a URL do arquivo raw** (exemplo GitHub):
   ```
   https://raw.githubusercontent.com/seu-usuario/seu-repo/main/docker-compose.yml
   ```
3. **Ajuste as variáveis de ambiente depois**

## ⚠️ IMPORTANTE: Antes de Iniciar

### **1. Fazer Upload do Projeto**

A interface da Hostinger pode não fazer upload automático. Você precisa:

**Via SSH:**
```bash
# Conectar na VPS
ssh root@72.60.56.28

# Criar diretório
mkdir -p /var/www/apront
cd /var/www/apront

# Fazer upload do projeto (via Git, SFTP, ou SCP)
```

**Via SFTP/FTP:**
- Use **FileZilla**, **WinSCP** ou **VS Code** com extensão SFTP
- Conecte em: `72.60.56.28`
- Faça upload de toda a pasta `Apront` para `/var/www/apront`

### **2. Gerar Chaves Aleatórias**

Conecte via SSH e execute:

```bash
# Gerar SECRET_KEY
openssl rand -hex 32

# Gerar JWT_SECRET_KEY  
openssl rand -hex 32
```

Use essas chaves no `docker-compose.yml`.

### **3. Build do Frontend**

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Build
cd /var/www/apront
npm install
npm run build
```

## 🔧 Após Configurar na Interface

### **1. Conectar via SSH e Verificar**

```bash
ssh root@72.60.56.28

# Ver containers
docker compose ps

# Ver logs
docker compose logs -f
```

### **2. Configurar Nginx**

A interface da Hostinger pode não configurar Nginx automaticamente. Você precisa fazer manualmente:

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração
sudo nano /etc/nginx/sites-available/apront
```

Cole esta configuração:

```nginx
server {
    listen 80;
    server_name 72.60.56.28;  # Ou seu domínio se tiver
    
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

Ative:

```bash
sudo ln -s /etc/nginx/sites-available/apront /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 📋 Checklist Rápido

- [ ] Escolher "Compose manualmente" na interface
- [ ] Colar `docker-compose.yml` (ajustado)
- [ ] Alterar senhas e chaves
- [ ] Fazer upload do projeto via SSH/SFTP
- [ ] Build do frontend (`npm run build`)
- [ ] Configurar Nginx
- [ ] Testar acesso: `http://72.60.56.28`

## 🎯 Próximos Passos

1. **Agora:** Configure na interface da Hostinger
2. **Depois:** Conecte via SSH e faça upload do projeto
3. **Depois:** Configure Nginx
4. **Depois:** Teste o sistema

## 💡 Dica

A interface da Hostinger é útil para iniciar, mas você provavelmente precisará:
- Conectar via SSH para fazer upload do projeto
- Configurar Nginx manualmente
- Ajustar configurações

Siga o guia completo em: `GUIA_COMPLETO_VPS.md` para todos os detalhes.

