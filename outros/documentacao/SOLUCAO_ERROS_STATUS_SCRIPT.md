# ✅ Solução: Erros ao Atualizar Status e Salvar Script

## ❌ Problemas Identificados

### 1. Erro `StringDataRightTruncation` ao atualizar status
**Erro:**
```
value too long for type character varying(20)
[parameters: {'last_modified': '2025-11-14T21:50:48.718Z', ...}]
```

**Causa:** O campo `last_modified` no banco estava definido como `String(20)`, mas o frontend estava enviando strings ISO completas (ex: `2025-11-14T21:50:48.718Z`) que têm mais de 20 caracteres.

### 2. Erro 401 ao salvar script
**Erro:**
```
PUT http://192.168.0.100:5001/api/items/1/script 401 (UNAUTHORIZED)
```

**Causa:** A rota de script não estava verificando se o item pertence à empresa do usuário, e pode ter problemas de autenticação.

### 3. Rundown não encontrado
**Erro:**
```
❌ loadRundownState: Rundown não encontrado: 1
```

**Causa:** `loadRundownState` estava sendo chamado antes dos rundowns serem carregados do servidor.

---

## ✅ Correções Aplicadas

### 1. Aumentar tamanho do campo `last_modified`

**`backend/models.py`:**
```python
last_modified = db.Column(db.String(50))  # Aumentado para suportar ISO format
```

**Banco de dados:**
```sql
ALTER TABLE rundowns ALTER COLUMN last_modified TYPE VARCHAR(50);
```

### 2. Converter formato ISO para formato curto

**`backend/routes/rundown.py`:**
```python
# Atualiza last_modified se fornecido, senão usa data atual
if data.get('lastModified'):
    # Aceita tanto formato ISO quanto formato curto
    last_modified = data.get('lastModified')
    # Se for formato ISO, extrai apenas a data (YYYY-MM-DD)
    if 'T' in last_modified:
        rundown.last_modified = last_modified.split('T')[0]
    else:
        rundown.last_modified = last_modified
else:
    from datetime import datetime
    rundown.last_modified = datetime.utcnow().strftime('%Y-%m-%d')
```

### 3. Adicionar verificação de empresa na rota de script

**`backend/routes/scripts.py`:**
```python
@scripts_bp.route('/items/<int:item_id>/script', methods=['PUT'])
@jwt_required()
def update_item_script(item_id):
    """Atualiza o script de um item"""
    try:
        current_user = g.current_user
        
        if not current_user or not current_user.company_id:
            return jsonify({'error': 'Usuário sem empresa associada'}), 403
        
        data = request.get_json()
        
        item = Item.query.get_or_404(item_id)
        
        # CRÍTICO: Verificar se o item pertence à mesma empresa do usuário
        folder = Folder.query.get(item.folder_id)
        if not folder:
            return jsonify({'error': 'Pasta não encontrada'}), 404
        
        rundown = Rundown.query.get(folder.rundown_id)
        if not rundown:
            return jsonify({'error': 'Rundown não encontrado'}), 404
        
        if rundown.company_id != current_user.company_id:
            return jsonify({'error': 'Sem permissão para editar este item'}), 403
        
        # ... resto do código
```

### 4. Melhorar `loadRundownState` para aguardar rundowns

**`src/contexts/RundownContext.jsx`:**
```javascript
const loadRundownState = useCallback((rundownId) => {
    const rundownIdStr = String(rundownId);
    
    // Se não houver rundowns carregados ainda, tenta recarregar
    if (rundowns.length === 0) {
      console.warn('⚠️ loadRundownState: Nenhum rundown carregado ainda, tentando recarregar...');
      fetchRundowns();
      return null;
    }
    
    const rundownData = rundowns.find(p => String(p.id) === rundownIdStr);
    if (!rundownData) {
      console.error('❌ loadRundownState: Rundown não encontrado:', rundownIdStr);
      console.error('❌ loadRundownState: Tentando recarregar rundowns...');
      fetchRundowns();
      return null;
    }
    
    // ... resto do código
}, [rundowns, setTimeElapsed, setIsTimerRunning, fetchRundowns]);
```

---

## 🚀 Teste

Após as correções:

1. **Teste de Status:**
   - Acesse um rundown
   - Clique em "Ao Vivo" / "Parar"
   - Não deve mais dar erro 500

2. **Teste de Script:**
   - Adicione um script a um item
   - Deve salvar sem erro 401

3. **Teste de Carregamento:**
   - Acesse `/project/1/operator` ou `/project/1/presenter`
   - O rundown deve carregar corretamente

---

## 📝 Resumo das Mudanças

- ✅ `backend/models.py`: Aumentado `last_modified` de `String(20)` para `String(50)`
- ✅ Banco de dados: ALTER TABLE para aumentar tamanho do campo
- ✅ `backend/routes/rundown.py`: Conversão de formato ISO para formato curto
- ✅ `backend/routes/scripts.py`: Verificação de empresa e melhor tratamento de erros
- ✅ `src/contexts/RundownContext.jsx`: Melhor tratamento quando rundowns ainda não foram carregados

**Todas as correções foram aplicadas!** 🎉

