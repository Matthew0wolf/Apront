# 📝 Verificar e Editar .env na VPS

## 🔍 Opção 1: Dentro do Container (Recomendado)

Se você já está dentro do container:

```bash
# Ver conteúdo do .env
cat /app/.env

# Editar com vi (nano não está instalado no container)
vi /app/.env
```

### Comandos do vi:
- `i` - Entrar no modo de inserção (editar)
- `ESC` - Sair do modo de inserção
- `:wq` - Salvar e sair
- `:q!` - Sair sem salvar

## 🔍 Opção 2: No Host (VPS)

Se você sair do container:

```bash
# Sair do container
exit

# Ver conteúdo do .env
cat /var/www/apront/backend/.env

# Editar com nano (disponível no host)
nano /var/www/apront/backend/.env
```

## 📋 Conteúdo Esperado do .env

```env
# Configurações de Email SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app_google
FROM_EMAIL=seu_email@gmail.com

# Banco de Dados PostgreSQL (Docker - nome do serviço)
DATABASE_URL=postgresql://apront_user:apront_password_2024@postgres:5432/apront_db

# Redis (Docker - nome do serviço)
REDIS_URL=redis://redis:6379/0

# Segurança
SECRET_KEY=sua_secret_key_aqui
JWT_SECRET_KEY=sua_jwt_secret_key_aqui

# Ambiente
FLASK_ENV=production

# Porta
PORT=5001

# URL do Frontend (para links em emails)
FRONTEND_URL=http://72.60.56.28
```

## 🔧 Verificar Erro 500 do Email

### 1. Ver logs do backend:

```bash
# No host (VPS)
docker compose logs backend | grep -i email
```

### 2. Verificar se as variáveis estão corretas:

```bash
# Dentro do container
python -c "import os; from dotenv import load_dotenv; load_dotenv('/app/.env'); print('SMTP_SERVER:', os.getenv('SMTP_SERVER')); print('SMTP_USERNAME:', os.getenv('SMTP_USERNAME')); print('SMTP_PASSWORD:', '***' if os.getenv('SMTP_PASSWORD') else 'NÃO CONFIGURADO')"
```

### 3. Testar envio de email:

```bash
# Dentro do container
python backend/test_email.py
```

## ⚠️ Importante

- O `.env` dentro do container está em `/app/.env`
- O `.env` no host está em `/var/www/apront/backend/.env`
- Ambos são o mesmo arquivo (mapeado pelo volume do Docker)
- Se editar no host, precisa reiniciar o backend: `docker compose restart backend`

