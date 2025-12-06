import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import AuthContext from './AuthContext.jsx';
import { websocketManager } from '../lib/websocket';
import { API_BASE_URL } from '../config/api';

const SyncContext = createContext();

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeRundownId, setActiveRundownId] = useState(null);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    // Conecta ao WebSocket quando o componente monta
    websocketManager.connect();
    
    // Configura handlers para atualizações
    websocketManager.onRundownUpdate((data) => {
      console.log('📡 Recebida atualização em tempo real via WebSocket:', data);
      // O WebSocketManager já dispara os eventos customizados automaticamente
    });

    websocketManager.onItemReorder((data) => {
      console.log('📡 Recebida reordenação de item via WebSocket:', data);
    });

    websocketManager.onFolderReorder((data) => {
      console.log('📡 Recebida reordenação de pasta via WebSocket:', data);
    });

    // Listener para atualizações de permissões
    websocketManager.socket?.on('permissions_updated', (data) => {
      console.log('📡 Recebida atualização de permissões via WebSocket:', data);
      // Dispara evento customizado para atualizar o contexto de autenticação
      window.dispatchEvent(new CustomEvent('permissionsUpdated', {
        detail: data
      }));
    });

    // Atualiza status de conexão
    const updateConnectionStatus = () => {
      const status = websocketManager.getConnectionStatus();
      setIsConnected(status.isConnected);
    };

    // Verifica status de conexão periodicamente
    const statusInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      clearInterval(statusInterval);
      // Só desconecta se estiver conectado
      if (websocketManager.isConnected) {
        websocketManager.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Gerencia entrada/saída de rundowns
    if (activeRundownId) {
      console.log('📡 SyncContext: Entrando no rundown via WebSocket:', activeRundownId);
      websocketManager.joinRundown(activeRundownId);
      
      // CRÍTICO: Aguarda um pouco e verifica se realmente entrou na sala
      setTimeout(() => {
        if (websocketManager.isConnected) {
          console.log('✅ SyncContext: Verificando se está na sala do rundown:', activeRundownId);
        } else {
          console.warn('⚠️ SyncContext: WebSocket não está conectado ao tentar entrar no rundown');
        }
      }, 500);
    } else {
      console.log('📡 SyncContext: Saindo do rundown via WebSocket');
      // Sai do rundown anterior se houver
      if (activeRundownId) {
        websocketManager.leaveRundown(activeRundownId);
      }
    }
  }, [activeRundownId]);

  useEffect(() => {
    // Entra na sala da empresa para receber atualizações de permissões
    if (user && user.company_id) {
      websocketManager.joinCompany(user.company_id);
    }
  }, [user]);

  // Função para atualizar status do rundown via nova API
  const updateRundownStatus = async (rundownId, newStatus) => {
    if (!token) {
      console.error('❌ Token não disponível para atualizar status');
      return false;
    }

    try {
      console.log('🔄 Atualizando status do rundown:', { rundownId, newStatus });
      
      // Atualiza status pelo endpoint dedicado
      const response = await fetch(`${API_BASE_URL}/api/rundowns/${rundownId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          lastModified: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Status atualizado com sucesso:', result);
        // Dispara evento para recarregar a lista de rundowns
        window.dispatchEvent(new CustomEvent('rundownListChanged'));
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro ao atualizar status:', response.status, errorData);
        
        // Se o token expirou, tenta fazer refresh (será tratado pelo interceptor global)
        if (response.status === 401) {
          console.warn('⚠️ Token expirado ao atualizar status. O usuário será redirecionado para login.');
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      return false;
    }
  };

  const syncRundownUpdate = async (rundownId, changes) => {
    console.log('🔄 Sincronizando mudanças de rundown via WebSocket:', { rundownId, changes, hasItems: !!changes.items, changesKeys: Object.keys(changes), hasToken: !!token });
    
    // Se houver mudanças em 'items', tentar salvar no banco de dados via API (se houver token)
    if (changes && changes.items && Array.isArray(changes.items) && token) {
      console.log('🔍 [DEBUG] changes.items detectado!', { itemsLength: changes.items.length, rundownId });
      try {
        console.log('💾 [SAVE] Salvando pastas e eventos no banco de dados...', { 
          rundownId, 
          itemsCount: changes.items.length,
          API_BASE_URL,
          url: `${API_BASE_URL}/api/rundowns/${rundownId}`
        });
        
        const response = await fetch(`${API_BASE_URL}/api/rundowns/${rundownId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ items: changes.items })
        });
        
        console.log('📥 [SAVE] Resposta recebida:', response.status, response.statusText);
        
        if (response.ok) {
          const result = await response.json().catch(() => ({}));
          console.log('✅ [SAVE] Pastas e eventos salvos no banco de dados:', result);
          
          // CRÍTICO: Se o backend retornou a estrutura com IDs reais, atualizar o estado local
          // Isso garante que itens com IDs temporários recebam os IDs reais do banco
          if (result.items && Array.isArray(result.items)) {
            console.log('🔄 [SAVE] Atualizando IDs temporários com IDs reais do banco:', {
              itemsReceived: result.items.length,
              hasRealIds: result.items.some(f => f.children?.some(c => !String(c.id).startsWith('item-')))
            });
            
            // Dispara evento para atualizar o rundown com IDs reais
            window.dispatchEvent(new CustomEvent('rundownItemsUpdated', { 
              detail: { 
                rundownId: rundownId,
                items: result.items 
              } 
            }));
            
            // CRÍTICO: Também dispara rundownSync para sincronizar PresenterView e outros clientes
            // Isso garante que mudanças de nome/título sejam propagadas imediatamente
            window.dispatchEvent(new CustomEvent('rundownSync', { 
              detail: { 
                rundownId: rundownId,
                changes: { items: result.items }
              } 
            }));
            
            // Envia via WebSocket para outros clientes com os dados atualizados do backend
            if (websocketManager.isConnected) {
              websocketManager.socket.emit('rundown_updated', {
                rundown_id: rundownId,
                changes: { items: result.items }
              });
              console.log('📡 [SAVE] Dados atualizados enviados via WebSocket para outros clientes');
            }
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn('⚠️ [SAVE] Erro ao salvar no banco (continuando com sincronização WebSocket):', response.status, errorData);
          // CRÍTICO: Mesmo com erro ao salvar no banco, continua para sincronizar via WebSocket
        }
      } catch (error) {
        console.warn('⚠️ [SAVE] Erro ao salvar mudanças no banco (continuando com sincronização WebSocket):', error);
        // CRÍTICO: Mesmo com erro, continua para sincronizar via WebSocket
      }
    } else if (changes && changes.items && Array.isArray(changes.items) && !token) {
      console.warn('⚠️ [SAVE] Token não disponível - pulando salvamento no banco, mas sincronizando via WebSocket');
    }
    
    // CRÍTICO: Dispara evento imediatamente para o mesmo cliente (sempre, mesmo sem token ou erro)
    window.dispatchEvent(new CustomEvent('rundownSync', { 
      detail: { 
        rundownId,
        changes
      } 
    }));

    // CRÍTICO: Envia via WebSocket para outros clientes (sempre, mesmo sem token ou erro no banco)
    // Isso garante que o apresentador receba as atualizações em tempo real mesmo quando há erro 401
    if (websocketManager.isConnected && websocketManager.socket) {
      const payload = {
        rundown_id: rundownId,
        changes: changes
      };
      console.log('📡 Enviando via WebSocket (sincronização em tempo real):', payload);
      websocketManager.socket.emit('rundown_updated', payload);
      console.log('✅ Mudanças de rundown enviadas via WebSocket para outros clientes (incluindo apresentador)');
    } else {
      console.warn('⚠️ WebSocket não conectado. Mudanças não serão sincronizadas com outros clientes.');
    }
  };

  const syncItemReorder = async (rundownId, folderIndex, newOrder) => {
    console.log('🚀 SyncContext: syncItemReorder chamada!', { rundownId, folderIndex, newOrder, hasToken: !!token });
    
    // CRÍTICO: Verificar se está em modo de arrasto - NÃO salvar durante arrasto
    // O salvamento só deve acontecer quando o usuário soltar o mouse (handleDragEnd)
    if (typeof window !== 'undefined' && window.isDraggingRef?.current) {
      console.log('⚠️ [REORDER] Ignorando salvamento durante arrasto - será salvo quando soltar o mouse');
      // Ainda dispara o evento local para atualização visual, mas não salva no banco
      window.dispatchEvent(new CustomEvent('itemReordered', { 
        detail: { 
          rundownId,
          folderIndex,
          newOrder
        } 
      }));
      return;
    }
    
    if (!token) {
      console.log('❌ Token não disponível para sincronização');
      return;
    }
    
    // CRÍTICO: Salvar reordenação no banco de dados
    // Para salvar, precisamos enviar a estrutura completa do rundown atualizada
    try {
      // Busca o rundown atual para obter a estrutura completa
      const rundownResponse = await fetch(`${API_BASE_URL}/api/rundowns`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (rundownResponse.ok) {
        const rundownData = await rundownResponse.json();
        const currentRundown = rundownData.rundowns?.find(r => String(r.id) === String(rundownId));
        
        if (currentRundown) {
          // Atualiza a ordem dos itens na pasta específica
          const updatedItems = [...currentRundown.items];
          if (updatedItems[folderIndex]) {
            updatedItems[folderIndex] = {
              ...updatedItems[folderIndex],
              children: newOrder
            };
            
            // Salva no banco de dados
            console.log('💾 [REORDER] Salvando reordenação de itens no banco de dados...', { rundownId, folderIndex });
            const saveResponse = await fetch(`${API_BASE_URL}/api/rundowns/${rundownId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ items: updatedItems })
            });
            
            if (saveResponse.ok) {
              const result = await saveResponse.json().catch(() => ({}));
              console.log('✅ [REORDER] Reordenação de itens salva no banco:', result);
              
              // Se o backend retornou a estrutura com IDs reais, atualizar o estado local
              if (result.items && Array.isArray(result.items)) {
                window.dispatchEvent(new CustomEvent('rundownItemsUpdated', { 
                  detail: { 
                    rundownId: rundownId,
                    items: result.items 
                  } 
                }));
              }
            } else {
              const errorData = await saveResponse.json().catch(() => ({}));
              console.error('❌ [REORDER] Erro ao salvar reordenação:', saveResponse.status, errorData);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [REORDER] Erro ao salvar reordenação no banco:', error);
    }
    
    console.log('🔄 Sincronizando reordenação de item via WebSocket:', { rundownId, folderIndex, newOrder });
    
    // Dispara evento imediatamente para o mesmo cliente
    console.log('📡 Disparando evento itemReordered localmente');
    window.dispatchEvent(new CustomEvent('itemReordered', { 
      detail: { 
        rundownId,
        folderIndex,
        newOrder
      } 
    }));

    // Envia via WebSocket para outros clientes
    if (websocketManager.isConnected) {
      websocketManager.socket.emit('item_reordered', {
        rundown_id: rundownId,
        folder_index: folderIndex,
        new_order: newOrder
      });
      console.log('📡 Reordenação enviada via WebSocket para outros clientes');
    } else {
      console.warn('⚠️ WebSocket não conectado. Reordenação não será sincronizada com outros clientes.');
    }
  };

  const syncFolderReorder = async (rundownId, newOrder) => {
    // CRÍTICO: Verificar se está em modo de arrasto - NÃO salvar durante arrasto
    // O salvamento só deve acontecer quando o usuário soltar o mouse (handleDragEnd)
    if (typeof window !== 'undefined' && window.isDraggingRef?.current) {
      console.log('⚠️ [REORDER] Ignorando salvamento durante arrasto - será salvo quando soltar o mouse');
      // Ainda dispara o evento local para atualização visual, mas não salva no banco
      window.dispatchEvent(new CustomEvent('folderReordered', { 
        detail: { 
          rundownId,
          newOrder
        } 
      }));
      return;
    }
    
    if (!token) {
      console.log('❌ Token não disponível para sincronização');
      return;
    }
    
    // CRÍTICO: Salvar reordenação no banco de dados
    try {
      console.log('💾 [REORDER] Salvando reordenação de pastas no banco de dados...', { rundownId });
      
      // Salva diretamente a nova ordem das pastas
      const saveResponse = await fetch(`${API_BASE_URL}/api/rundowns/${rundownId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: newOrder })
      });
      
      if (saveResponse.ok) {
        const result = await saveResponse.json().catch(() => ({}));
        console.log('✅ [REORDER] Reordenação de pastas salva no banco:', result);
        
        // Se o backend retornou a estrutura com IDs reais, atualizar o estado local
        if (result.items && Array.isArray(result.items)) {
          window.dispatchEvent(new CustomEvent('rundownItemsUpdated', { 
            detail: { 
              rundownId: rundownId,
              items: result.items 
            } 
          }));
        }
      } else {
        const errorData = await saveResponse.json().catch(() => ({}));
        console.error('❌ [REORDER] Erro ao salvar reordenação de pastas:', saveResponse.status, errorData);
      }
    } catch (error) {
      console.error('❌ [REORDER] Erro ao salvar reordenação de pastas no banco:', error);
    }
    
    console.log('🔄 Sincronizando reordenação de pasta via WebSocket:', { rundownId, newOrder });
    
    // Dispara evento imediatamente para o mesmo cliente
    window.dispatchEvent(new CustomEvent('folderReordered', { 
      detail: { 
        rundownId,
        newOrder
      } 
    }));

    // Envia via WebSocket para outros clientes
    if (websocketManager.isConnected) {
      websocketManager.socket.emit('folder_reordered', {
        rundown_id: rundownId,
        new_order: newOrder
      });
      console.log('📡 Reordenação de pasta enviada via WebSocket para outros clientes');
    } else {
      console.warn('⚠️ WebSocket não conectado. Reordenação não será sincronizada com outros clientes.');
    }
  };

  const syncTimerState = async (isRunning, timeElapsed, currentItemIndex, rundownId = null) => {
    // Usa rundownId fornecido ou activeRundownId como fallback
    const targetRundownId = rundownId || activeRundownId;
    
    if (!token || !targetRundownId) {
      console.warn('⚠️ syncTimerState: Token ou rundownId não disponível', { hasToken: !!token, rundownId: targetRundownId });
      return;
    }
    
    // CRÍTICO: Normaliza o currentItemIndex para garantir estrutura correta antes de enviar
    let normalizedItemIndex = { folderIndex: 0, itemIndex: 0 };
    
    if (currentItemIndex && typeof currentItemIndex === 'object') {
      // Se já está no formato correto
      if (typeof currentItemIndex.folderIndex === 'number' && 
          typeof currentItemIndex.itemIndex === 'number') {
        normalizedItemIndex = {
          folderIndex: currentItemIndex.folderIndex,
          itemIndex: currentItemIndex.itemIndex
        };
      }
      // Se está aninhado incorretamente, extrai o objeto interno
      else if (currentItemIndex.folderIndex && typeof currentItemIndex.folderIndex === 'object') {
        const nested = currentItemIndex.folderIndex;
        if (typeof nested.folderIndex === 'number' && typeof nested.itemIndex === 'number') {
          console.warn('⚠️ syncTimerState: currentItemIndex estava aninhado incorretamente, normalizando antes de enviar...', {
            original: currentItemIndex,
            normalized: nested
          });
          normalizedItemIndex = {
            folderIndex: nested.folderIndex,
            itemIndex: nested.itemIndex
          };
        }
      }
    }
    
    console.log('🔄 Sincronizando estado do timer (WebSocket + Backend):', { 
      isRunning, 
      timeElapsed, 
      originalIndex: currentItemIndex,
      normalizedIndex: normalizedItemIndex,
      rundownId: targetRundownId
    });
    
    // CRÍTICO: Salva o estado no backend primeiro (persistência global)
    try {
      const response = await fetch(`${API_BASE_URL}/api/rundowns/${targetRundownId}/timer-state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isRunning,
          timeElapsed,
          currentItemIndex: normalizedItemIndex
        })
      });
      
      if (response.ok) {
        console.log('✅ Estado do timer salvo no backend (persistência global)');
      } else {
        console.warn('⚠️ Erro ao salvar estado do timer no backend:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao salvar estado do timer no backend:', error);
      // Continua mesmo se falhar - ainda sincroniza via WebSocket
    }
    
    // Dispara evento imediatamente para o mesmo cliente (usando índice normalizado)
    window.dispatchEvent(new CustomEvent('rundownSync', { 
      detail: { 
        rundownId: targetRundownId,
        changes: {
          isRunning,
          timeElapsed,
          currentItemIndex: normalizedItemIndex
        }
      } 
    }));

    // Envia via WebSocket para outros clientes (usando índice normalizado)
    if (websocketManager.isConnected) {
      websocketManager.socket.emit('rundown_updated', {
        rundown_id: targetRundownId,
        changes: {
          isRunning,
          timeElapsed,
          currentItemIndex: normalizedItemIndex
        }
      });
      console.log('📡 Estado do timer enviado via WebSocket para outros clientes:', {
        rundownId: targetRundownId,
        currentItemIndex: normalizedItemIndex
      });
    } else {
      console.warn('⚠️ WebSocket não conectado. Estado do timer não será sincronizado com outros clientes.');
    }
  };

  const value = {
    isConnected,
    activeRundownId,
    setActiveRundownId,
    updateRundownStatus,
    syncRundownUpdate,
    syncItemReorder,
    syncFolderReorder,
    syncTimerState,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};