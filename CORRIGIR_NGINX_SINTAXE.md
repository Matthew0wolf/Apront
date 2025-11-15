# 🔧 Corrigir Erro de Sintaxe no Nginx

## ❌ Erro Encontrado

```
unexpected end of file, expecting ";" or "}" in /etc/nginx/sites-available/apront:5
```

Isso significa que há um erro de sintaxe no arquivo (falta fechar chave, ponto e vírgula, etc.).

## ✅ Solução: Recriar Arquivo Corretamente

Execute na VPS:

```bash
sudo nano /etc/nginx/sites-available/apront
```

### **Apague TODO o conteúdo e cole esta configuração COMPLETA:**

```nginx
server {
    listen 80;
    server_name 72.60.56.28;
    
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
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

**⚠️ IMPORTANTE:**
- Certifique-se de que TODAS as chaves `{` e `}` estão fechadas
- Certifique-se de que TODAS as linhas terminam com `;` (exceto chaves)
- Não deixe linhas vazias no meio de blocos

**Salve:** `Ctrl+O`, `Enter`, `Ctrl+X`

### **2. Testar configuração:**

```bash
sudo nginx -t
```

**Deve mostrar:** `syntax is ok` e `test is successful`

**Se ainda der erro, verifique:**
- Todas as chaves `{` têm `}` correspondente
- Todas as linhas de configuração terminam com `;`
- Não há caracteres especiais ou acentos

### **3. Se o teste passar, recarregar:**

```bash
sudo systemctl reload nginx
```

### **4. Verificar permissões:**

```bash
sudo chown -R www-data:www-data /var/www/apront/dist
sudo chmod -R 755 /var/www/apront/dist
```

### **5. Testar:**

Acesse: `http://72.60.56.28`

## 🔍 Verificar Conteúdo do Arquivo

Se quiser verificar o que está no arquivo atual:

```bash
cat /etc/nginx/sites-available/apront
```

**Deve mostrar a configuração completa acima.**

## 📋 Checklist

- [ ] Arquivo recriado com configuração completa
- [ ] Todas as chaves fechadas
- [ ] Todas as linhas terminam com `;`
- [ ] `nginx -t` passou sem erros
- [ ] Nginx recarregado
- [ ] Frontend acessível

