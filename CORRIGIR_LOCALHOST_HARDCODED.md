# 🔧 Corrigir localhost:5001 Hardcoded

## ❌ Problema

Vários arquivos ainda usam `http://localhost:5001` hardcoded, causando erros em produção.

## ✅ Solução

O `NotificationsContext.jsx` foi corrigido. Agora execute na VPS:

### **1. Atualizar código e rebuild:**

```bash
cd /var/www/apront
git fetch origin
git reset --hard origin/main
rm -rf dist/
npm run build
sudo chown -R www-data:www-data /var/www/apront/dist
sudo chmod -R 755 /var/www/apront/dist
```

### **2. Sobre o erro 403:**

O erro `403 FORBIDDEN` em `/api/rundowns` pode ser:
- Token expirado ou inválido
- Usuário não tem permissão
- Problema de autenticação

**Solução:** Faça logout e login novamente.

### **3. Verificar logs do backend:**

```bash
docker compose logs backend | grep -i "403\|forbidden\|auth" | tail -20
```

## 📋 Arquivos que ainda precisam ser corrigidos (futuro):

- `TemplatesView.jsx`
- `SettingsView.jsx`
- `AcceptInvitePage.jsx`
- `PlansView.jsx`
- `AnalyticsView.jsx`
- `TeamView.jsx`
- `UserMenu.jsx`

**Por enquanto, o `NotificationsContext.jsx` foi corrigido, que era o mais crítico.**

## ✅ Comandos Completos:

```bash
cd /var/www/apront && git fetch origin && git reset --hard origin/main && rm -rf dist/ && npm run build && sudo chown -R www-data:www-data /var/www/apront/dist && sudo chmod -R 755 /var/www/apront/dist
```

Depois, **faça logout e login novamente** para resolver o erro 403.

