# 🔧 Solução: ERR_CONNECTION_REFUSED

## ❌ Erro

```
Failed to load resource: net::ERR_CONNECTION_REFUSED
❌ ERRO: Não foi possível conectar ao backend!
❌ URL tentada: http://192.168.0.100:5001/
```

## 🔍 Causa

O **backend não está rodando** na porta 5001. O frontend está tentando conectar, mas não há nada escutando.

## ✅ Solução

### Passo 1: Verificar se o banco PostgreSQL está rodando

```powershell
docker ps --filter "name=apront-postgres"
```

Deve mostrar o container `apront-postgres` com status `Up` e `healthy`.

**Se não estiver rodando:**
```powershell
cd Apront
docker-compose up -d postgres
```

### Passo 2: Criar arquivo .env (se não existir)

Crie um arquivo `.env` na pasta `backend/`:

```env
DATABASE_URL=postgresql://apront_user:apront_password_2024@localhost:5433/apront_db
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-change-in-production
FLASK_ENV=development
PORT=5001
```

### Passo 3: Iniciar o Backend

**Opção A: Usando main.py (Recomendado)**
```powershell
cd Apront
python main.py
```

**Opção B: Diretamente**
```powershell
cd Apront\backend
python app.py
```

### Passo 4: Verificar se está funcionando

Abra outro terminal e teste:
```powershell
curl http://localhost:5001/
```

Deve retornar:
```json
{"message": "API Flask rodando! Use /api/rundowns para acessar os dados."}
```

Ou acesse no navegador: `http://localhost:5001/`

## ✅ Resultado Esperado

Quando o backend estiver rodando, você verá:

```
==================================================
   SISTEMA APRONT - INICIANDO BACKEND
==================================================

📦 Verificando dependências do backend...
✅ Dependências verificadas!

🚀 Iniciando Backend Flask...
📡 Backend será iniciado na porta 5001
AVISO: Redis nao disponivel - cache desabilitado
Usando PostgreSQL: localhost:5433/apront_db
OK: Seguranca e rate limiting ativados
 * Running on http://0.0.0.0:5001
```

## 🔍 Troubleshooting

### Backend não inicia

**Erro:** `connection to server at "localhost" (::1), port 5432 failed`
- **Causa:** Tentando conectar na porta errada ou banco não está rodando
- **Solução:** Verifique se o `.env` tem `DATABASE_URL` com porta `5433`

**Erro:** `ModuleNotFoundError`
- **Causa:** Dependências não instaladas
- **Solução:** `pip install -r backend/requirements.txt`

### Backend inicia mas frontend não conecta

**Verifique:**
1. Backend está rodando na porta 5001?
2. Firewall não está bloqueando?
3. Frontend está usando a URL correta?

**Teste manual:**
```powershell
# No navegador ou PowerShell
Invoke-WebRequest http://localhost:5001/
```

## 📋 Checklist

- [ ] ✅ Banco PostgreSQL rodando (porta 5433)
- [ ] ✅ Arquivo `.env` criado em `backend/`
- [ ] ✅ `DATABASE_URL` configurado corretamente
- [ ] ✅ Backend iniciado e rodando
- [ ] ✅ Backend responde em `http://localhost:5001/`
- [ ] ✅ Frontend rodando em `http://localhost:3000/`

## 🎯 Resumo

**O erro acontece porque o backend não está rodando!**

1. ✅ Banco PostgreSQL no Docker (porta 5433)
2. ✅ Arquivo `.env` com `DATABASE_URL`
3. ✅ Iniciar backend: `python main.py`
4. ✅ Frontend conecta automaticamente

**Pronto!** 🎉

