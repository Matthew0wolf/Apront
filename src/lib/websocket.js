import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';

class WebSocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 segundo
  }

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    console.log('🔌 Conectando ao servidor WebSocket...', API_BASE_URL);
    
    this.socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor WebSocket');
      console.log('🔗 Socket ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado do servidor WebSocket:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconectado ao servidor WebSocket após', attemptNumber, 'tentativas');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Erro de reconexão WebSocket:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Falha ao reconectar ao servidor WebSocket após', this.maxReconnectAttempts, 'tentativas');
      this.isConnected = false;
    });

    // Eventos específicos do rundown
    this.socket.on('rundown_updated', (data) => {
      console.log('📡 WebSocket: Rundown atualizado recebido:', data);
      console.log('📡 WebSocket: Dados completos:', JSON.stringify(data, null, 2));
      this.handleRundownUpdate(data);
    });

    this.socket.on('item_reordered', (data) => {
      console.log('📡 Item reordenado via WebSocket:', data);
      this.handleItemReorder(data);
    });

    this.socket.on('folder_reordered', (data) => {
      console.log('📡 Pasta reordenada via WebSocket:', data);
      this.handleFolderReorder(data);
    });

    this.socket.on('rundown_list_changed', (data) => {
      console.log('📡 Lista de rundowns alterada:', data);
      // Dispara evento customizado para recarregar lista
      window.dispatchEvent(new CustomEvent('rundownListChanged', { detail: data }));
    });
  }

  disconnect() {
    if (this.socket && this.isConnected) {
      console.log('🔌 Desconectando do servidor WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinRundown(rundownId) {
    if (this.socket && this.isConnected) {
      console.log('🚪 Entrando no rundown:', rundownId);
      this.socket.emit('join_rundown', { rundown_id: rundownId });
    } else {
      console.warn('⚠️ WebSocket não conectado. Não é possível entrar no rundown.');
    }
  }

  leaveRundown(rundownId) {
    if (this.socket && this.isConnected) {
      console.log('🚪 Saindo do rundown:', rundownId);
      this.socket.emit('leave_rundown', { rundown_id: rundownId });
    }
  }

  // Métodos para registrar handlers de eventos
  onRundownUpdate(callback) {
    this.eventHandlers.set('rundown_updated', callback);
  }

  onItemReorder(callback) {
    this.eventHandlers.set('item_reordered', callback);
  }

  onFolderReorder(callback) {
    this.eventHandlers.set('folder_reordered', callback);
  }

  // Métodos para disparar eventos customizados
  handleRundownUpdate(data) {
    console.log('📡 WebSocketManager: Processando atualização de rundown:', data);
    
    const handler = this.eventHandlers.get('rundown_updated');
    if (handler) {
      handler(data);
    }
    
    // Dispara evento customizado para compatibilidade com código existente
    const eventData = {
      rundownId: data.rundown_id || data.rundownId,
      changes: data.changes || {}
    };
    
    console.log('📡 WebSocketManager: Disparando evento rundownSync:', eventData);
    window.dispatchEvent(new CustomEvent('rundownSync', { 
      detail: eventData
    }));
  }

  handleItemReorder(data) {
    const handler = this.eventHandlers.get('item_reordered');
    if (handler) {
      handler(data);
    }
    
    // Dispara evento customizado para compatibilidade com código existente
    window.dispatchEvent(new CustomEvent('itemReordered', { 
      detail: { 
        rundownId: data.rundown_id, 
        folderIndex: data.folder_index,
        newOrder: data.new_order
      } 
    }));
  }

  handleFolderReorder(data) {
    const handler = this.eventHandlers.get('folder_reordered');
    if (handler) {
      handler(data);
    }
    
    // Dispara evento customizado para compatibilidade com código existente
    window.dispatchEvent(new CustomEvent('folderReordered', { 
      detail: { 
        rundownId: data.rundown_id, 
        newOrder: data.new_order
      } 
    }));
  }

  // Métodos para gerenciar salas
  joinRundown(rundownId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_rundown', { rundown_id: rundownId });
      console.log('📡 Entrando no rundown:', rundownId);
    }
  }

  leaveRundown(rundownId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_rundown', { rundown_id: rundownId });
      console.log('📡 Saindo do rundown:', rundownId);
    }
  }

  joinCompany(companyId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_company', { company_id: companyId });
      console.log('📡 Entrando na empresa:', companyId);
    }
  }

  // Método para verificar se está conectado
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }
}

// Instância singleton
export const websocketManager = new WebSocketManager();
