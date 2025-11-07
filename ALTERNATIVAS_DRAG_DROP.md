# 3 Alternativas para Resolver o Problema de Drag and Drop

## Problema Identificado
O drag-and-drop trava porque há conflito entre:
1. **Atualização local** quando solta o item
2. **WebSocket sincronização** que atualiza o estado novamente
3. **Framer Motion** que tenta animar durante as atualizações conflitantes

---

## ALTERNATIVA 1: Otimistic Updates com Debounce (Recomendada) ✅

### Conceito:
Usar "otimistic updates" - atualizar a UI imediatamente e só sincronizar após pequeno delay.

### Implementação:

**Mudanças no `OperatorView.jsx`:**

```javascript
// Adicionar no topo do componente
const [isUpdating, setIsUpdating] = useState(false);
const updateTimeoutRef = useRef(null);

const handleDragEnd = (event, info) => {
  if (draggedItem && dropIndicator.show) {
    const { type, data, folderIndex, itemIndex } = draggedItem;
    
    // BLOQUEIA atualizações do WebSocket durante o drag
    setIsUpdating(true);
    
    // Limpa timeout anterior se existir
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    if (type === 'folder' && dropIndicator.type === 'folder') {
      const insertIndex = dropIndicator.index;
      const newItems = [...rundown.items];
      const draggedFolder = newItems.splice(folderIndex, 1)[0];
      
      let adjustedInsertIndex = insertIndex;
      if (insertIndex > folderIndex) {
        adjustedInsertIndex = insertIndex - 1;
      }
      
      if (adjustedInsertIndex !== folderIndex && adjustedInsertIndex >= 0 && adjustedInsertIndex <= newItems.length) {
        newItems.splice(adjustedInsertIndex, 0, draggedFolder);
        
        // Atualização OTIMISTA (imediata)
        setRundown({ ...rundown, items: newItems });
        
        // Debounce para sincronização (após 100ms)
        updateTimeoutRef.current = setTimeout(() => {
          if (rundown?.id) {
            syncFolderReorder(String(rundown.id), newItems);
          }
          setIsUpdating(false);
        }, 100);
      } else {
        setIsUpdating(false);
      }
    }
    
    // Similar para itens...
  }
  
  setIsDragging(false);
  setDraggedItem(null);
  setDragOverIndex(-1);
  setDropIndicator({ show: false, index: -1, type: null, folderIndex: null });
};

// Adicionar cleanup
useEffect(() => {
  return () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
  };
}, []);
```

**Mudanças no `RundownContext.jsx`:**

```javascript
// Adicionar flag global para bloquear atualizações
let isLocalUpdate = false;

// Nos listeners, verificar antes de atualizar
const handleItemReordered = (event) => {
  const { rundownId, folderIndex, newOrder } = event.detail;
  
  // IGNORA se for atualização local
  if (isLocalUpdate) return;
  
  if (String(activeRundown?.id) === String(rundownId)) {
    const newRundown = { ...activeRundown };
    newRundown.items[folderIndex].children = newOrder;
    setActiveRundown(newRundown);
  }
};

// Exportar função para marcar como local
const markAsLocalUpdate = (callback) => {
  isLocalUpdate = true;
  callback();
  setTimeout(() => { isLocalUpdate = false; }, 150);
};
```

### Vantagens:
- ✅ UI responsiva instantaneamente
- ✅ Sincronização suave sem conflitos
- ✅ Funciona com múltiplos clientes

### Desvantagens:
- ⚠️ Risco mínimo de estado inconsistent em caso de erro de rede
- ⚠️ Precisa gerenciar rollback em caso de falha

---

## ALTERNATIVA 2: Ref-based State Management (Mais Simples)

### Conceito:
Usar `useRef` para manter estado local durante drag e só aplicar no WebSocket após soltar.

### Implementação:

**Mudanças no `OperatorView.jsx`:**

