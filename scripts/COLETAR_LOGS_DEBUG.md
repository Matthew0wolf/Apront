# 🔍 Guia para Coletar Logs de Debug

## 📋 O que fazer quando pastas/eventos não são salvos

### **1. Logs do Frontend (Console do Navegador)**

1. **Abra o Console do Navegador:**
   - Pressione `F12` ou `Ctrl+Shift+I`
   - Vá na aba **"Console"**

2. **Limpe o console:**
   - Clique no ícone de limpar (🚫) ou pressione `Ctrl+L`

3. **Ative filtros para ver apenas logs relevantes:**
   - No console, digite: `🔄` ou `✅` ou `❌` para filtrar
   - OU use o filtro do console e digite: `syncRundownUpdate` ou `salvar` ou `PATCH`

4. **Reproduza o problema:**
   - Crie um novo roteiro
   - Adicione uma pasta
   - Adicione um evento dentro da pasta
   - Saia do roteiro
   - Volte ao roteiro

5. **Copie TODOS os logs do console:**
   - Clique com botão direito no console
   - Selecione "Save as..." ou "Export"
   - OU selecione tudo (`Ctrl+A`) e copie (`Ctrl+C`)

6. **Procure especificamente por:**
   - `🔄 Sincronizando mudanças de rundown`
   - `✅ Pastas e eventos salvos no banco de dados`
   - `❌ Erro ao salvar no banco`
   - `PATCH /api/rundowns/`
   - Qualquer erro em vermelho

---

### **2. Logs do Backend (VPS)**

Execute na VPS:

```bash
# 1. Ver logs em tempo real do backend
docker logs -f apront-backend

# OU ver últimos 100 logs
docker logs apront-backend --tail=100

# 2. Filtrar apenas logs relacionados a rundown
docker logs apront-backend --tail=200 | grep -i "rundown\|folder\|item\|PATCH\|update"

# 3. Ver logs de erro
docker logs apront-backend --tail=200 | grep -i "error\|exception\|traceback"
```

**Enquanto você testa no navegador, mantenha o terminal aberto para ver os logs em tempo real.**

---

### **3. Verificar Requisições HTTP (Network Tab)**

1. **Abra o DevTools:**
   - `F12` ou `Ctrl+Shift+I`

2. **Vá na aba "Network" (Rede)**

3. **Limpe a lista:**
   - Clique no ícone de limpar (🚫)

4. **Filtre por "rundown":**
   - No campo de filtro, digite: `rundown`

5. **Reproduza o problema:**
   - Adicione pasta e evento

6. **Procure por requisições:**
   - `PATCH /api/rundowns/[ID]`
   - Clique na requisição
   - Veja:
     - **Request Payload** (o que foi enviado)
     - **Response** (o que o servidor retornou)
     - **Status Code** (200 = sucesso, 400/500 = erro)

7. **Copie as informações:**
   - Screenshot da requisição
   - OU copie o Request Payload e Response

---

### **4. Verificar se a API está sendo chamada**

No console do navegador, execute:

```javascript
// Verificar se a função syncRundownUpdate está sendo chamada
// Isso já deve aparecer nos logs, mas você pode adicionar um breakpoint
```

Ou adicione este código temporário no console antes de testar:

```javascript
// Interceptar chamadas fetch
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 FETCH chamado:', args[0], args[1]);
  return originalFetch.apply(this, args).then(response => {
    console.log('📥 RESPOSTA:', response.status, response.url);
    return response;
  });
};
```

---

### **5. Verificar dados no banco de dados**

Execute na VPS:

```bash
# Conectar ao banco PostgreSQL
docker exec -it apront-postgres psql -U apront_user -d apront_db

# Ver rundowns
SELECT id, name, company_id FROM rundowns ORDER BY id DESC LIMIT 5;

# Ver pastas de um rundown específico (substitua 48 pelo ID do rundown)
SELECT id, title, ordem, rundown_id FROM folders WHERE rundown_id = 48;

# Ver itens de uma pasta (substitua o folder_id)
SELECT id, title, duration, folder_id FROM items WHERE folder_id IN (
  SELECT id FROM folders WHERE rundown_id = 48
);

# Sair do psql
\q
```

---

## 📝 Checklist de Informações para Enviar

Envie:

- [ ] **Logs do Console do Navegador** (todos os logs quando adiciona pasta/evento)
- [ ] **Logs do Backend** (docker logs quando adiciona pasta/evento)
- [ ] **Screenshot ou detalhes da requisição PATCH** (Network tab)
- [ ] **ID do rundown testado**
- [ ] **Mensagens de erro** (se houver, em vermelho no console)
- [ ] **Status da requisição** (200, 400, 500, etc.)

---

## 🔧 Comandos Rápidos para Coletar Tudo

### No Navegador (Console):
```javascript
// Cole isso no console ANTES de testar
console.log('🔍 DEBUG: Iniciando teste de salvamento');
const logs = [];
const originalLog = console.log;
console.log = function(...args) {
  logs.push([new Date().toISOString(), ...args]);
  originalLog.apply(console, args);
};

// Depois de testar, execute:
console.log('📋 LOGS COLETADOS:', logs);
// Copie a saída
```

### Na VPS:
```bash
# Coletar todos os logs relevantes
docker logs apront-backend --tail=500 > /tmp/backend_logs.txt
cat /tmp/backend_logs.txt | grep -i "rundown\|folder\|item\|PATCH\|update\|error" > /tmp/backend_filtered.txt
cat /tmp/backend_filtered.txt
```

---

## 🚨 Se não aparecer NENHUMA requisição PATCH

Isso significa que o código não está chamando a API. Verifique:

1. **Se o código foi atualizado no frontend:**
   ```bash
   # Na VPS
   cd /var/www/apront
   git log -1
   # Deve mostrar o commit "Corrigir salvamento de pastas e eventos"
   ```

2. **Se o build foi feito:**
   ```bash
   # Verificar data do arquivo JavaScript
   ls -la dist/assets/ | grep index
   # Deve ser recente (após o git pull)
   ```

3. **Se o navegador está usando cache:**
   - Faça hard refresh: `Ctrl+Shift+R`
   - OU abra em aba anônima

