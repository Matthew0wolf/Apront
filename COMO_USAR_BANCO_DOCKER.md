# 🐳 Como Usar o Banco PostgreSQL no Docker

## ✅ Banco Criado com Sucesso!

O banco PostgreSQL para o Apront foi criado no Docker e está rodando na **porta 5433** (para não conflitar com outros sistemas).

---

## 📋 Informações do Banco

- **Container:** `apront-postgres`
- **Porta Externa:** `5433` (não conflita com PostgreSQL na porta 5432)
- **Porta Interna:** `5432` (dentro do container)
- **Usuário:** `apront_user`
- **Senha:** `apront_password_2024`
- **Banco de Dados:** `apront_db`

**URL de Conexão:**
```
postgresql://apront_user:apront_password_2024@localhost:5433/apront_db
```

---

## 🚀 Como Usar

### Opção 1: Usar Variável de Ambiente (Recomendado)

**No PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://apront_user:apront_password_2024@localhost:5433/apront_db"
cd backend
python app.py
```

**No CMD:**
```cmd
set DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5433/apront_db
cd backend
python app.py
```

### Opção 2: Criar Arquivo .env

Crie um arquivo `.env` na pasta `backend/` com:

```env
DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5433/apront_db
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production
FLASK_ENV=development
PORT=5001
```

**⚠️ IMPORTANTE:** Adicione `.env` ao `.gitignore` para não commitar senhas!

---

## 🔧 Comandos Úteis

### Verificar se o banco está rodando:
```powershell
docker ps --filter "name=apront-postgres"
```

### Ver logs do banco:
```powershell
docker logs apront-postgres
```

### Parar o banco:
```powershell
docker-compose stop postgres
```

### Iniciar o banco:
```powershell
docker-compose start postgres
```

### Parar e remover (CUIDADO: apaga dados!):
```powershell
docker-compose down -v
```

### Conectar ao banco via psql:
```powershell
docker exec -it apront-postgres psql -U apront_user -d apront_db
```

### Verificar se o banco está acessível:
```powershell
docker exec apront-postgres psql -U apront_user -d apront_db -c "SELECT version();"
```

---

## 🆚 Diferença: Porta 5432 vs 5433

- **Porta 5432:** Seu PostgreSQL existente (outros sistemas)
- **Porta 5433:** PostgreSQL do Apront (Docker) ✅

**Isso garante que não há conflito!** 🎯

---

## ✅ Teste Rápido

1. **Defina a variável de ambiente:**
   ```powershell
   $env:DATABASE_URL="postgresql://apront_user:apront_password_2024@localhost:5433/apront_db"
   ```

2. **Inicie o backend:**
   ```powershell
   cd backend
   python app.py
   ```

3. **Deve aparecer:**
   ```
   Usando PostgreSQL: localhost:5433/apront_db
   OK: Seguranca e rate limiting ativados
   ```

---

## 🔒 Segurança

- ✅ Banco isolado no Docker
- ✅ Usuário e senha específicos
- ✅ Não conflita com outros sistemas
- ✅ Dados persistidos em volume Docker

---

## 📝 Próximos Passos

1. ✅ Banco criado e rodando
2. ⬜ Configure `DATABASE_URL` (variável de ambiente ou `.env`)
3. ⬜ Inicie o backend
4. ⬜ Teste o sistema

---

**Pronto! Seu banco está isolado e funcionando! 🎉**

