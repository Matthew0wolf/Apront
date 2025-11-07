# 🚀 Guia de Início Rápido - Sistema Apront

## ❗ IMPORTANTE: Erro "Failed to fetch"

Este erro acontece quando o **backend não está rodando**!

---

## 📋 Passo a Passo

### 1️⃣ Iniciar o Backend (OBRIGATÓRIO!)

**Opção A: Usando o arquivo .bat**
```
Clique duas vezes em: INICIAR_BACKEND.bat
```

**Opção B: Manualmente**
```bash
# Abra um terminal
cd backend
python app.py
```

**Você deve ver:**
```
 * Running on http://0.0.0.0:5001
 * Running on http://127.0.0.1:5001
WARNING: This is a development server.
```

✅ **Backend está rodando na porta 5001**

---

### 2️⃣ Iniciar o Frontend

**Opção A: Usando o arquivo .bat**
```
Clique duas vezes em: INICIAR_FRONTEND.bat
```

**Opção B: Manualmente**
```bash
# Abra outro terminal (não feche o do backend!)
npm run dev
```

**Você deve ver:**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ **Frontend está rodando na porta 5173**

---

### 3️⃣ Acessar o Sistema

**Abra o navegador em:**
```
http://localhost:5173
```

---

## 🔑 Credenciais de Login

### Usuário 1
```
Email: teste@sync.com
Senha: 123456
```

### Usuário 2
```
Email: matheuselpidio5@gmail.com
Senha: 123456
```

---

## ✅ Checklist de Verificação

Antes de tentar fazer login, confirme:

- [ ] Backend está rodando (porta 5001)
- [ ] Frontend está rodando (porta 5173)
- [ ] Não há erros no terminal do backend
- [ ] Você acessou http://localhost:5173 no navegador

---

## 🐛 Resolução de Problemas

### "Failed to fetch" ao fazer login

**Causa:** Backend não está rodando

**Solução:**
1. Verifique se o terminal do backend está aberto
2. Deve mostrar: `Running on http://0.0.0.0:5001`
3. Se não estiver, execute: `cd backend` e depois `python app.py`

---

### "Port already in use" (Porta já em uso)

**Backend (5001):**
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <número_do_PID> /F

# Ou mude a porta no backend/app.py (linha 62)
socketio.run(app, debug=True, host='0.0.0.0', port=5002)
```

**Frontend (5173):**
```bash
# Vite usa a próxima porta disponível automaticamente
# Geralmente vai para 5174 se 5173 estiver ocupada
```

---

### Backend inicia mas dá erro

**Verifique:**
```bash
# Está na pasta backend?
cd backend

# Python está instalado?
python --version

# Dependências instaladas?
pip install -r requirements.txt
```

---

### Frontend não carrega

**Verifique:**
```bash
# Node.js instalado?
node --version

# Dependências instaladas?
npm install

# Inicie novamente
npm run dev
```

---

## 📊 Arquitetura do Sistema

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite)                    │
│  http://localhost:5173                      │
└───────────────┬─────────────────────────────┘
                │ fetch API calls
                ↓
┌─────────────────────────────────────────────┐
│  Backend (Flask + SQLite)                   │
│  http://localhost:5001                      │
│                                             │
│  Rotas:                                     │
│  - /api/auth/login                          │
│  - /api/rundowns                            │
│  - /api/items/:id/script      (NOVO!)      │
│  - /api/rehearsals            (NOVO!)      │
└───────────────┬─────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────┐
│  Banco de Dados (SQLite)                    │
│  backend/rundowns.db                        │
└─────────────────────────────────────────────┘
```

---

## 🎯 Testando as Novas Features

### 1. Editar Script (Operador)
1. Login → Dashboard → Projetos
2. Selecione um rundown → "Operador"
3. Passe o mouse sobre um item
4. Clique no ícone verde 📝 "Editar Script"
5. Preencha o script nas abas
6. Salve

### 2. Visualizar Script (Apresentador)
1. Login → Dashboard → Projetos
2. Selecione um rundown → "Apresentador"
3. O script aparece automaticamente no item atual

### 3. Toggle Script/Simplificado (Apresentador)
1. No PresenterView, veja o header
2. Clique em **[📖 Script]** para desativar
3. Muda para **[👁️ Simplificado]** (modo antigo)
4. Clique novamente para alternar

---

## 📝 Notas Importantes

### Backend DEVE estar rodando!
O erro mais comum é tentar usar o sistema sem o backend ativo.

### Duas Janelas de Terminal
Você precisa de **2 terminais abertos**:
- Terminal 1: Backend (não feche!)
- Terminal 2: Frontend (não feche!)

### Banco de Dados
O arquivo `backend/rundowns.db` já foi migrado com as novas tabelas de script e ensaios.

---

## 🆘 Ainda com problemas?

1. Feche TODOS os terminais
2. Abra um terminal NOVO
3. Execute:
```bash
cd backend
python app.py
```
4. Abra OUTRO terminal
5. Execute:
```bash
npm run dev
```
6. Aguarde ambos iniciarem
7. Acesse http://localhost:5173

---

**Sistema desenvolvido:** Outubro 2024  
**Versão:** 1.0 - Sprint 1 Completo  
**Features:** Script Editor + Toggle Simplificado



