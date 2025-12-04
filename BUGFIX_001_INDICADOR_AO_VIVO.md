# 🔧 BUGFIX #001 - Indicador "Ao Vivo" Sumindo

## 📋 Problema

O indicador "Ao Vivo" sumia após atualizar a página, mesmo que o projeto continuasse ao vivo. O indicador aparecia inicialmente, mas desaparecia após recarregar.

## 🔍 Causa Raiz

O indicador "Ao Vivo" estava sendo determinado baseado em `liveProject`, que por sua vez dependia de:
- `isRunning` (timer rodando)
- `activeRundown` (rundown ativo no contexto)

Quando o usuário saía do projeto e voltava para a lista, ou atualizava a página:
- `activeRundown` podia ser limpo ou não existir mais
- `liveProject` ficava `null`
- O indicador desaparecia, mesmo que o projeto estivesse realmente "Ao Vivo"

## ✅ Solução Implementada

### 1. Mudança no `ProjectsView.jsx`

**Antes:**
```javascript
const liveProject = isRunning && activeRundown ? rundowns.find(r => r.id === activeRundown.id) : null;
const isLive = liveProject && liveProject.id === project.id;
```

**Depois:**
```javascript
// CRÍTICO: Usa o campo status do projeto ao invés de liveProject
// Isso garante que o indicador funcione mesmo após atualizar a página
const isLive = project.status && project.status.toLowerCase() === 'ao vivo';
```

**Benefícios:**
- O indicador agora é baseado no campo `status` do projeto, que vem do backend
- Funciona mesmo após atualizar a página
- Não depende mais do estado local (`activeRundown`, `isRunning`)

### 2. Atualização no `RundownContext.jsx`

**Antes:**
```javascript
if (changes.status && isActiveRundown && activeRundown) {
  // Atualizava apenas se fosse o rundown ativo
  setRundowns(prev => prev.map(r => ...));
}
```

**Depois:**
```javascript
// CRÍTICO: Atualizar status do rundown se fornecido
// SEMPRE atualiza a lista de rundowns quando o status muda, independente de estar ativo ou não
// Isso garante que o indicador "Ao Vivo" funcione mesmo após atualizar a página
if (changes.status) {
  const rundownExists = rundowns.some(r => String(r.id) === rundownIdStr);
  if (rundownExists) {
    // Atualiza na lista de rundowns (sempre, independente de estar ativo)
    setRundowns(prev => prev.map(r => ...));
  }
  
  // Se for o rundown ativo, também atualiza o activeRundown
  if (isActiveRundown && activeRundown) {
    setActiveRundown(prev => ({ ...prev, status: changes.status }));
  }
}
```

**Benefícios:**
- Mudanças de status via WebSocket sempre atualizam a lista
- Funciona mesmo quando o rundown não está ativo no contexto
- Garante sincronização em tempo real do indicador "Ao Vivo"

## 🔄 Fluxo de Sincronização

1. **Operador inicia o timer** → Backend atualiza `status = 'Ao Vivo'`
2. **Backend envia via WebSocket** → `changes = { status: 'Ao Vivo', ... }`
3. **RundownContext recebe** → Atualiza a lista de rundowns com o novo status
4. **ProjectsView renderiza** → Verifica `project.status === 'Ao Vivo'` e mostra indicador
5. **Página atualizada** → Lista é recarregada do backend com o status correto
6. **Indicador permanece** → Porque o status vem do backend, não do estado local

## ✅ Validação

- ✅ Indicador "Ao Vivo" aparece quando o projeto está ao vivo
- ✅ Indicador permanece após atualizar a página
- ✅ Indicador desaparece quando o projeto é pausado
- ✅ Sincronização em tempo real entre abas
- ✅ Funciona mesmo quando o rundown não está ativo no contexto

## 📝 Arquivos Modificados

1. `Apront/src/components/views/ProjectsView.jsx`
   - Mudança do indicador para usar `project.status`
   - Remoção de importações não utilizadas (`isRunning`, `activeRundown`)

2. `Apront/src/contexts/RundownContext.jsx`
   - Atualização para sempre atualizar a lista quando status muda via WebSocket
   - Garantir que funcione mesmo quando rundown não está ativo

## 🎯 Próximos Passos

1. Testar em produção
2. Verificar se há outros lugares que dependem de `liveProject`
3. Monitorar logs para garantir que status está sendo atualizado corretamente

---

**Status:** ✅ **RESOLVIDO**

