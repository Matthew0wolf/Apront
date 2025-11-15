# 🔧 Configuração Completa do Nginx

## ✅ Substitua a configuração atual por esta versão completa:

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
    }
}
```

## 🔑 Mudanças Importantes:

1. **`proxy_buffering off;`** na seção `/socket.io` - **CRÍTICO** para WebSocket
2. **`proxy_send_timeout 86400s;`** - Timeout para envio de dados WebSocket
3. **`proxy_connect_timeout 75s;`** - Timeout para conexão inicial
4. Ordem: `/socket.io` antes de `/api` (mais específico primeiro)

## 📋 Passos:

1. **Copie a configuração acima**
2. **No nano:** `Ctrl+K` várias vezes para deletar tudo
3. **Cole a nova configuração:** `Ctrl+Shift+V` ou botão direito
4. **Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`
5. **Teste:** `sudo nginx -t`
6. **Recarregue:** `sudo systemctl reload nginx`

## 🧪 Testar:

```bash
# Verificar se backend está acessível
curl http://127.0.0.1:5001/

# Verificar logs
sudo tail -f /var/log/nginx/error.log
```

