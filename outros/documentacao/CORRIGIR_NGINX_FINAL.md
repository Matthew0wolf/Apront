# ✅ Configuração Correta do Nginx

## ⚠️ Problemas Encontrados:

1. **Nome do arquivo:** `apronty` → deve ser `apront`
2. **Indentação:** Seção `/socket.io` com espaços extras

## ✅ Configuração Correta:

```nginx
server {
    listen 80;
    server_name 72.60.56.28;

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
    }
}
```

## 🔧 Correções Necessárias:

### **1. Verificar nome do arquivo:**

```bash
ls -la /etc/nginx/sites-available/apront*
```

**Se existir `apronty`, renomeie:**

```bash
sudo mv /etc/nginx/sites-available/apronty /etc/nginx/sites-available/apront
```

### **2. Editar arquivo correto:**

```bash
sudo nano /etc/nginx/sites-available/apront
```

### **3. Cole a configuração acima (sem comentários inline)**

**Remova os comentários** `# ADICIONE ESTA LINHA` - eles podem causar problemas.

### **4. Verificar indentação:**

- Todas as linhas dentro de `location /socket.io {` devem ter **4 espaços** de indentação
- Não deve ter espaços extras antes de `location /socket.io {`

### **5. Testar e aplicar:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## ✅ Checklist:

- [ ] Arquivo se chama `apront` (não `apronty`)
- [ ] Indentação correta (4 espaços)
- [ ] Sem comentários inline nas diretivas
- [ ] `proxy_buffering off;` presente
- [ ] `nginx -t` passou sem erros
- [ ] Nginx recarregado

