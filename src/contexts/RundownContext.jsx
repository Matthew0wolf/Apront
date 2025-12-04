import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/components/ui/use-toast';
import { useTimer } from '@/contexts/TimerContext.jsx';
import { useSync } from '@/contexts/SyncContext.jsx';
import { API_BASE_URL } from '@/config/api';

const RundownContext = createContext();

export const useRundown = () => useContext(RundownContext);

// Ref global para bloquear atualizações WebSocket durante drag
export const isDraggingRef = { current: false };

// Disponibiliza globalmente para acesso em outros contextos
if (typeof window !== 'undefined') {
  window.isDraggingRef = isDraggingRef;
}


export const RundownProvider = ({ children }) => {
  const [rundowns, setRundowns] = useState([]);
  const { token } = useContext(AuthContext);
  const { apiCall } = useApi();

  const fetchRundowns = useCallback(async (forceRefresh = false) => {
    if (!token) {
      // Sem token, não tenta listar (evita 401 e loops de refresh)
      return Promise.resolve([]);
    }
    
    // Adiciona parâmetro para forçar refresh e ignorar cache
    const url = forceRefresh ? '/api/rundowns?force_refresh=true' : '/api/rundowns';
    
    try {
      const res = await apiCall(url);
      if (!res.ok) {
        // 401 geralmente significa token ausente/expirado
        const txt = await res.text().catch(() => '');
        console.warn('Falha ao listar rundowns:', res.status, txt);
        setRundowns([]);
        return [];
      }
      const data = await res.json();
      if (data && data.rundowns) {
        console.log(`📋 Carregados ${data.rundowns.length} rundowns${forceRefresh ? ' (forçado refresh)' : ''}`);
        setRundowns(data.rundowns);
        return data.rundowns;
      } else {
        console.warn('⚠️ Nenhum rundown retornado do servidor');
        setRundowns([]);
        return [];
      }
    } catch (err) {
      console.error('Erro ao buscar rundowns:', err);
      setRundowns([]);
      return [];
    }
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
  const pendingUpdatesRef = useRef(new Map()); // Armazena atualizações pendentes por rundownId
  const lastPauseTimeRef = useRef(null); // Armazena timestamp da última pausa para evitar sobrescrita

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
      const rundownIdStr = String(rundownId);
      console.log('📡 RundownContext: Recebida atualização via WebSocket:', { rundownId: rundownIdStr, changes });
      console.log('📡 RundownContext: activeRundown?.id:', activeRundown?.id);
      console.log('📡 RundownContext: Comparação:', String(activeRundown?.id), '===', rundownIdStr);
      
      const isActiveRundown = String(activeRundown?.id) === rundownIdStr;
      const rundownExists = rundowns.some(r => String(r.id) === rundownIdStr);
      
      // CRÍTICO: Verificar se a URL atual corresponde ao rundownId (para sincronização durante carregamento)
      // Isso permite que o apresentador receba atualizações mesmo antes do rundown estar totalmente carregado
      let urlMatchesRundown = false;
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        urlMatchesRundown = currentPath.includes(`/project/${rundownIdStr}/`) || 
                           currentPath.includes(`/project/${rundownIdStr}`);
      }
      
      // CRÍTICO: Sempre aplicar mudanças de isRunning e timeElapsed se for o rundown ativo
      // OU se o rundown existe na lista e não há rundown ativo (está carregando)
      // OU se a URL corresponde ao rundownId (apresentador/operador na página do projeto)
      // Isso garante que o apresentador receba o estado correto ao entrar após o evento estar ao vivo
      // CRÍTICO: Sempre aplicar mudanças de isRunning e timeElapsed quando recebidas via WebSocket
      // Isso garante que quando o operador pausa, o apresentador também pausa
      if (changes.isRunning !== undefined) {
        // CRÍTICO: Sempre aplicar mudanças de isRunning se for o rundown ativo, existe na lista, ou a URL corresponde
        // Não importa se isRunning é true ou false - ambos devem ser sincronizados
        const shouldApplyTimerState = isActiveRundown || rundownExists || urlMatchesRundown;
        
        if (shouldApplyTimerState) {
          console.log('✅ RundownContext: Atualizando isRunning via WebSocket:', changes.isRunning, {
            wasRunning: isTimerRunning,
            willBeRunning: changes.isRunning,
            isActiveRundown,
            rundownExists,
            urlMatchesRundown,
            rundownId: rundownIdStr,
            currentPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
          });
          
          // CRÍTICO: Atualiza imediatamente e registra timestamp se for pausar
          setIsTimerRunning(changes.isRunning);
          if (!changes.isRunning) {
            lastPauseTimeRef.current = Date.now();
            console.log('⏸️ Timer pausado, registro timestamp:', lastPauseTimeRef.current);
          }
          
          // CRÍTICO: Sempre atualizar o tempo decorrido quando fornecido, independentemente de isRunning
          // Isso garante que o tempo correto seja mostrado mesmo quando pausado
          if (changes.timeElapsed !== undefined) {
            console.log('✅ RundownContext: Atualizando timeElapsed via WebSocket:', changes.timeElapsed);
            setTimeElapsed(changes.timeElapsed);
          }
        } else if (rundownExists) {
          // Rundown existe mas ainda não está ativo - armazena atualização pendente
          console.log('⏳ RundownContext: Armazenando atualização pendente de isRunning:', changes.isRunning);
          if (!pendingUpdatesRef.current.has(rundownIdStr)) {
            pendingUpdatesRef.current.set(rundownIdStr, {});
          }
          const pending = pendingUpdatesRef.current.get(rundownIdStr);
          pending.isRunning = changes.isRunning;
          if (changes.timeElapsed !== undefined) {
            pending.timeElapsed = changes.timeElapsed;
          }
        }
      }
      
      // Atualizações de tempo (quando não está rodando)
      if (changes.timeElapsed !== undefined && !changes.isRunning) {
        if (isActiveRundown) {
          setTimeElapsed(changes.timeElapsed);
        }
      }
      
      // CRÍTICO: Atualizar status do rundown se fornecido
      if (changes.status && isActiveRundown && activeRundown) {
        console.log('✅ RundownContext: Atualizando status do rundown:', changes.status);
        setActiveRundown(prev => ({ ...prev, status: changes.status }));
        // Atualizar também na lista de rundowns
        setRundowns(prev => prev.map(r => 
          String(r.id) === rundownIdStr 
            ? { ...r, status: changes.status }
            : r
        ));
      }
      
      // Aplica outras mudanças apenas se for o rundown ativo
      if (isActiveRundown) {
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
        }
        
        // Sincroniza mudanças na estrutura do rundown (adicionar/remover itens)
        if (changes.items && Array.isArray(changes.items)) {
          console.log('📡 RundownContext: Atualizando estrutura do rundown:', changes.items);
          setActiveRundown(prev => ({ ...prev, items: changes.items }));
        } else if (changes.items && !Array.isArray(changes.items)) {
          console.log('⚠️ RundownContext: changes.items não é um array, ignorando atualização:', changes.items);
        }
      }
    };

    // Listener para atualização de IDs (quando backend retorna IDs reais após salvar)
    const handleRundownItemsUpdated = (event) => {
      const { rundownId, items } = event.detail;
      console.log('🔄 RundownContext: Atualizando IDs temporários com IDs reais:', { rundownId, itemsCount: items?.length });
      
      if (String(activeRundown?.id) === String(rundownId) && items && Array.isArray(items)) {
        console.log('✅ RundownContext: Atualizando rundown ativo com IDs reais do banco');
        setActiveRundown(prev => ({ ...prev, items: items }));
        
        // Também atualiza na lista de rundowns
        setRundowns(prev => prev.map(r => 
          String(r.id) === String(rundownId) 
            ? { ...r, items: items }
            : r
        ));
        
        console.log('✅ RundownContext: IDs temporários atualizados com IDs reais');
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
    window.addEventListener('rundownItemsUpdated', handleRundownItemsUpdated);

    return () => {
      window.removeEventListener('rundownSync', handleRundownSync);
      window.removeEventListener('itemReordered', handleItemReordered);
      window.removeEventListener('folderReordered', handleFolderReordered);
      window.removeEventListener('rundownItemsUpdated', handleRundownItemsUpdated);
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
    
    // CRÍTICO: Sincroniza a mudança de item com tempo atualizado com outros clientes
    if (activeRundown?.id) {
      syncTimerState(isTimerRunning, newElapsedTime, { folderIndex, itemIndex }, String(activeRundown.id));
    }
    
    // Também sincroniza apenas a mudança de item
    syncCurrentItemChange({ folderIndex, itemIndex });
  }, [calculateElapsedTimeForIndex, setTimeElapsed, syncCurrentItemChange, activeRundown?.id, isTimerRunning, syncTimerState]);

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

  const loadRundownState = useCallback(async (rundownId) => {
    // Converte rundownId para string para comparação
    const rundownIdStr = String(rundownId);
    console.log('🔄 loadRundownState: Carregando rundown:', rundownIdStr);
    console.log('🔄 loadRundownState: Rundowns disponíveis:', rundowns.map(r => ({ id: String(r.id), name: r.name })));
    
    // Busca o rundown correto (compara como string)
    let rundownData = rundowns.find(p => String(p.id) === rundownIdStr);
    
    // Se não encontrou, tenta buscar diretamente do servidor
    if (!rundownData) {
      console.warn('⚠️ loadRundownState: Rundown não encontrado na lista local, buscando do servidor...');
      try {
        // Força recarregar do servidor
        const updatedRundowns = await fetchRundowns(true);
        // Tenta encontrar no resultado retornado
        rundownData = updatedRundowns.find(p => String(p.id) === rundownIdStr);
        
        if (!rundownData) {
          console.error('❌ loadRundownState: Rundown não encontrado mesmo após buscar do servidor:', rundownIdStr);
          return null;
        }
      } catch (error) {
        console.error('❌ loadRundownState: Erro ao buscar do servidor:', error);
        return null;
      }
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
      
      // CRÍTICO: Busca o estado real do timer do backend
      // Isso garante que todos vejam o mesmo estado, mesmo se o operador sair
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const timerStateResponse = await fetch(`${API_BASE_URL}/api/rundowns/${rundownIdStr}/timer-state`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (timerStateResponse.ok) {
            const timerState = await timerStateResponse.json();
            console.log('✅ loadRundownState: Estado do timer obtido do backend:', timerState);
            
            // CRÍTICO: Verificar se não há uma pausa recente (últimos 10 segundos) antes de aplicar estado do backend
            // Isso evita que o estado pausado seja sobrescrito por um estado desatualizado do backend
            const recentPause = lastPauseTimeRef.current && (Date.now() - lastPauseTimeRef.current) < 10000;
            if (recentPause) {
              // Se houve uma pausa recente, sempre manter o estado local (pausado)
              console.log('⏸️ Pausa recente detectada, mantendo estado pausado local (evita sobrescrita)');
              setIsTimerRunning(false);
            } else {
              // Aplica o estado real do backend apenas se não houver pausa recente
              setIsTimerRunning(timerState.isRunning || false);
            }
            setTimeElapsed(timerState.timeElapsed || 0);
            
            if (timerState.currentItemIndex) {
              setCurrentItemIndex(timerState.currentItemIndex);
            }
            
            console.log(`✅ loadRundownState: Estado aplicado do backend - isRunning: ${timerState.isRunning}, timeElapsed: ${timerState.timeElapsed}`);
          } else {
            // Erro ao buscar estado do timer (500, 404, etc)
            console.warn('⚠️ loadRundownState: Erro ao buscar estado do timer do backend:', timerStateResponse.status);
            
            // CRÍTICO: NÃO iniciar automaticamente - sempre começar pausado
            // Apenas usa valores do localStorage se existirem, senão inicia em 0 e pausado
            const savedIsRunning = localStorage.getItem(`isRunning_${rundownIdStr}`);
            if (savedIsRunning !== null) {
              try {
                setIsTimerRunning(JSON.parse(savedIsRunning));
              } catch (e) {
                setIsTimerRunning(false); // Sempre começar pausado se houver erro
              }
            } else {
              setIsTimerRunning(false); // Sempre começar pausado
            }
            
            setTimeElapsed(savedTime ? JSON.parse(savedTime) : 0);
            console.log('✅ loadRundownState: Timer iniciado como PAUSADO (erro ao buscar do backend)');
          }
        } catch (error) {
          console.warn('⚠️ loadRundownState: Erro ao buscar estado do timer do backend, usando valores locais:', error);
          
          // CRÍTICO: NÃO iniciar automaticamente - sempre começar pausado
          const savedIsRunning = localStorage.getItem(`isRunning_${rundownIdStr}`);
          if (savedIsRunning !== null) {
            try {
              setIsTimerRunning(JSON.parse(savedIsRunning));
            } catch (e) {
              setIsTimerRunning(false); // Sempre começar pausado se houver erro
            }
          } else {
            setIsTimerRunning(false); // Sempre começar pausado
          }
          
          setTimeElapsed(savedTime ? JSON.parse(savedTime) : 0);
          console.log('✅ loadRundownState: Timer iniciado como PAUSADO (erro na requisição)');
        }
      } else {
        // Sem token, sempre começar pausado
        const savedIsRunning = localStorage.getItem(`isRunning_${rundownIdStr}`);
        if (savedIsRunning !== null) {
          try {
            setIsTimerRunning(JSON.parse(savedIsRunning));
          } catch (e) {
            setIsTimerRunning(false);
          }
        } else {
          setIsTimerRunning(false); // Sempre começar pausado
        }
        setTimeElapsed(savedTime ? JSON.parse(savedTime) : 0);
      }
      
      console.log('✅ loadRundownState: Rundown carregado com sucesso:', { id: rundownData.id, name: rundownData.name });
      
      // CRÍTICO: Aplica atualizações pendentes (se houver) após carregar o rundown
      const pendingUpdate = pendingUpdatesRef.current.get(rundownIdStr);
      if (pendingUpdate) {
        console.log('✅ loadRundownState: Aplicando atualizações pendentes:', pendingUpdate);
        if (pendingUpdate.isRunning !== undefined) {
          setIsTimerRunning(pendingUpdate.isRunning);
          console.log('✅ loadRundownState: isRunning atualizado de atualização pendente:', pendingUpdate.isRunning);
        }
        if (pendingUpdate.timeElapsed !== undefined) {
          setTimeElapsed(pendingUpdate.timeElapsed);
          console.log('✅ loadRundownState: timeElapsed atualizado de atualização pendente:', pendingUpdate.timeElapsed);
        }
        // Remove a atualização pendente após aplicar
        pendingUpdatesRef.current.delete(rundownIdStr);
      }
      
      // CRÍTICO: Após carregar, solicita estado atual do operador via WebSocket (para sincronização adicional)
      setTimeout(() => {
        console.log('📡 loadRundownState: Solicitando estado atual do timer do operador via WebSocket...');
        window.dispatchEvent(new CustomEvent('requestTimerState', {
          detail: { rundownId: rundownIdStr }
        }));
      }, 1500); // Aguarda 1.5 segundos após carregar
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

  // CRÍTICO: Atualiza o estado do timer no backend periodicamente enquanto está rodando
  useEffect(() => {
    if (!activeRundown || !isTimerRunning || !token) return;
    
    // Atualiza o estado no backend a cada 5 segundos
    const syncInterval = setInterval(() => {
      if (activeRundown && isTimerRunning) {
        console.log('💾 Atualizando estado do timer no backend (sincronização periódica)');
        syncTimerState(isTimerRunning, timeElapsed, currentItemIndex, String(activeRundown.id));
      }
    }, 5000); // A cada 5 segundos
    
    return () => clearInterval(syncInterval);
  }, [activeRundown?.id, isTimerRunning, timeElapsed, currentItemIndex, syncTimerState, token]);

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

  // CRÍTICO: Reenvia estado do timer periodicamente quando está rodando
  // Isso garante que apresentadores que entram depois recebam o estado atual
  useEffect(() => {
    if (!isTimerRunning || !activeRundown?.id) return;
    
    // Reenvia o estado a cada 3 segundos quando está rodando
    const syncInterval = setInterval(() => {
      console.log('🔄 Reenviando estado do timer periodicamente para sincronização:', {
        isRunning: isTimerRunning,
        timeElapsed,
        currentItemIndex
      });
      syncTimerState(isTimerRunning, timeElapsed, currentItemIndex);
    }, 3000); // A cada 3 segundos
    
    return () => clearInterval(syncInterval);
  }, [isTimerRunning, timeElapsed, currentItemIndex, activeRundown?.id, syncTimerState]);

  return (
    <RundownContext.Provider value={value}>
      {children}
    </RundownContext.Provider>
  );
};
