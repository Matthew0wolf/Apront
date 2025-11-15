import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/components/ui/use-toast';
import { useTimer } from '@/contexts/TimerContext.jsx';
import { useSync } from '@/contexts/SyncContext.jsx';

const RundownContext = createContext();

export const useRundown = () => useContext(RundownContext);

// Ref global para bloquear atualizações WebSocket durante drag
export const isDraggingRef = { current: false };


export const RundownProvider = ({ children }) => {
  const [rundowns, setRundowns] = useState([]);
  const { token } = useContext(AuthContext);
  const { apiCall } = useApi();

  const fetchRundowns = useCallback((forceRefresh = false) => {
    if (!token) {
      // Sem token, não tenta listar (evita 401 e loops de refresh)
      return;
    }
    
    // Adiciona parâmetro para forçar refresh e ignorar cache
    const url = forceRefresh ? '/api/rundowns?force_refresh=true' : '/api/rundowns';
    
    apiCall(url)
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
        if (data && data.rundowns) {
          console.log(`📋 Carregados ${data.rundowns.length} rundowns${forceRefresh ? ' (forçado refresh)' : ''}`);
          setRundowns(data.rundowns);
        } else {
          console.warn('⚠️ Nenhum rundown retornado do servidor');
          setRundowns([]);
        }
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
    const handler = () => {
      console.log('📡 Evento rundownListChanged recebido, recarregando lista...');
      fetchRundowns(true); // Força refresh ao receber evento WebSocket
    };
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
      console.log('📡 RundownContext: activeRundown?.id:', activeRundown?.id);
      console.log('📡 RundownContext: Comparação:', String(activeRundown?.id), '===', String(rundownId));
      
      if (String(activeRundown?.id) === String(rundownId)) {
        console.log('✅ RundownContext: Aplicando mudanças ao rundown ativo');
        // Aplica as mudanças ao rundown ativo
        if (changes.currentItemIndex) {
          console.log('✅ RundownContext: Atualizando currentItemIndex:', changes.currentItemIndex);
          setCurrentItemIndex(changes.currentItemIndex);
          const newElapsedTime = calculateElapsedTimeForIndex(
            changes.currentItemIndex.folderIndex, 
            changes.currentItemIndex.itemIndex, 
            activeRundown.items
          );
          setTimeElapsed(newElapsedTime);
          console.log('✅ RundownContext: currentItemIndex atualizado e timeElapsed:', newElapsedTime);
        } else {
          console.log('⚠️ RundownContext: changes.currentItemIndex não encontrado');
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
    console.log('🔄 RundownContext: Sincronizando mudança de item:', newItemIndex);
    console.log('🔄 RundownContext: activeRundown?.id:', activeRundown?.id);
    if (activeRundown?.id) {
      // Sincroniza mudança de item atual via WebSocket
      const changes = { currentItemIndex: newItemIndex };
      console.log('🔄 RundownContext: Enviando syncRundownUpdate com:', { rundownId: activeRundown.id, changes });
      syncRundownUpdate(activeRundown.id, changes);
    } else {
      console.warn('⚠️ RundownContext: activeRundown?.id não disponível para sincronização');
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
    // Converte rundownId para string para comparação
    const rundownIdStr = String(rundownId);
    console.log('🔄 loadRundownState: Carregando rundown:', rundownIdStr);
    console.log('🔄 loadRundownState: Rundowns disponíveis:', rundowns.map(r => ({ id: String(r.id), name: r.name })));
    
    // Se não houver rundowns carregados ainda, tenta recarregar
    if (rundowns.length === 0) {
      console.warn('⚠️ loadRundownState: Nenhum rundown carregado ainda, tentando recarregar...');
      fetchRundowns();
      return null;
    }
    
    // Busca o rundown correto (compara como string)
    const rundownData = rundowns.find(p => String(p.id) === rundownIdStr);
    if (!rundownData) {
      console.error('❌ loadRundownState: Rundown não encontrado:', rundownIdStr);
      console.error('❌ loadRundownState: Tentando recarregar rundowns...');
      // Tenta recarregar rundowns uma vez
      fetchRundowns();
      return null;
    }

    console.log('✅ loadRundownState: Rundown encontrado:', { id: rundownData.id, name: rundownData.name });

    try {
      const savedRundown = localStorage.getItem(`rundownState_${rundownIdStr}`);
      const savedIndex = localStorage.getItem(`currentItemIndex_${rundownIdStr}`);
      const savedIsRunning = localStorage.getItem(`isRunning_${rundownIdStr}`);
      const savedTime = localStorage.getItem(`timeElapsed_${rundownIdStr}`);

      // SEMPRE usa o rundownData do servidor (mais atualizado)
      // localStorage só é usado para estado (índice, tempo, etc), não para dados do rundown
      setActiveRundown(rundownData);
      
      // Carrega estado do localStorage se existir
      if (savedIndex) {
        try {
          const parsedIndex = JSON.parse(savedIndex);
          setCurrentItemIndex(parsedIndex);
          console.log('✅ loadRundownState: Índice carregado do localStorage:', parsedIndex);
        } catch (e) {
          console.warn('⚠️ loadRundownState: Erro ao parsear índice, usando padrão');
          setCurrentItemIndex({ folderIndex: 0, itemIndex: 0 });
        }
      } else {
        setCurrentItemIndex({ folderIndex: 0, itemIndex: 0 });
      }
      
      const running = savedIsRunning ? JSON.parse(savedIsRunning) : false;
      setIsTimerRunning(running);
      setTimeElapsed(savedTime ? JSON.parse(savedTime) : 0);
      
      console.log('✅ loadRundownState: Rundown carregado com sucesso:', { id: rundownData.id, name: rundownData.name });
    } catch (error) {
      console.error("❌ loadRundownState: Erro ao carregar estado:", error);
      // Em caso de erro, sempre usa dados do servidor
      setActiveRundown(rundownData);
      setCurrentItemIndex({ folderIndex: 0, itemIndex: 0 });
      setIsTimerRunning(false);
      setTimeElapsed(0);
    }
    return rundownData;
  }, [rundowns, setTimeElapsed, setIsTimerRunning, fetchRundowns]);

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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao criar rundown');
      }
      
      toast({
        title: "🎉 Rundown Criado!",
        description: `O rundown "${payload.name}" foi adicionado com sucesso.`,
      });
      
      // Força recarregar a lista ignorando cache
      // Isso garante que o novo rundown apareça imediatamente
      fetchRundowns(true); // forceRefresh = true
      setTimeout(() => {
        fetchRundowns(true); // Força refresh novamente após delay
      }, 500);
    } catch (err) {
      console.error('Erro ao criar rundown:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar rundown',
        description: err.message || 'Não foi possível criar o rundown. Tente novamente.'
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
    const rundownToDelete = rundowns.find(r => String(r.id) === String(rundownId));
    if (!rundownToDelete) {
      // Se não encontrou, pode já ter sido deletado - recarrega lista e retorna silenciosamente
      console.log(`[DELETE] Rundown ${rundownId} não encontrado na lista local, recarregando...`);
      fetchRundowns();
      return;
    }
    
    // Remove imediatamente da lista local (atualização otimista)
    setRundowns(prev => prev.filter(r => String(r.id) !== String(rundownId)));
    
    try {
      // IDs locais (string) não existem no backend: remove localmente
      if (isNaN(Number(rundownId))) {
        // Já removido acima, apenas limpa localStorage
        console.log(`[DELETE] Rundown ${rundownId} é ID local, removendo apenas do localStorage`);
      } else {
        const res = await apiCall(`/api/rundowns/${rundownId}`, {
          method: 'DELETE'
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
          
          // Se for 404, o rundown já foi deletado (pode ter sido deletado por outro usuário)
          // Nesse caso, apenas recarrega a lista e não mostra erro
          if (res.status === 404) {
            console.log(`[DELETE] Rundown ${rundownId} já foi deletado (404), recarregando lista...`);
            fetchRundowns();
            // Limpa localStorage mesmo assim
            localStorage.removeItem(`rundownState_${rundownId}`);
            localStorage.removeItem(`currentItemIndex_${rundownId}`);
            localStorage.removeItem(`isRunning_${rundownId}`);
            localStorage.removeItem(`timeElapsed_${rundownId}`);
            
            // Se era o rundown ativo, limpa estado
            if (String(activeRundown?.id) === String(rundownId)) {
              setActiveRundown(null);
              setIsTimerRunning(false);
              setTimeElapsed(0);
            }
            return; // Retorna silenciosamente, não mostra erro
          }
          
          // Para outros erros, recarrega lista e mostra erro
          console.error(`[DELETE] Erro ao deletar rundown ${rundownId}:`, res.status, errorData);
          fetchRundowns();
          throw new Error(errorData.error || 'Erro ao deletar rundown');
        }
      }
      
      // Limpa localStorage
      localStorage.removeItem(`rundownState_${rundownId}`);
      localStorage.removeItem(`currentItemIndex_${rundownId}`);
      localStorage.removeItem(`isRunning_${rundownId}`);
      localStorage.removeItem(`timeElapsed_${rundownId}`);
      
      // Se era o rundown ativo, limpa estado
      if (String(activeRundown?.id) === String(rundownId)) {
        setActiveRundown(null);
        setIsTimerRunning(false);
        setTimeElapsed(0);
      }
      
      toast({
        variant: "destructive",
        title: "🗑️ Rundown Deletado!",
        description: `O rundown "${rundownToDelete.name}" foi removido.`,
      });
      
      // Recarrega do servidor para garantir sincronização
      fetchRundowns();
    } catch (err) {
      // Se der erro (exceto 404 que já foi tratado), recarrega a lista e mostra erro
      console.error(`[DELETE] Erro ao deletar rundown ${rundownId}:`, err);
      fetchRundowns();
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar rundown',
        description: err.message || 'Não foi possível deletar o rundown. Tente novamente.'
      });
    }
  };

  const handleDownloadTemplate = async (template) => {
    try {
      await handleCreateRundown({ name: template.name, type: template.category });
      // Força recarregar a lista após importar (ignorando cache)
      fetchRundowns(true); // forceRefresh = true
      setTimeout(() => {
        fetchRundowns(true); // Força refresh novamente após delay
      }, 500);
      toast({ title: '✅ Importado', description: `${template.name} foi importado para Meus Rundowns.` });
    } catch (err) {
      console.error('Erro ao importar template:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao importar template',
        description: err.message || 'Não foi possível importar o template.'
      });
    }
  };

  const handleUpdateRundownMembers = async (rundownId, members) => {
    try {
      console.log(`[UPDATE MEMBERS] Atualizando membros do rundown ${rundownId}:`, members);
      
      const res = await apiCall(`/api/rundowns/${rundownId}/members`, {
        method: 'PATCH',
        body: JSON.stringify({ members })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error(`[UPDATE MEMBERS] Erro ${res.status}:`, errorData);
        throw new Error(errorData.error || 'Erro ao atualizar membros');
      }
      
      const result = await res.json().catch(() => ({}));
      console.log(`[UPDATE MEMBERS] Sucesso:`, result);
      
      toast({
        title: "✅ Equipe Atualizada!",
        description: `Os membros do rundown foram atualizados. ${result.members_count || members.length} membro(s) agora têm acesso.`,
      });
      
      // Força recarregar a lista ignorando cache
      // Isso garante que usuários removidos não vejam mais o rundown
      fetchRundowns(true); // forceRefresh = true
      setTimeout(() => {
        fetchRundowns(true); // Força refresh novamente após delay
      }, 500);
    } catch (err) {
      console.error('[UPDATE MEMBERS] Erro ao atualizar membros:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar membros',
        description: err.message || 'Não foi possível atualizar os membros do rundown.'
      });
    }
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
    handleUpdateRundownMembers,
    handleDownloadTemplate,
    calculateElapsedTimeForIndex,
    syncRundownUpdate: syncRundownUpdateLocal,
    syncItemReorder: syncItemReorderLocal,
    syncFolderReorder: syncFolderReorderLocal,
    syncTimerState: syncTimerStateLocal,
    syncCurrentItemChange,
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
        // NÃO salva o rundown completo no localStorage para evitar dados desatualizados
        // localStorage só deve salvar estado (índice, tempo, etc), não dados do rundown
        // localStorage.setItem(`rundownState_${activeRundown.id}`, JSON.stringify(activeRundown));
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
