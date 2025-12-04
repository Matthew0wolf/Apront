# 🔧 Correção de Erros em Produção

## ❌ Erros Identificados:

1. **WebSocket connection failed**: Tentando usar `ws://` em vez de `wss://` ou protocolo incorreto
2. **Erro 413 (Request Entity Too Large)**: Upload de avatar falhando por limite do Nginx
3. **Erro 502 (Bad Gateway)**: Alguns requests falhando

## ✅ Soluções:

### 1. Corrigir Configuração do Nginx (Adicionar `client_max_body_size`)

O erro 413 ocorre porque o Nginx tem um limite padrão de 1MB para uploads. Avatares podem ser maiores.

**Execute na VPS:**

```bash
sudo nano /etc/nginx/sites-available/apront
```

**Adicione `client_max_body_size 10M;` no início do bloco `server`:**

```nginx
server {
    listen 80;
    server_name 72.60.56.28;
    
    # Aumenta limite de upload para 10MB (necessário para avatares)
    client_max_body_size 10M;
    
    location / {
        root /var/www/apront/dist;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

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
        proxy_buffering off;
    }

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
        
        # Aumenta limite de upload para esta rota também
        client_max_body_size 10M;
    }
}
```

**Após editar, teste e recarregue:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Verificar WebSocket

O WebSocket deve funcionar automaticamente se:
- O Nginx estiver configurado corretamente (como acima)
- O backend estiver rodando na porta 5001
- O frontend estiver usando a URL correta

**Para verificar se o backend está rodando:**

```bash
docker compose ps
```

**Para ver logs do backend:**

```bash
docker compose logs -f backend
```

### 3. Verificar Erro 502

O erro 502 geralmente significa que o Nginx não consegue se conectar ao backend. Verifique:

**A) Backend está rodando:**

```bash
docker compose ps backend
```

**B) Backend está respondendo na porta 5001:**

```bash
curl http://127.0.0.1:5001/api/auth/login
```

**C) Verificar logs do Nginx:**

```bash
sudo tail -f /var/log/nginx/error.log
```

### 4. Reiniciar Serviços (se necessário)

```bash
# Reiniciar containers
docker compose restart

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 📝 Notas:

- O limite de upload está configurado para **10MB** (suficiente para avatares)
- Se precisar aumentar, ajuste `client_max_body_size` no Nginx
- O WebSocket funciona via proxy do Nginx automaticamente
- Em produção, o protocolo (ws/wss) será detectado automaticamente baseado no protocolo usado para acessar o site

