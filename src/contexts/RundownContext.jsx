import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/components/ui/use-toast';
import { useTimer } from '@/contexts/TimerContext.jsx';
import { useSync } from '@/contexts/SyncContext.jsx';

const RundownContext = createContext();

export const useRundown = () => useContext(RundownContext);

// Ref global para bloquear atualizações WebSocket durante drag
const isDraggingRef = { current: false };


export const RundownProvider = ({ children }) => {
  const [rundowns, setRundowns] = useState([]);
  const { token } = useContext(AuthContext);
  const { apiCall } = useApi();

  const fetchRundowns = useCallback(() => {
    if (!token) {
      // Sem token, não tenta listar (evita 401 e loops de refresh)
      return;
    }
    apiCall('/api/rundowns')
      .then(async (res) => {
        if (!res.ok) {
          // 401 geralmente significa token ausente/expirado
          const txt = await res.text().catch(() => '');
          console.warn('Falha ao listar rundowns:', res.status, txt);
          setRundowns([]);
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.rundowns) setRundowns(data.rundowns);
      })
      .catch((err) => {
        console.error('Erro ao buscar rundowns:', err);
        setRundowns([]);
      });
  }, [apiCall, token]);

  useEffect(() => {
    fetchRundowns();
  }, [fetchRundowns]);

  // Recarrega a lista quando houver mudança via WebSocket
  useEffect(() => {
    const handler = () => fetchRundowns();
    window.addEventListener('rundownListChanged', handler);
    return () => window.removeEventListener('rundownListChanged', handler);
  }, [fetchRundowns]);

  const [activeRundown, setActiveRundown] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState({ folderIndex: 0, itemIndex: 0 });
  const { timeElapsed, setTimeElapsed, isTimerRunning, setIsTimerRunning } = useTimer();
  const { toast } = useToast();
  const { syncRundownUpdate, syncItemReorder, syncFolderReorder, syncTimerState } = useSync();
  
  const rundownRef = useRef(activeRundown);
  const indexRef = useRef(currentItemIndex);

  useEffect(() => {
    rundownRef.current = activeRundown;
  }, [activeRundown]);

  useEffect(() => {
    indexRef.current = currentItemIndex;
  }, [currentItemIndex]);

  const calculateElapsedTimeForIndex = useCallback((targetFolderIndex, targetItemIndex, items) => {
    let elapsed = 0;
    if (!items) return 0;
    for (let f = 0; f < items.length; f++) {
      for (let i = 0; i < items[f].children.length; i++) {
        if (f < targetFolderIndex || (f === targetFolderIndex && i < targetItemIndex)) {
          elapsed += items[f].children[i].duration;
        } else {
          return elapsed;
        }
      }
    }
    return elapsed;
  }, []);

  // Listeners para sincronização em tempo real via WebSocket
  useEffect(() => {
    console.log('🔄 RundownContext inicializado');

    // Listener para atualizações de rundown
    const handleRundownSync = (event) => {
      const { rundownId, changes } = event.detail;
      console.log('📡 RundownContext: Recebida atualização via WebSocket:', { rundownId, changes });
      
      if (String(activeRundown?.id) === String(rundownId)) {
        // Aplica as mudanças ao rundown ativo
        if (changes.currentItemIndex) {
          setCurrentItemIndex(changes.currentItemIndex);
          const newElapsedTime = calculateElapsedTimeForIndex(
            changes.currentItemIndex.folderIndex, 
            changes.currentItemIndex.itemIndex, 
            activeRundown.items
          );
          setTimeElapsed(newElapsedTime);
        }
        
        if (changes.isRunning !== undefined) {
          setIsTimerRunning(changes.isRunning);
        }
        
        if (changes.timeElapsed !== undefined) {
          setTimeElapsed(changes.timeElapsed);
        }
        
        // Sincroniza mudanças na estrutura do rundown (adicionar/remover itens)
        if (changes.items) {
          console.log('📡 RundownContext: Atualizando estrutura do rundown:', changes.items);
          setActiveRundown(prev => ({ ...prev, items: changes.items }));
        }
      }
    };

    // Listener para reordenação de itens
    const handleItemReordered = (event) => {
      const { rundownId, folderIndex, newOrder } = event.detail;
      
      // Ignora atualizações durante drag para evitar conflitos
      if (isDraggingRef.current) return;
      
      if (String(activeRundown?.id) === String(rundownId)) {
        const newRundown = { ...activeRundown };
        newRundown.items[folderIndex].children = newOrder;
        setActiveRundown(newRundown);
      }
    };

    // Listener para reordenação de pastas
    const handleFolderReordered = (event) => {
      const { rundownId, newOrder } = event.detail;
      
      // Ignora atualizações durante drag para evitar conflitos
      if (isDraggingRef.current) return;
      
      if (String(activeRundown?.id) === String(rundownId)) {
        const newRundown = { ...activeRundown };
        newRundown.items = newOrder;
        setActiveRundown(newRundown);
      }
    };

    // Registra os listeners
    window.addEventListener('rundownSync', handleRundownSync);
    window.addEventListener('itemReordered', handleItemReordered);
    window.addEventListener('folderReordered', handleFolderReordered);

    return () => {
      window.removeEventListener('rundownSync', handleRundownSync);
      window.removeEventListener('itemReordered', handleItemReordered);
      window.removeEventListener('folderReordered', handleFolderReordered);
    };
  }, [activeRundown, calculateElapsedTimeForIndex, setTimeElapsed, setIsTimerRunning]);

  // Funções de sincronização - declaradas antes de serem usadas
  const syncCurrentItemChange = useCallback((newItemIndex) => {
    console.log('🔄 Sincronizando mudança de item:', newItemIndex);
    if (activeRundown?.id) {
      // Sincroniza mudança de item atual via WebSocket
      syncRundownUpdate(activeRundown.id, { currentItemIndex: newItemIndex });
    }
  }, [activeRundown?.id, syncRundownUpdate]);

  const handleSetCurrentItem = useCallback((folderIndex, itemIndex) => {
    const rundown = rundownRef.current;
    if (!rundown) return;
    const newElapsedTime = calculateElapsedTimeForIndex(folderIndex, itemIndex, rundown.items);
    setTimeElapsed(newElapsedTime);
    setCurrentItemIndex({ folderIndex, itemIndex });
    
    // Sincroniza a mudança de item com outros clientes
    syncCurrentItemChange({ folderIndex, itemIndex });
  }, [calculateElapsedTimeForIndex, setTimeElapsed, syncCurrentItemChange]);

  const handleNextItem = useCallback(() => {
    const rundown = rundownRef.current;
    const { folderIndex, itemIndex } = indexRef.current;
    if (!rundown) return;
    
    const currentFolder = rundown.items[folderIndex];
    if (!currentFolder) return;

    let nextFolderIndex = folderIndex;
    let nextItemIndex = itemIndex + 1;

    if (nextItemIndex >= currentFolder.children.length) {
      nextFolderIndex++;
      nextItemIndex = 0;
    }

    if (nextFolderIndex < rundown.items.length && rundown.items[nextFolderIndex]?.children.length > 0) {
      handleSetCurrentItem(nextFolderIndex, nextItemIndex);
    } else {
      toast({ title: "🏁 Fim do Rundown" });
      setIsTimerRunning(false);
    }
  }, [handleSetCurrentItem, toast, setIsTimerRunning]);

  const loadRundownState = useCallback((rundownId) => {
    const rundownData = rundowns.find(p => p.id === rundownId);
    if (!rundownData) {
      return null;
    }

    try {
      const savedRundown = localStorage.getItem(`rundownState_${rundownId}`);
      const savedIndex = localStorage.getItem(`currentItemIndex_${rundownId}`);
      const savedIsRunning = localStorage.getItem(`isRunning_${rundownId}`);
      const savedTime = localStorage.getItem(`timeElapsed_${rundownId}`);

      const rundownToLoad = savedRundown ? JSON.parse(savedRundown) : rundownData;
      setActiveRundown(rundownToLoad);
      setCurrentItemIndex(savedIndex ? JSON.parse(savedIndex) : { folderIndex: 0, itemIndex: 0 });
      const running = savedIsRunning ? JSON.parse(savedIsRunning) : false;
      setIsTimerRunning(running);
      setTimeElapsed(savedTime ? JSON.parse(savedTime) : 0);
      
      console.log('🔄 Rundown carregado:', rundownId);
    } catch (error) {
      console.error("Failed to load rundown state from localStorage", error);
      setActiveRundown(rundownData);
      setCurrentItemIndex({ folderIndex: 0, itemIndex: 0 });
      setIsTimerRunning(false);
      setTimeElapsed(0);
    }
    return rundownData;
  }, [rundowns, setTimeElapsed, setIsTimerRunning]);

  const handleCreateRundown = async (newRundownData) => {
    const payload = {
      ...newRundownData,
      created: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      status: 'Novo',
      duration: '0',
      teamMembers: 1
    };
    try {
      const res = await apiCall('/api/rundowns', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Erro ao criar rundown');
      toast({
        title: "🎉 Rundown Criado!",
        description: `O rundown "${payload.name}" foi adicionado com sucesso.`,
      });
      fetchRundowns();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar rundown',
        description: err.message
      });
    }
  };

  const handleUpdateRundown = async (rundownId, updatedData) => {
    const payload = {
      ...updatedData,
      lastModified: new Date().toISOString().split('T')[0]
    };
    try {
      const res = await apiCall(`/api/rundowns/${rundownId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Erro ao atualizar rundown');
      toast({
        title: "💾 Rundown Atualizado!",
        description: `O rundown "${updatedData.name}" foi salvo.`,
      });
      fetchRundowns();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar rundown',
        description: err.message
      });
    }
  };

  const handleDeleteRundown = async (rundownId) => {
    const rundownToDelete = rundowns.find(r => r.id === rundownId);
    if (!rundownToDelete) return;
    try {
      // IDs locais (string) não existem no backend: remove localmente
      if (isNaN(Number(rundownId))) {
        setRundowns(prev => prev.filter(r => r.id !== rundownId));
      } else {
        const res = await apiCall(`/api/rundowns/${rundownId}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Erro ao deletar rundown');
      }
      localStorage.removeItem(`rundownState_${rundownId}`);
      localStorage.removeItem(`currentItemIndex_${rundownId}`);
      localStorage.removeItem(`isRunning_${rundownId}`);
      localStorage.removeItem(`timeElapsed_${rundownId}`);
      if (activeRundown?.id === rundownId) {
        setActiveRundown(null);
        setIsTimerRunning(false);
        setTimeElapsed(0);
      }
      toast({
        variant: "destructive",
        title: "🗑️ Rundown Deletado!",
        description: `O rundown "${rundownToDelete.name}" foi removido.`,
      });
      fetchRundowns();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar rundown',
        description: err.message
      });
    }
  };

  const handleDownloadTemplate = async (template) => {
    await handleCreateRundown({ name: template.name, type: template.category });
    fetchRundowns();
    toast({ title: '✅ Importado', description: `${template.name} foi importado para Meus Rundowns.` });
  };

  // Funções de sincronização - agora usam o SyncContext real
  const syncRundownUpdateLocal = useCallback((rundownId, changes) => {
    console.log('🔄 Sincronizando mudanças:', { rundownId, changes });
    syncRundownUpdate(rundownId, changes);
  }, [syncRundownUpdate]);

  const syncItemReorderLocal = useCallback((rundownId, folderIndex, newOrder) => {
    console.log('🔄 Sincronizando reordenação de itens:', { rundownId, folderIndex, newOrder });
    syncItemReorder(rundownId, folderIndex, newOrder);
  }, [syncItemReorder]);

  const syncFolderReorderLocal = useCallback((rundownId, newOrder) => {
    console.log('🔄 Sincronizando reordenação de pastas:', { rundownId, newOrder });
    syncFolderReorder(rundownId, newOrder);
  }, [syncFolderReorder]);

  const syncTimerStateLocal = useCallback((isRunning, timeElapsed, currentItemIndex) => {
    console.log('🔄 Sincronizando estado do timer:', { isRunning, timeElapsed, currentItemIndex });
    syncTimerState(isRunning, timeElapsed, currentItemIndex);
  }, [syncTimerState]);

  const value = {
    rundowns,
    setRundowns,
    activeRundown,
    setActiveRundown,
    currentItemIndex,
    setCurrentItemIndex: handleSetCurrentItem,
    isRunning: isTimerRunning,
    setIsRunning: setIsTimerRunning,
    handleNextItem,
    loadRundownState,
    handleCreateRundown,
    handleUpdateRundown,
    handleDeleteRundown,
    handleDownloadTemplate,
    calculateElapsedTimeForIndex,
    syncRundownUpdate: syncRundownUpdateLocal,
    syncItemReorder: syncItemReorderLocal,
    syncFolderReorder: syncFolderReorderLocal,
    syncTimerState: syncTimerStateLocal,
    syncCurrentItemChange,
    isDraggingRef, // Exporta ref para controle de drag
  };

  useEffect(() => {
    try {
      localStorage.setItem('rundownProjects', JSON.stringify(rundowns));
    } catch (error) {
      console.error("Failed to save rundowns to localStorage", error);
    }
  }, [rundowns]);

  useEffect(() => {
    if (activeRundown) {
      try {
        localStorage.setItem(`rundownState_${activeRundown.id}`, JSON.stringify(activeRundown));
        localStorage.setItem(`currentItemIndex_${activeRundown.id}`, JSON.stringify(currentItemIndex));
        localStorage.setItem(`isRunning_${activeRundown.id}`, JSON.stringify(isTimerRunning));
        localStorage.setItem(`timeElapsed_${activeRundown.id}`, JSON.stringify(timeElapsed));
      } catch (error) {
        console.error("Failed to save rundown state to localStorage", error);
      }
    }
  }, [activeRundown, currentItemIndex, isTimerRunning, timeElapsed]);

  useEffect(() => {
    const checkTime = () => {
      if (!isTimerRunning) return;
      
      const rundown = rundownRef.current;
      const { folderIndex, itemIndex } = indexRef.current;
      
      if (!rundown) return;
      
      const currentItem = rundown.items[folderIndex]?.children[itemIndex];
      if (!currentItem) return;

      const itemStartTime = calculateElapsedTimeForIndex(folderIndex, itemIndex, rundown.items);
      const itemEndTime = itemStartTime + currentItem.duration;

      if (timeElapsed >= itemEndTime) {
        handleNextItem();
      }
    };
    
    checkTime();
  }, [timeElapsed, isTimerRunning, calculateElapsedTimeForIndex, handleNextItem]);

  // Sincronização simplificada
  useEffect(() => {
    console.log('🔄 Timer state changed:', { isTimerRunning, timeElapsed, currentItemIndex });
  }, [isTimerRunning, timeElapsed, currentItemIndex]);

  return (
    <RundownContext.Provider value={value}>
      {children}
    </RundownContext.Provider>
  );
};