# 🔄 Guia de Migração: Railway → VPS

## ✅ Boa Notícia: **NÃO PRECISA ALTERAR NADA NO CÓDIGO!**

Seu código está preparado para funcionar em **qualquer ambiente** (Railway, VPS, Docker, etc.) usando apenas **variáveis de ambiente**.

---

## 🎯 O que Funciona Automaticamente

### ✅ Backend
- **Banco de Dados**: Detecta automaticamente via `DATABASE_URL`
- **Porta**: Usa variável `PORT` (Railway e VPS)
- **CORS**: Configurável via `CORS_ORIGINS`
- **Segurança**: Todas as chaves via variáveis de ambiente
- **WebSocket**: Funciona em ambos

### ✅ Frontend
- **URL da API**: Configurável via `VITE_API_BASE_URL` no build
- **WebSocket**: Detecta automaticamente (ws:// ou wss://)

---

## 📋 Passo a Passo: Migração Railway → VPS

### 1. Preparar a VPS

```bash
# Conectar na VPS
ssh usuario@seu-ip-vps

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y python3 python3-pip python3-venv nginx postgresql redis-server git
```

### 2. Clonar o Repositório

```bash
cd /var/www
sudo git clone https://github.com/SEU_USUARIO/SEU_REPO.git apront
cd apront
```

### 3. Configurar Banco PostgreSQL

```bash
# Criar banco de dados
sudo -u postgres psql
```

No PostgreSQL:
```sql
CREATE DATABASE apront_db;
CREATE USER apront_user WITH PASSWORD 'sua_senha_forte_aqui';
GRANT ALL PRIVILEGES ON DATABASE apront_db TO apront_user;
\q
```

### 4. Configurar Variáveis de Ambiente

```bash
cd /var/www/apront/backend
nano .env
```

**Conteúdo do `.env`:**

```env
# Banco de Dados
DATABASE_URL=postgresql://apront_user:sua_senha_forte_aqui@localhost:5432/apront_db

# Segurança (USE AS MESMAS CHAVES DO RAILWAY!)
SECRET_KEY=sua_chave_secreta_do_railway
JWT_SECRET_KEY=sua_jwt_secret_key_do_railway

# Ambiente
FLASK_ENV=production
PORT=5001
FLASK_DEBUG=False

# CORS (URL do seu frontend)
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com

# Email (mesmas configurações do Railway)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app_google
FROM_EMAIL=seu_email@gmail.com

# Redis (opcional)
REDIS_URL=redis://localhost:6379/0
```

**⚠️ IMPORTANTE:** Use as **MESMAS** chaves secretas (`SECRET_KEY` e `JWT_SECRET_KEY`) do Railway para não invalidar tokens existentes!

### 5. Instalar Dependências Python

```bash
cd /var/www/apront/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 6. Inicializar Banco de Dados

```bash
cd /var/www/apront/backend
source venv/bin/activate
python3 -c "from app import app, db; app.app_context().push(); db.create_all()"
```

### 7. Configurar Systemd (Serviço Automático)

```bash
sudo nano /etc/systemd/system/apront-backend.service
```

**Conteúdo:**

```ini
[Unit]
Description=Apront Backend Flask Application
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/apront/backend
Environment="PATH=/var/www/apront/backend/venv/bin"
ExecStart=/var/www/apront/backend/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Ativar serviço
sudo systemctl daemon-reload
sudo systemctl enable apront-backend
sudo systemctl start apront-backend
sudo systemctl status apront-backend
```

### 8. Configurar Nginx (Proxy Reverso)

```bash
sudo nano /etc/nginx/sites-available/apront
```

**Conteúdo:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Redirecionar HTTP para HTTPS (após configurar SSL)
    # return 301 https://$server_name$request_uri;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend (se servir estático)
    location / {
        root /var/www/apront/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/apront /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Configurar SSL (HTTPS) com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 10. Atualizar Frontend

No frontend, configure a variável de ambiente no build:

```bash
cd /var/www/apront
npm install
VITE_API_BASE_URL=https://seu-dominio.com npm run build
```

Ou se usar Vercel/Netlify, configure `VITE_API_BASE_URL` nas variáveis de ambiente deles.

---

## 🔄 Migração de Dados (Opcional)

Se quiser migrar dados do Railway para VPS:

### Exportar do Railway

```bash
# No Railway, vá em PostgreSQL → Connect
# Use pg_dump para exportar
pg_dump $DATABASE_URL > backup.sql
```

### Importar na VPS

```bash
# Na VPS
psql -U apront_user -d apront_db < backup.sql
```

---

## ✅ Checklist de Migração

- [ ] ✅ VPS configurada (Python, PostgreSQL, Nginx)
- [ ] ✅ Repositório clonado
- [ ] ✅ Banco PostgreSQL criado
- [ ] ✅ Variáveis de ambiente configuradas (`.env`)
- [ ] ✅ Dependências instaladas
- [ ] ✅ Banco inicializado
- [ ] ✅ Serviço systemd configurado e rodando
- [ ] ✅ Nginx configurado como proxy reverso
- [ ] ✅ SSL/HTTPS configurado (Let's Encrypt)
- [ ] ✅ Frontend atualizado com nova URL
- [ ] ✅ Testado todas as funcionalidades
- [ ] ✅ Dados migrados (se necessário)

---

## 🆚 Diferenças: Railway vs VPS

| Aspecto | Railway | VPS |
|---------|---------|-----|
| **Configuração** | Automática | Manual |
| **Variáveis de Ambiente** | Painel web | Arquivo `.env` |
| **Banco de Dados** | Criado automaticamente | Criar manualmente |
| **SSL/HTTPS** | Automático | Let's Encrypt |
| **Serviço** | Automático | Systemd |
| **Proxy** | Automático | Nginx manual |
| **Código** | ✅ **MESMO** | ✅ **MESMO** |

---

## 💡 Dicas Importantes

1. **Use as mesmas chaves secretas** do Railway para não invalidar tokens
2. **Teste localmente primeiro** antes de migrar
3. **Faça backup** do banco antes de migrar
4. **Configure firewall** na VPS (UFW)
5. **Monitore logs**: `sudo journalctl -u apront-backend -f`

---

## 🚨 Troubleshooting

### Backend não inicia

```bash
# Ver logs
sudo journalctl -u apront-backend -n 50

# Verificar se porta está em uso
sudo netstat -tulpn | grep 5001
```

### Nginx não conecta ao backend

```bash
# Verificar se backend está rodando
curl http://localhost:5001/

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### WebSocket não funciona

Verifique se Nginx tem as configurações de `Upgrade` e `Connection` corretas (já incluídas no exemplo acima).

---

## ✅ Resumo

**Você NÃO precisa alterar NADA no código!** 🎉

Apenas:
1. Configure variáveis de ambiente na VPS (igual ao Railway)
2. Configure Nginx como proxy reverso
3. Configure SSL/HTTPS
4. Atualize URL do frontend

**O código funciona igual em ambos os ambientes!** ✅