```javascript
import { useRef } from 'react';

const OperatorView = () => {
  // Referência para estado local durante drag
  const localRundownRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // Sincroniza ref com estado quando muda
  useEffect(() => {
    localRundownRef.current = rundown;
  }, [rundown]);
  
  const handleDragStart = (event, info, item, folderIndex, itemIndex) => {
    isDraggingRef.current = true;
    setDraggedItem({ type: 'item', data: item, folderIndex, itemIndex });
    setIsDragging(true);
  };
  
  const handleDragEnd = (event, info) => {
    isDraggingRef.current = false;
    
    if (draggedItem && dropIndicator.show) {
      // Usa ref em vez de state direto
      const currentRundown = localRundownRef.current;
      
      if (type === 'folder' && dropIndicator.type === 'folder') {
        const insertIndex = dropIndicator.index;
        const newItems = [...currentRundown.items];
        const draggedFolder = newItems.splice(folderIndex, 1)[0];
        
        let adjustedInsertIndex = insertIndex;
        if (insertIndex > folderIndex) {
          adjustedInsertIndex = insertIndex - 1;
        }
        
        if (adjustedInsertIndex !== folderIndex && adjustedInsertIndex >= 0 && adjustedInsertIndex <= newItems.length) {
          newItems.splice(adjustedInsertIndex, 0, draggedFolder);
          
          // Sincronização ÚNICA via WebSocket
          if (currentRundown?.id) {
            syncFolderReorder(String(currentRundown.id), newItems);
          }
        }
      }
      
      // Similar para itens...
    }
    
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverIndex(-1);
    setDropIndicator({ show: false, index: -1, type: null, folderIndex: null });
  };
  
  // Bloquear renderizações durante drag
  const effectiveRundown = isDraggingRef.current ? localRundownRef.current : rundown;
};
```

**Mudanças no `RundownContext.jsx`:**

```javascript
// Usar ref para check rápido
const rundownRef = useRef(activeRundown);
const isDraggingRef = useRef(false);

useEffect(() => {
  rundownRef.current = activeRundown;
}, [activeRundown]);

const handleItemReordered = (event) => {
  const { rundownId, folderIndex, newOrder } = event.detail;
  
  // Skip se estiver arrastando
  if (isDraggingRef.current) return;
  
  if (String(activeRundown?.id) === String(rundownId)) {
    const newRundown = { ...activeRundown };
    newRundown.items[folderIndex].children = newOrder;
    setActiveRundown(newRundown);
  }
};

// Exportar função para set dragging
const setIsDragging = (value) => {
  isDraggingRef.current = value;
};
```

### Vantagens:
- ✅ Implementação simples
- ✅ Performance melhor (sem re-render excessivo)
- ✅ Estado consistente garantido

### Desvantagens:
- ⚠️ Precisa gerenciar refs em múltiplos lugares
- ⚠️ UI pode não atualizar instantaneamente durante drag

---

## ALTERNATIVA 3: Custom Drag Controller Hook (Mais Robusta)

### Conceito:
Isolar toda lógica de drag em hook customizado que gerencia estado independente.

### Implementação:

**Criar `src/hooks/useDragAndDrop.js`:**

