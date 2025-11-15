# 🔧 Corrigir URL do Convite no Email

## ❌ Problema

Email de convite está sendo enviado com `http://localhost:3000` em vez de `http://72.60.56.28`.

## ✅ Solução

Adicionar `FRONTEND_URL` no `.env` do backend para garantir que use a URL correta.

### **1. Editar .env do backend:**

```bash
nano /var/www/apront/backend/.env
```

### **2. Adicionar esta linha:**

```env
FRONTEND_URL=http://72.60.56.28
```

### **3. .env completo deve ficar assim:**

```env
# Configurações de Email SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=matheusdev0998@gmail.com
SMTP_PASSWORD=qcwvmxidpmpdixku
FROM_EMAIL=matheusdev0998@gmail.com

# URL do Frontend (para links em emails)
FRONTEND_URL=http://72.60.56.28

# Banco de Dados PostgreSQL (Docker - nome do serviço)
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db

# Redis (Docker - nome do serviço)
REDIS_URL=redis://redis:6379/0

# Segurança
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production

# Ambiente
FLASK_ENV=production
PORT=5001
```

### **4. Reiniciar backend:**

```bash
docker compose restart backend
```

### **5. Testar envio de convite:**

Envie um novo convite e verifique se o email tem a URL correta.

### **6. Ver logs para confirmar:**

```bash
docker compose logs -f backend
```

**Ao enviar convite, deve aparecer:**
```
[EMAIL] Usando FRONTEND_URL do ambiente: http://72.60.56.28
[EMAIL] URL do convite gerada: http://72.60.56.28/accept-invite?token=...
```

## 🚀 Comando Rápido (Copy/Paste):

```bash
cd /var/www/apront && echo "FRONTEND_URL=http://72.60.56.28" >> backend/.env && docker compose restart backend && echo "✅ FRONTEND_URL configurado!"
```

## ⚠️ Importante:

- **FRONTEND_URL** deve ser a URL pública do frontend (sem porta, pois Nginx já faz proxy)
- Se tiver domínio, use: `FRONTEND_URL=https://seu-dominio.com`
- Sem domínio, use o IP: `FRONTEND_URL=http://72.60.56.28`

## 🔍 Se Ainda Não Funcionar:

Verifique os logs para ver qual URL está sendo detectada:

```bash
docker compose logs backend | grep -i "EMAIL.*URL\|FRONTEND\|ambiente"
```

**Deve mostrar:**
```
[EMAIL] IS_PRODUCTION: True
[EMAIL] FLASK_ENV: production
[EMAIL] Usando FRONTEND_URL do ambiente: http://72.60.56.28
```

