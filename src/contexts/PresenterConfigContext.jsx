import React, { createContext, useContext, useState, useEffect } from 'react';
import { websocketManager } from '../lib/websocket';

const PresenterConfigContext = createContext();

export const usePresenterConfig = () => {
  const context = useContext(PresenterConfigContext);
  if (!context) {
    throw new Error('usePresenterConfig deve ser usado dentro de PresenterConfigProvider');
  }
  return context;
};

export const PresenterConfigProvider = ({ children }) => {
  // Configurações do apresentador (controladas pelo operador)
  const [presenterConfig, setPresenterConfig] = useState({
    fontSize: 24, // 16-48px
    lineHeight: 1.8, // 1.2-2.5
    fontFamily: 'sans-serif', // sans-serif, serif, mono
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    showScript: true, // Mostrar/ocultar scripts
    autoScroll: false, // Auto-scroll ativo/inativo
    scrollSpeed: 0.5, // 0.05-2.0 (multiplicador de velocidade, padrão mais lento)
    scrollLoop: false, // Se true, volta ao início quando chega no final
    scrollStartPosition: 0, // 0-100% - posição inicial do scroll (0 = topo, 100 = final)
    audioAlerts: 'both', // 'operator', 'presenter', 'both', 'none' - onde tocar alertas sonoros
  });

  // Atualizar configuração (usado pelo operador)
  const updatePresenterConfig = (updates) => {
    setPresenterConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      // Emitir via WebSocket para sincronizar com apresentador
      if (websocketManager.isConnected && websocketManager.socket) {
        websocketManager.socket.emit('presenter_config_update', newConfig);
        console.log('📤 Operador: Enviando configurações do apresentador:', newConfig);
      } else {
        console.warn('⚠️ WebSocket não conectado. Configurações não serão sincronizadas.');
      }
      
      return newConfig;
    });
  };

  // Receber atualizações de configuração via WebSocket (usado pelo apresentador)
  useEffect(() => {
    // Função para adicionar listener quando socket estiver disponível
    const setupListener = () => {
      if (websocketManager.socket) {
        const handleConfigUpdate = (config) => {
          console.log('📥 Apresentador: Recebendo configurações do operador:', config);
          setPresenterConfig(config);
        };

        websocketManager.socket.on('presenter_config_update', handleConfigUpdate);
        console.log('✅ Listener de configurações do apresentador registrado');

        return () => {
          if (websocketManager.socket) {
            websocketManager.socket.off('presenter_config_update', handleConfigUpdate);
            console.log('🔌 Listener de configurações do apresentador removido');
          }
        };
      }
      return () => {};
    };

    // Se já estiver conectado, configura imediatamente
    if (websocketManager.isConnected && websocketManager.socket) {
      return setupListener();
    }

    // Caso contrário, aguarda conexão
    const checkConnection = setInterval(() => {
      if (websocketManager.isConnected && websocketManager.socket) {
        clearInterval(checkConnection);
        setupListener();
      }
    }, 500);

    return () => {
      clearInterval(checkConnection);
      if (websocketManager.socket) {
        websocketManager.socket.off('presenter_config_update');
      }
    };
  }, []);

  return (
    <PresenterConfigContext.Provider value={{ presenterConfig, updatePresenterConfig }}>
      {children}
    </PresenterConfigContext.Provider>
  );
};

