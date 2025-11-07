# ⚡ SOLUÇÃO RÁPIDA - Failed to Fetch

## 🎯 O Problema

O erro `Failed to fetch` significa que o **backend não está respondendo** no IP da rede.

---

## ✅ SOLUÇÃO EM 3 PASSOS

### 📍 PASSO 1: Inicie o Backend Corretamente

**Abra um terminal/PowerShell e execute:**

```bash
cd backend
python app.py
```

**⚠️ IMPORTANTE:** Você DEVE ver esta saída:

```
* Running on all addresses (0.0.0.0)
* Running on http://192.168.0.100:5001
* Running on http://127.0.0.1:5001
```

**❌ Se NÃO ver "all addresses (0.0.0.0)"**, o backend não está acessível pela rede!

---

### 📍 PASSO 2: Libere a Porta no Firewall

O Windows está **bloqueando** a porta 5001. Você tem 2 opções:

#### **Opção A: Abrir a Porta (RECOMENDADO)** 

Execute como **Administrador**:

```cmd
netsh advfirewall firewall add rule name="Backend Flask 5001" dir=in action=allow protocol=TCP localport=5001
```

#### **Opção B: Criar Regra pelo Windows**

1. Pesquise "Firewall" no Menu Iniciar
2. Clique em "Firewall do Windows Defender"
3. → "Configurações avançadas"
4. → "Regras de Entrada"
5. → "Nova Regra"
6. → **Porta** → Próximo
7. → **TCP**, porta específica: **5001** → Próximo
8. → **Permitir conexão** → Próximo
9. → Marque todas as opções → Próximo
10. → Nome: "Backend Flask 5001" → Concluir

---

### 📍 PASSO 3: Teste a Conexão

**No navegador, acesse:**
```
http://192.168.0.100:5001/
```
(Substitua pelo SEU IP)

**Deve retornar:**
```json
{
  "message": "API Flask rodando! Use /api/rundowns para acessar os dados."
}
```

**✅ Se funcionar:** Problema resolvido! Recarregue o frontend (Ctrl+R)

**❌ Se NÃO funcionar:** Veja diagnóstico completo abaixo ⬇️

---

## 🔍 Diagnóstico Automático

Execute este script para verificar tudo automaticamente:

```cmd
TESTAR_BACKEND_REDE.bat
```

---

## 🐛 Se Ainda Não Funcionar

### Teste 1: Backend Está Rodando?

```bash
curl http://localhost:5001/
```

**✅ Funciona?** Backend OK localmente  
**❌ Não funciona?** Backend não está rodando!

### Teste 2: Backend Acessível na Rede?

Descubra seu IP:
```cmd
ipconfig
```

Teste pelo IP:
```bash
curl http://SEU_IP_AQUI:5001/
```

**✅ Funciona?** Firewall OK  
**❌ Não funciona?** Firewall bloqueando! → Vá para PASSO 2

### Teste 3: Console do Navegador

1. Abra o site: `http://192.168.0.100:3000`
2. Pressione **F12** para abrir o console
3. Procure por:

**✅ SUCESSO:**
```
✅ Backend respondeu: 200 OK
✅ Backend ativo: { message: "API Flask rodando!..." }
```

**❌ ERRO:**
```
❌ ERRO: Não foi possível conectar ao backend!
❌ URL tentada: http://192.168.0.100:5001/
```

---

## 📋 Checklist Completo

- [ ] Backend rodando com `python backend/app.py`
- [ ] Saída mostra "Running on all addresses (0.0.0.0)"
- [ ] `http://localhost:5001/` funciona no navegador
- [ ] `http://192.168.0.100:5001/` funciona no navegador
- [ ] Firewall liberou porta 5001
- [ ] Console do frontend mostra "✅ Backend ativo"

---

## 💡 Dicas Extras

### Se a porta 5001 já estiver em uso:

```cmd
# Descubra o que está usando a porta
netstat -ano | findstr :5001

# Mate o processo (substitua PID pelo número da última coluna)
taskkill /PID NUMERO_PID /F
```

### Se quiser usar outra porta:

**1. Edite `backend/app.py` (linha 126):**
```python
socketio.run(app, debug=True, host='0.0.0.0', port=5002)  # Nova porta
```

**2. Edite `src/config/api.js` (linha 7 e 13):**
```javascript
return 'http://localhost:5002';  // linha 7
// e
return `http://${window.location.hostname}:5002`;  // linha 13
```

**3. Libere a nova porta no firewall**

---

## 🆘 Ainda Com Problemas?

Veja o guia completo de diagnóstico:
📖 **[DIAGNOSTICO_REDE.md](DIAGNOSTICO_REDE.md)**

---

## 🎉 Quando Funcionar

Você verá no console do navegador:

```
🔧 API configurada: {
  frontend: "http://192.168.0.100:3000/...",
  hostname: "192.168.0.100",
  API_BASE_URL: "http://192.168.0.100:5001",
  WS_URL: "ws://192.168.0.100:5001"
}
✅ Backend respondeu: 200 OK
✅ Backend ativo: { message: "API Flask rodando! Use /api/rundowns para acessar os dados." }
🔌 Conectando ao servidor WebSocket... http://192.168.0.100:5001
✅ Conectado ao servidor WebSocket
```

E a página carregará normalmente! 🚀

