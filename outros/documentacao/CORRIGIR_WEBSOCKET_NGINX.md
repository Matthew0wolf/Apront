# 🔧 Corrigir WebSocket no Nginx

## ❌ Problema

WebSocket está tentando conectar em `ws://72.60.56.28/socket.io` mas está falhando.

## ✅ Solução: Verificar e Corrigir Configuração do Nginx

Execute na VPS:

### **1. Verificar configuração atual:**

```bash
cat /etc/nginx/sites-available/apront
```

### **2. Editar e garantir configuração correta:**

```bash
sudo nano /etc/nginx/sites-available/apront
```

### **3. Cole esta configuração COMPLETA (substitua tudo):**

```nginx
server {
    listen 80;
    server_name 72.60.56.28;
    
    # Frontend React (arquivos estáticos)
    location / {
        root /var/www/apront/dist;
        try_files $uri $uri/ /index.html;
        
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket (Socket.IO) - IMPORTANTE: antes de /api
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
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }
}
```

**⚠️ IMPORTANTE:**
- A seção `/socket.io` deve estar **ANTES** de `/api` (ordem importa no Nginx)
- `proxy_buffering off;` é importante para WebSocket
- Timeouts longos para WebSocket

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **4. Testar configuração:**

```bash
sudo nginx -t
```

**Deve mostrar:** `syntax is ok` e `test is successful`

### **5. Recarregar Nginx:**

```bash
sudo systemctl reload nginx
```

### **6. Verificar logs do Nginx:**

```bash
sudo tail -f /var/log/nginx/error.log
```

**Mantenha aberto e tente acessar o site para ver se há erros.**

### **7. Verificar se backend está acessível:**

```bash
# Testar backend diretamente
curl http://127.0.0.1:5001/

# Deve retornar: {"message":"API Flask rodando! Use /api/rundowns para acessar os dados."}

# Testar WebSocket endpoint
curl http://127.0.0.1:5001/socket.io/

# Deve retornar algo (não erro 404)
```

### **8. Rebuild do frontend (com código atualizado):**

```bash
cd /var/www/apront
git fetch origin
git reset --hard origin/main
rm -rf dist/
npm run build
sudo chown -R www-data:www-data /var/www/apront/dist
sudo chmod -R 755 /var/www/apront/dist
sudo systemctl reload nginx
```

### **9. Testar no navegador:**

1. **Limpe o cache:** `Ctrl+Shift+R`
2. **Abra o console:** F12
3. **Verifique:**
   - `WS_URL: ws://72.60.56.28/socket.io` (correto)
   - WebSocket deve conectar

## 🔍 Troubleshooting

### **Se WebSocket ainda não conectar:**

```bash
# Verificar se Nginx está fazendo proxy
curl -H "Upgrade: websocket" -H "Connection: Upgrade" http://72.60.56.28/socket.io/

# Verificar logs do backend
docker compose logs backend | grep -i socket
```

### **Se der erro 502:**

```bash
# Verificar se backend está rodando
docker compose ps backend

# Verificar se porta 5001 está acessível
curl http://127.0.0.1:5001/
```

## 📋 Checklist

- [ ] Configuração do Nginx com `/socket.io` antes de `/api`
- [ ] `proxy_buffering off;` na seção WebSocket
- [ ] Timeouts longos para WebSocket
- [ ] `nginx -t` passou sem erros
- [ ] Nginx recarregado
- [ ] Frontend rebuildado com código atualizado
- [ ] Cache do navegador limpo

