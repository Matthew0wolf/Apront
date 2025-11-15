# ✅ Finalizar Configuração na VPS

## ✅ Status Atual

- ✅ Backend rodando na porta 5001
- ✅ PostgreSQL conectado
- ✅ Redis conectado

## 🔧 Próximos Passos

### **1. Verificar se Frontend está Buildado:**

```bash
cd /var/www/apront
ls -la dist/
```

**Deve mostrar:** `index.html`, `assets/`, etc.

**Se não existir, faça build:**

```bash
cd /var/www/apront
npm install
npm run build
```

### **2. Verificar Nginx:**

```bash
# Verificar se Nginx está rodando
sudo systemctl status nginx

# Verificar configuração
sudo nginx -t
```

### **3. Configurar Nginx (se ainda não configurou):**

```bash
sudo nano /etc/nginx/sites-available/apront
```

**Cole esta configuração:**

```nginx
server {
    listen 80;
    server_name 72.60.56.28;  # Seu IP ou domínio
    
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

**Ativar:**

```bash
sudo ln -s /etc/nginx/sites-available/apront /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### **4. Verificar Permissões do Frontend:**

```bash
# Garantir que Nginx pode ler os arquivos
sudo chown -R www-data:www-data /var/www/apront/dist
sudo chmod -R 755 /var/www/apront/dist
```

### **5. Configurar Firewall:**

```bash
# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar status
sudo ufw status
```

### **6. Testar o Sistema:**

1. **Acesse no navegador:** `http://72.60.56.28`
2. **Deve carregar o frontend React**
3. **Teste fazer um cadastro**

### **7. Verificar Logs (se houver problemas):**

```bash
# Logs do backend
docker compose logs -f backend

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Status dos containers
docker compose ps
```

## 🎯 Checklist Final

- [ ] Frontend buildado (`dist/` existe)
- [ ] Nginx configurado e rodando
- [ ] Permissões do frontend corretas
- [ ] Firewall configurado (portas 80, 443)
- [ ] Sistema acessível em `http://72.60.56.28`
- [ ] Backend respondendo em `/api`
- [ ] WebSocket funcionando em `/socket.io`

## 🔍 Troubleshooting

### **Frontend não carrega (404):**
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

# Testar backend diretamente
curl http://127.0.0.1:5001/
```

### **Erro de CORS:**
- Verifique se o Nginx está fazendo proxy corretamente
- Verifique logs do backend para ver headers CORS

## 🎉 Próximos Passos (Opcional)

1. **Configurar domínio** (se tiver)
2. **Configurar SSL/HTTPS** com Certbot
3. **Configurar backup automático** do banco de dados
4. **Configurar monitoramento** (opcional)

