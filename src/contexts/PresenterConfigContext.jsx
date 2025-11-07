import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSync } from './SyncContext';

const PresenterConfigContext = createContext();

export const usePresenterConfig = () => {
  const context = useContext(PresenterConfigContext);
  if (!context) {
    throw new Error('usePresenterConfig deve ser usado dentro de PresenterConfigProvider');
  }
  return context;
};

export const PresenterConfigProvider = ({ children }) => {
  const { socket } = useSync();
  
  // Configurações do apresentador (controladas pelo operador)
  const [presenterConfig, setPresenterConfig] = useState({
    fontSize: 24, // 16-48px
    lineHeight: 1.8, // 1.2-2.5
    fontFamily: 'sans-serif', // sans-serif, serif, mono
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    showScript: true, // Mostrar/ocultar scripts
    autoScroll: false, // Auto-scroll ativo/inativo
    scrollSpeed: 1.0, // 0.5-2.0 (multiplicador de velocidade)
  });

  // Atualizar configuração (usado pelo operador)
  const updatePresenterConfig = (updates) => {
    setPresenterConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      // Emitir via WebSocket para sincronizar com apresentador
      if (socket && socket.connected) {
        socket.emit('presenter_config_update', newConfig);
        console.log('📤 Operador: Enviando configurações do apresentador:', newConfig);
      }
      
      return newConfig;
    });
  };

  // Receber atualizações de configuração via WebSocket (usado pelo apresentador)
  useEffect(() => {
    if (!socket) return;

    const handleConfigUpdate = (config) => {
      console.log('📥 Apresentador: Recebendo configurações do operador:', config);
      setPresenterConfig(config);
    };

    socket.on('presenter_config_update', handleConfigUpdate);

    return () => {
      socket.off('presenter_config_update', handleConfigUpdate);
    };
  }, [socket]);

  return (
    <PresenterConfigContext.Provider value={{ presenterConfig, updatePresenterConfig }}>
      {children}
    </PresenterConfigContext.Provider>
  );
};

