# 🚀 Atualizar Código na VPS (Comando Completo)

## 📋 Comando Completo (Copy/Paste):

```bash
cd /var/www/apront && git fetch origin && git reset --hard origin/main && npm install && npm run build && sudo chown -R www-data:www-data dist/ && sudo chmod -R 755 dist/ && docker compose restart backend && sudo nginx -t && sudo systemctl reload nginx && echo "✅ Atualização completa!"
```

## 📝 O que este comando faz:

1. ✅ **Atualiza código do Git** (`git fetch` + `git reset`)
2. ✅ **Instala dependências** (`npm install`)
3. ✅ **Faz build do frontend** (`npm run build`)
4. ✅ **Ajusta permissões do dist** (`chown` + `chmod`)
5. ✅ **Reinicia backend** (aplica mudanças em Python, ex: `email_utils.py`)
6. ✅ **Testa configuração Nginx** (`nginx -t`)
7. ✅ **Recarrega Nginx** (`systemctl reload nginx`)

## 🔄 Se quiser apenas atualizar backend (sem rebuild frontend):

```bash
cd /var/www/apront && git fetch origin && git reset --hard origin/main && docker compose restart backend && echo "✅ Backend atualizado!"
```

## 🔄 Se quiser apenas atualizar frontend (sem reiniciar backend):

```bash
cd /var/www/apront && git fetch origin && git reset --hard origin/main && npm install && npm run build && sudo chown -R www-data:www-data dist/ && sudo chmod -R 755 dist/ && sudo systemctl reload nginx && echo "✅ Frontend atualizado!"
```

## ⚠️ Se der erro de permissão:

```bash
cd /var/www/apront && git fetch origin && git reset --hard origin/main && npm install && npm run build && sudo chown -R $USER:$USER dist/ && sudo chown -R www-data:www-data dist/ && sudo chmod -R 755 dist/ && docker compose restart backend && sudo nginx -t && sudo systemctl reload nginx && echo "✅ Atualização completa!"
```

