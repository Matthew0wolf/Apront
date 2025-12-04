# 🔧 Correção de Erros em Produção

## ❌ Erros Encontrados:

1. **WebSocket connection failed**: `ws://72.60.56.28/socket.io/` falhando
2. **Erro 413 (Request Entity Too Large)**: Upload de avatar falhando
3. **Erro 502 (Bad Gateway)**: Alguns requests falhando

## ✅ Soluções:

### 1. Corrigir Configuração do Nginx

**Execute na VPS:**

```bash
sudo nano /etc/nginx/sites-available/apront
```

**Substitua pelo conteúdo abaixo (inclui `client_max_body_size` para resolver o erro 413):**

```nginx
server {
    listen 80;
    server_name 72.60.56.28;
    
    # Aumenta limite de upload para 10MB (resolve erro 413)
    client_max_body_size 10M;
    
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

    # WebSocket (Socket.IO) - DEVE ESTAR ANTES DE /api
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
        proxy_connect_timeout 75s;
        proxy_buffering off;  # CRÍTICO para WebSocket funcionar
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
        
        # Limite de upload para esta rota
        client_max_body_size 10M;
    }
}
```

**Teste e recarregue:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Verificar se Backend Está Rodando

```bash
# Ver status dos containers
docker compose ps

# Se backend não estiver rodando, inicie
docker compose up -d backend

# Ver logs do backend
docker compose logs -f backend
```

### 3. Verificar Logs do Nginx (para erros 502)

```bash
# Ver erros recentes
sudo tail -50 /var/log/nginx/error.log

# Monitorar erros em tempo real
sudo tail -f /var/log/nginx/error.log
```

### 4. Testar Conexão com Backend

```bash
# Testar se backend responde
curl http://127.0.0.1:5001/api/auth/login

# Deve retornar algo (mesmo que erro 401, significa que está funcionando)
```

### 5. Reiniciar Serviços (se necessário)

```bash
# Reiniciar containers
docker compose restart

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 📝 Notas Importantes:

1. **Erro 413**: Resolvido adicionando `client_max_body_size 10M;` no Nginx
2. **WebSocket**: O Socket.IO detecta automaticamente o protocolo (ws/wss) baseado na URL. Se estiver usando HTTP, usará `ws://`. Se HTTPS, usará `wss://`.
3. **Erro 502**: Geralmente significa que o Nginx não consegue conectar ao backend. Verifique se o backend está rodando na porta 5001.

## 🔍 Diagnóstico:

Se os erros persistirem:

1. **Verificar logs do backend:**
   ```bash
   docker compose logs backend | tail -100
   ```

2. **Verificar logs do Nginx:**
   ```bash
   sudo tail -100 /var/log/nginx/error.log
   ```

3. **Verificar se porta 5001 está aberta:**
   ```bash
   sudo netstat -tlnp | grep 5001
   ```

4. **Testar conexão direta ao backend:**
   ```bash
   curl -v http://127.0.0.1:5001/api/auth/login
   ```

