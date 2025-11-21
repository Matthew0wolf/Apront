import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/config/api';
import { websocketManager } from '../lib/websocket';

const NotificationsContext = createContext();

export const useNotifications = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Carregar notificações do backend ao montar
  useEffect(() => {
    loadNotifications();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    
    // Listener para notificações via WebSocket
    const handleNewNotification = (data) => {
      console.log('📢 Notificação recebida via WebSocket:', data);
      // Adiciona a notificação localmente (já mostra toast automaticamente)
      addNotification({
        title: data.title,
        description: data.message,
        type: data.type || 'info',
        category: data.category || 'system',
        related_id: data.related_id
      });
      // Recarrega notificações do backend para garantir sincronização
      setTimeout(() => loadNotifications(), 500);
    };
    
    // Registrar listener no WebSocket (aguarda conexão se necessário)
    const setupWebSocketListener = () => {
      if (websocketManager.socket && websocketManager.isConnected) {
        websocketManager.socket.on('new_notification', handleNewNotification);
        console.log('✅ Listener de notificações WebSocket registrado');
      } else {
        // Aguarda um pouco e tenta novamente se ainda não conectou
        setTimeout(setupWebSocketListener, 1000);
      }
    };
    
    setupWebSocketListener();
    
    return () => {
      clearInterval(interval);
      if (websocketManager.socket) {
        websocketManager.socket.off('new_notification', handleNewNotification);
      }
    };
  }, [loadNotifications, addNotification]);

  const loadNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/notifications?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }, []);

  const addNotification = useCallback((notification) => {
    // Notificação local (client-side)
    const newNotif = {
      id: notification.id || `local-${Date.now()}-${Math.random()}`,
      title: notification.title || 'Notificação',
      message: notification.description || notification.message || '',
      type: notification.type || 'info',
      category: notification.category || 'system',
      read: false,
      created_at: new Date().toISOString(),
      ...notification,
    };
    
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Mostrar toast também
    toast({
      title: newNotif.title,
      description: newNotif.message,
      variant: newNotif.type === 'error' ? 'destructive' : 'default'
    });
  }, [toast]);

  const markAsRead = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      // Se é notificação do backend
      if (!id.toString().startsWith('local-')) {
        await fetch(`/api/notifications/${id}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Atualizar localmente
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
      
      toast({
        title: "✅ Todas marcadas como lidas",
        duration: 2000
      });
      
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, [toast]);

  const clearNotification = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      
      // Se é notificação do backend, deletar
      if (!id.toString().startsWith('local-')) {
        await fetch(`/api/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
      // Remover localmente mesmo se falhar no backend
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = useMemo(() => ({ 
    notifications, 
    unreadCount,
    addNotification, 
    markAsRead,
    markAllAsRead,
    clearNotification, 
    clearAll,
    loadNotifications
  }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotification, clearAll, loadNotifications]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};


