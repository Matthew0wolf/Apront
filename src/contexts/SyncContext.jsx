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
      websocketManager.joinRundown(activeRundownId);
    } else {
      // Sai do rundown anterior se houver
      websocketManager.leaveRundown(activeRundownId);
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
    if (!token) return;
    
    console.log('🔄 Sincronizando mudanças de rundown via WebSocket:', { rundownId, changes });
    
    // Dispara evento imediatamente para o mesmo cliente
    window.dispatchEvent(new CustomEvent('rundownSync', { 
      detail: { 
        rundownId,
        changes
      } 
    }));

    // Envia via WebSocket para outros clientes
    if (websocketManager.isConnected) {
      const payload = {
        rundown_id: rundownId,
        changes: changes
      };
      console.log('📡 Enviando via WebSocket:', payload);
      websocketManager.socket.emit('rundown_updated', payload);
      console.log('✅ Mudanças de rundown enviadas via WebSocket para outros clientes');
    } else {
      console.warn('⚠️ WebSocket não conectado. Mudanças não serão sincronizadas com outros clientes.');
    }
  };

  const syncItemReorder = async (rundownId, folderIndex, newOrder) => {
    console.log('🚀 SyncContext: syncItemReorder chamada!', { rundownId, folderIndex, newOrder, hasToken: !!token });
    
    if (!token) {
      console.log('❌ Token não disponível para sincronização');
      return;
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
    if (!token) return;
    
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

  const syncTimerState = async (isRunning, timeElapsed, currentItemIndex) => {
    if (!token || !activeRundownId) return;
    
    console.log('🔄 Sincronizando estado do timer via WebSocket:', { isRunning, timeElapsed, currentItemIndex });
    
    // Dispara evento imediatamente para o mesmo cliente
    window.dispatchEvent(new CustomEvent('rundownSync', { 
      detail: { 
        rundownId: activeRundownId,
        changes: {
          isRunning,
          timeElapsed,
          currentItemIndex
        }
      } 
    }));

    // Envia via WebSocket para outros clientes
    if (websocketManager.isConnected) {
      websocketManager.socket.emit('rundown_updated', {
        rundown_id: activeRundownId,
        changes: {
          isRunning,
          timeElapsed,
          currentItemIndex
        }
      });
      console.log('📡 Estado do timer enviado via WebSocket para outros clientes');
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