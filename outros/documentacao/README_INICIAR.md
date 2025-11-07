# 🚀 COMO INICIAR O SISTEMA APRONT

## ✅ **MÉTODO MAIS FÁCIL: Scripts .bat**

### **1. Iniciar Backend:**
Clique duas vezes em:
```
INICIAR_BACKEND.bat
```

**Deve aparecer:**
```
⚠️  Redis não disponível - cache desabilitado
💾 Usando SQLite (desenvolvimento local)
✅ Segurança e rate limiting ativados
 * Running on http://0.0.0.0:5001
```

**DEIXE ESTA JANELA ABERTA!**

---

### **2. Iniciar Frontend (NOVA JANELA):**
Clique duas vezes em:
```
INICIAR_FRONTEND.bat
```

**Deve aparecer:**
```
VITE v4.5.x ready in XXX ms
➜  Local:   http://localhost:3001/
```

---

### **3. Acessar Sistema:**
```
http://localhost:3001
```

---

## 🔧 **MÉTODO ALTERNATIVO: PowerShell**

### **Terminal 1 - Backend:**
```powershell
cd "C:\Users\mathe\Downloads\horizons-export-4626fa91-413b-4b5e-82c2-f483f8d88af5 (1)"
python backend\app.py
```

### **Terminal 2 - Frontend:**
```powershell
cd "C:\Users\mathe\Downloads\horizons-export-4626fa91-413b-4b5e-82c2-f483f8d88af5 (1)"
npm run dev
```

---

## ❌ **SE DER ERRO:**

### **Erro: "can't open file backend\app.py"**
**Causa:** Você está no diretório errado

**Solução:** Use os scripts .bat OU execute:
```powershell
cd "C:\Users\mathe\Downloads\horizons-export-4626fa91-413b-4b5e-82c2-f483f8d88af5 (1)"
```

### **Erro: "ModuleNotFoundError"**
```powershell
cd backend
pip install -r requirements.txt
```

### **Erro no frontend: "Unexpected token '<'"**
**Causa:** Backend não está rodando

**Solução:** Inicie o backend primeiro (passo 1)

---

## ✅ **CHECKLIST:**

- [ ] Backend rodando (porta 5001)
- [ ] Frontend rodando (porta 3001)
- [ ] Navegador aberto em http://localhost:3001
- [ ] Tela de login aparecendo

---

## 🎯 **PRIMEIRO ACESSO:**

1. **Criar conta:**
   - Clique em "Cadastre-se"
   - Preencha nome, email, senha
   - Faça login

2. **OU popular banco:**
   ```powershell
   cd backend
   python scripts\populate\populate_db.py
   ```
   
   Usuários criados:
   - admin@apront.com / admin123
   - operator@apront.com / operator123
   - presenter@apront.com / presenter123

---

**Use os scripts .bat - é mais fácil!** 🚀

