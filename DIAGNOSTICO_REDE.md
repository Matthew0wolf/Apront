# 🔍 Diagnóstico de Problemas de Rede

## ❌ Erro Atual
```
TypeError: Failed to fetch
```

Isso significa que o **frontend não consegue se conectar ao backend**.

---

## 📋 Checklist de Diagnóstico

### ✅ PASSO 1: Verifique se o Backend Está Rodando

1. **Pare o backend** se estiver rodando (Ctrl+C)

2. **Inicie o backend com as configurações corretas:**

```bash
cd backend
python app.py
```

3. **Verifique a saída do console:**
   - Deve mostrar: `Running on http://0.0.0.0:5001` ou `Running on all addresses (0.0.0.0)`
   - Se mostrar apenas `Running on http://127.0.0.1:5001`, o backend **NÃO** está acessível pela rede!

### ✅ PASSO 2: Teste o Backend Localmente

Abra o navegador e acesse:
```
http://localhost:5001/
```

Deve retornar:
```json
{
  "message": "API Flask rodando! Use /api/rundowns para acessar os dados."
}
```

### ✅ PASSO 3: Descubra Seu IP Local

**No Windows:**
```cmd
ipconfig
```

Procure por "Adaptador de Rede Sem Fio" ou "Ethernet" e encontre o **IPv4**:
```
Endereço IPv4: 192.168.0.100
```

**Ou execute o script de teste:**
```cmd
TESTAR_BACKEND_REDE.bat
```

### ✅ PASSO 4: Teste o Backend pelo IP da Rede

Abra o navegador e acesse (substitua pelo seu IP):
```
http://192.168.0.100:5001/
```

**Se funcionar:** Backend está OK! ✅  
**Se NÃO funcionar:** Vá para PASSO 5 ⬇️

### ✅ PASSO 5: Configure o Firewall do Windows

O Windows pode estar bloqueando a porta 5001.

**Opção A: Abrir porta pelo Firewall (Recomendado)**

1. Abra o **Painel de Controle**
2. Vá em **Sistema e Segurança → Firewall do Windows Defender**
3. Clique em **Configurações avançadas**
4. Clique em **Regras de Entrada** → **Nova Regra**
5. Selecione **Porta** → Próximo
6. **TCP** e porta **5001** → Próximo
7. **Permitir a conexão** → Próximo
8. Marque **Particular** e **Pública** → Próximo
9. Nome: `Backend Flask 5001` → Concluir

**Opção B: Desabilitar Firewall Temporariamente (Apenas para teste)**

⚠️ **CUIDADO:** Isso expõe seu computador!

1. Painel de Controle → Sistema e Segurança → Firewall do Windows
2. Desativar (apenas para testar)
3. Teste novamente
4. **REATIVE o Firewall depois!**

### ✅ PASSO 6: Verifique o Arquivo `backend/app.py`

Abra `backend/app.py` e verifique a **ÚLTIMA LINHA**:

**✅ CORRETO:**
```python
socketio.run(app, debug=True, host='0.0.0.0', port=5001)
```

**❌ INCORRETO:**
```python
socketio.run(app, debug=True, port=5001)  # falta host='0.0.0.0'
socketio.run(app, debug=True, host='127.0.0.1', port=5001)  # só localhost
```

Se estiver incorreto, **corrija e reinicie o backend**.

### ✅ PASSO 7: Teste o Frontend

1. **Abra o console do navegador (F12)**

2. **Recarregue a página** (Ctrl+R)

3. **Procure pelas mensagens:**

```
🔧 API configurada: {
  frontend: "http://192.168.0.100:3000/...",
  hostname: "192.168.0.100",
  API_BASE_URL: "http://192.168.0.100:5001",
  WS_URL: "ws://192.168.0.100:5001"
}
```

4. **Verifique se há erro:**

**✅ Se aparecer:**
```
✅ Backend respondeu: 200 OK
✅ Backend ativo: { message: "API Flask rodando!..." }
```
→ Tudo OK! O problema pode ser de autenticação.

**❌ Se aparecer:**
```
❌ ERRO: Não foi possível conectar ao backend!
❌ URL tentada: http://192.168.0.100:5001/
❌ Erro: Failed to fetch
```
→ Backend não está acessível. Volte ao PASSO 5.

---

## 🔧 Solução Rápida (Tente Primeiro)

### Para Backend:

**1. Pare o backend atual (Ctrl+C)**

**2. Execute este comando:**
```cmd
cd backend
python app.py
```

**3. Confirme que vê:**
```
* Running on all addresses (0.0.0.0)
* Running on http://192.168.0.100:5001
* Running on http://127.0.0.1:5001
```

### Para Frontend:

**1. Limpe o cache do navegador:**
- Pressione `Ctrl + Shift + Delete`
- Marque "Imagens e arquivos em cache"
- Limpar

**2. Faça um hard refresh:**
- Pressione `Ctrl + Shift + R`

**3. Ou reinicie o frontend:**
```cmd
# Pare o frontend (Ctrl+C)
npm run dev
```

---

## 🐛 Problemas Comuns

### Problema: "Running on http://127.0.0.1:5001" (não mostra 0.0.0.0)

**Solução:** Edite `backend/app.py`, linha final:
```python
# Linha 126-127 (final do arquivo)
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, host='0.0.0.0', port=5001)
```

### Problema: "Connection refused" ou "Failed to fetch"

**Causas possíveis:**
1. ❌ Backend não está rodando
2. ❌ Firewall bloqueando
3. ❌ Backend rodando só em localhost (127.0.0.1)
4. ❌ Porta 5001 já está em uso

**Verificar porta em uso:**
```cmd
netstat -ano | findstr :5001
```

### Problema: Backend inicia mas fecha imediatamente

**Solução:** Pode haver erro no código. Veja a mensagem de erro completa.

---

## 📞 Informações para Suporte

Se ainda não funcionar, forneça:

1. ✅ Saída completa do comando `python backend/app.py`
2. ✅ Resultado de `ipconfig`
3. ✅ Mensagens do console do navegador (F12)
4. ✅ Sistema operacional e versão
5. ✅ Resultado do script `TESTAR_BACKEND_REDE.bat`

---

## 🎯 Resumo Rápido

```
┌─────────────────────────────────────────┐
│ 1. Backend deve rodar em 0.0.0.0:5001  │
│ 2. Firewall deve permitir porta 5001   │
│ 3. Frontend usa IP automaticamente      │
│ 4. Teste: http://SEU_IP:5001/          │
└─────────────────────────────────────────┘
```

**Comando Backend:**
```bash
cd backend
python app.py
```

**Deve mostrar:**
```
* Running on all addresses (0.0.0.0)
* Running on http://192.168.0.100:5001
```

**Comando Frontend:**
```bash
npm run dev
```

**Acesse:**
```
http://192.168.0.100:3000
```

