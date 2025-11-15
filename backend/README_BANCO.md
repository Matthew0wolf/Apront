# 🗄️ Configuração do Banco de Dados

## ✅ Banco PostgreSQL Criado no Docker

O banco está rodando na **porta 5433** para não conflitar com outros sistemas.

---

## 🚀 Como Usar

### Método 1: Arquivo .env (Mais Fácil)

1. **Crie um arquivo `.env` na pasta `backend/`:**

```env
DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5433/apront_db
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production
FLASK_ENV=development
PORT=5001
```

2. **Inicie o backend:**
```bash
cd backend
python app.py
```

**Pronto!** O `app.py` agora carrega automaticamente o arquivo `.env`! ✅

### Método 2: Variável de Ambiente

**PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://apront_user:apront_password_2024@localhost:5433/apront_db"
cd backend
python app.py
```

**CMD:**
```cmd
set DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5433/apront_db
cd backend
python app.py
```

---

## 📋 Informações do Banco

- **URL:** `postgresql://apront_user:apront_password_2024@localhost:5433/apront_db`
- **Porta:** `5433` (não conflita com porta 5432)
- **Usuário:** `apront_user`
- **Senha:** `apront_password_2024`
- **Banco:** `apront_db`

---

## ⚠️ IMPORTANTE

1. **Adicione `.env` ao `.gitignore`** para não commitar senhas!
2. O banco está **isolado** no Docker - não interfere com outros sistemas
3. Dados são **persistidos** em volume Docker

---

## 🔧 Comandos Docker

```bash
# Ver se está rodando
docker ps --filter "name=apront-postgres"

# Ver logs
docker logs apront-postgres

# Parar
docker-compose stop postgres

# Iniciar
docker-compose start postgres
```

---

**Agora é só criar o `.env` e rodar! 🎉**