```javascript
import { useState, useRef, useCallback } from 'react';

export const useDragAndDrop = (rundown, syncFolderReorder, syncItemReorder) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropIndicator, setDropIndicator] = useState({ 
    show: false, 
    index: -1, 
    type: null, 
    folderIndex: null 
  });
  
  // Estado isolado para operações de drag
  const dragStateRef = useRef({
    rundown: null,
    isLocked: false
  });
  
  // Sincroniza quando rundown muda
  useState(() => {
    if (!dragStateRef.current.isLocked) {
      dragStateRef.current.rundown = rundown;
    }
  }, [rundown]);
  
  const handleDragStart = useCallback((type, item, folderIndex, itemIndex = null) => {
    dragStateRef.current.isLocked = true;
    dragStateRef.current.rundown = rundown;
    setDraggedItem({ type, data: item, folderIndex, itemIndex });
    setIsDragging(true);
  }, [rundown]);
  
  const handleDragEnd = useCallback((dropIndicator) => {
    if (!draggedItem || !dropIndicator.show) {
      dragStateRef.current.isLocked = false;
      setIsDragging(false);
      setDraggedItem(null);
      return;
    }
    
    const { type, folderIndex, itemIndex } = draggedItem;
    const currentRundown = dragStateRef.current.rundown;
    
    try {
      if (type === 'folder' && dropIndicator.type === 'folder') {
        const insertIndex = dropIndicator.index;
        const newItems = [...currentRundown.items];
        const draggedFolder = newItems.splice(folderIndex, 1)[0];
        
        let adjustedInsertIndex = insertIndex;
        if (insertIndex > folderIndex) {
          adjustedInsertIndex = insertIndex - 1;
        }
        
        if (adjustedInsertIndex !== folderIndex && 
            adjustedInsertIndex >= 0 && 
            adjustedInsertIndex <= newItems.length) {
          newItems.splice(adjustedInsertIndex, 0, draggedFolder);
          
          // Sincronização única
          if (currentRundown?.id) {
            syncFolderReorder(String(currentRundown.id), newItems);
          }
        }
      } else if (type === 'item' && dropIndicator.type === 'item') {
        // Lógica similar para itens...
      }
    } finally {
      // Sempre libera o lock
      dragStateRef.current.isLocked = false;
      setIsDragging(false);
      setDraggedItem(null);
    }
  }, [draggedItem, syncFolderReorder, syncItemReorder]);
  
  return {
    draggedItem,
    isDragging,
    dropIndicator,
    setDropIndicator,
    handleDragStart,
    handleDragEnd,
    // Rundown estável durante drag
    effectiveRundown: dragStateRef.current.rundown || rundown
  };
};
```

**Usar no `OperatorView.jsx`:**

```javascript
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

const OperatorView = () => {
  // ... imports e outros hooks
  
  const dragAndDrop = useDragAndDrop(
    rundown, 
    syncFolderReorder, 
    syncItemReorder
  );
  
  // Usar dragAndDrop.* em vez de estados locais
  // Por exemplo:
  // dragAndDrop.draggedItem
  // dragAndDrop.handleDragStart
  // etc.
  
  const effectiveRundown = dragAndDrop.effectiveRundown;
  
  // Usar effectiveRundown no render
  return (
    <div>
      {effectiveRundown.items.map((folder, fIndex) => {
        // ...
      })}
    </div>
  );
};
```

**Mudanças no `RundownContext.jsx`:**

```javascript
// Adicionar listener para ignorar updates durante drag
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

const RundownProvider = ({ children }) => {
  // ... código existente
  
  const handleItemReordered = (event) => {
    const { rundownId, folderIndex, newOrder } = event.detail;
    
    // Checagem extra de timing
    const recentUpdate = performance.now() - lastReorderTime;
    if (recentUpdate < 200) {
      return; // Ignora updates muito recentes
    }
    lastReorderTime = performance.now();
    
    if (String(activeRundown?.id) === String(rundownId)) {
      const newRundown = { ...activeRundown };
      newRundown.items[folderIndex].children = newOrder;
      setActiveRundown(newRundown);
    }
  };
};
```

### Vantagens:
- ✅ Código reutilizável
- ✅ Lógica isolada e testável
- ✅ Easy to debug
- ✅ Previne race conditions

### Desvantagens:
- ⚠️ Requer refactor maior
- ⚠️ Mais complexidade inicial

---

## Recomendação Final

**Prefira a ALTERNATIVA 1** (Optimistic Updates) porque:
1. ✅ Menos invasiva (mudanças mínimas)
2. ✅ Mantém responsividade da UI
3. ✅ Fácil de implementar
4. ✅ Funciona bem com múltiplos clientes

**Use a ALTERNATIVA 2** se precisar de performance máxima

**Use a ALTERNATIVA 3** se planejar mais features de drag no futuro

