# 🔧 Solução: Erro de Conexão na Porta 5432

## ❌ Problema

O backend estava tentando conectar na porta **5432**, mas o banco PostgreSQL do Docker está na porta **5433**.

**Erro:**
```
Usando PostgreSQL: localhost:5432/postgres
connection to server at "localhost" (::1), port 5432 failed: Connection refused
```

## 🔍 Causa

Havia uma **variável de ambiente `DATABASE_URL`** definida no sistema Windows apontando para:
```
postgresql://postgres:admin@localhost:5432/postgres
```

Essa variável estava **sobrescrevendo** o arquivo `.env`.

## ✅ Solução Aplicada

### 1. Atualizado `app.py` para priorizar `.env`

```python
# Antes
load_dotenv()

# Depois
load_dotenv(override=True)  # Sobrescreve variáveis do sistema
```

### 2. Adicionado `DATABASE_URL` no `.env`

O arquivo `.env` agora contém:
```env
DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5433/apront_db
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production
FLASK_ENV=development
PORT=5001
```

**Porta correta: 5433** ✅

## 🚀 Como Testar

Agora inicie o backend:

```powershell
cd Apront
python main.py
```

**Deve aparecer:**
```
Usando PostgreSQL: localhost:5433/apront_db  ✅
OK: Seguranca e rate limiting ativados
 * Running on http://0.0.0.0:5001
```

## 📋 Verificação

Se ainda der erro, verifique:

1. **Banco está rodando?**
   ```powershell
   docker ps --filter "name=apront-postgres"
   ```

2. **Arquivo `.env` tem `DATABASE_URL`?**
   ```powershell
   cd backend
   Get-Content .env | Select-String "DATABASE_URL"
   ```
   Deve mostrar: `DATABASE_URL=postgresql://...localhost:5433/...`

3. **Variável de ambiente do sistema (opcional - remover se necessário)**
   ```powershell
   # Ver se existe
   $env:DATABASE_URL
   
   # Remover (apenas para esta sessão)
   Remove-Item Env:\DATABASE_URL
   ```

## ✅ Resumo

- ✅ `app.py` agora usa `load_dotenv(override=True)`
- ✅ Arquivo `.env` tem `DATABASE_URL` com porta **5433**
- ✅ Variável de ambiente do sistema será ignorada

**Agora deve funcionar!** 🎉

