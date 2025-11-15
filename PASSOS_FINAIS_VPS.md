# 🚀 Passos Finais para Finalizar Configuração VPS

## ✅ O que já foi feito:
- [x] Nginx configurado
- [x] Código do frontend atualizado (api.js)

## 📋 Próximos Passos:

### **1. Testar Configuração do Nginx:**

```bash
sudo nginx -t
```

**Deve mostrar:** `syntax is ok` e `test is successful`

### **2. Recarregar Nginx:**

```bash
sudo systemctl reload nginx
```

### **3. Atualizar Código e Rebuild do Frontend:**

```bash
cd /var/www/apront

# Atualizar código do repositório
git fetch origin
git reset --hard origin/main

# Limpar build antigo
rm -rf dist/

# Rebuild com código atualizado
npm run build

# Corrigir permissões
sudo chown -R www-data:www-data /var/www/apront/dist
sudo chmod -R 755 /var/www/apront/dist
```

### **4. Verificar se Backend está Rodando:**

```bash
# Verificar containers Docker
docker compose ps

# Verificar logs do backend
docker compose logs backend | tail -20

# Testar backend diretamente
curl http://127.0.0.1:5001/
```

**Deve retornar:** `{"message":"API Flask rodando! Use /api/rundowns para acessar os dados."}`

### **5. Verificar se Backend está Acessível via Nginx:**

```bash
# Testar API através do Nginx
curl http://72.60.56.28/api/rundowns?limit=1

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### **6. Testar no Navegador:**

1. **Acesse:** `http://72.60.56.28`
2. **Abra o Console:** F12
3. **Verifique:**
   - ✅ `API_BASE_URL: http://72.60.56.28` (sem porta)
   - ✅ `WS_URL: ws://72.60.56.28/socket.io` (sem porta 5001)
   - ✅ Backend respondeu com sucesso
   - ✅ WebSocket conectado

### **7. Se WebSocket ainda não conectar:**

```bash
# Verificar se Nginx está fazendo proxy corretamente
curl -H "Upgrade: websocket" -H "Connection: Upgrade" http://72.60.56.28/socket.io/

# Verificar logs do backend para WebSocket
docker compose logs backend | grep -i socket
```

## 🔍 Troubleshooting:

### **Erro 502 Bad Gateway:**
- Backend não está rodando
- Execute: `docker compose up -d`

### **Erro 404 Not Found:**
- Frontend não foi buildado
- Execute: `npm run build` novamente

### **WebSocket não conecta:**
- Verifique se `proxy_buffering off;` está na configuração
- Verifique logs: `sudo tail -f /var/log/nginx/error.log`

## ✅ Checklist Final:

- [ ] Nginx testado e recarregado
- [ ] Código atualizado do Git
- [ ] Frontend rebuildado
- [ ] Permissões corrigidas
- [ ] Backend rodando (docker compose ps)
- [ ] Teste no navegador funcionando
- [ ] WebSocket conectando

## 🎉 Quando tudo estiver funcionando:

Você verá no console do navegador:
- ✅ Backend respondeu: 200 OK
- ✅ Backend ativo: {message: "..."}
- ✅ WebSocket conectado (sem erros)

**A aplicação estará funcionando completamente!**

