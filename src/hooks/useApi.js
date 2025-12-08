import { useContext, useCallback, useRef } from 'react';
import AuthContext from '@/contexts/AuthContext.jsx';
import { API_BASE_URL } from '@/config/api';

// Variável global para controlar refresh em andamento
let refreshPromise = null;
let lastRefreshTime = 0;
let refreshCooldown = 5000; // 5 segundos de cooldown entre refreshes

export const useApi = () => {
  const { token, refreshToken } = useContext(AuthContext);
  // Usa um Map para rastrear retries por URL, evitando problemas com múltiplas chamadas simultâneas
  const retryCountMap = useRef(new Map());

  const apiCall = useCallback(async (url, options = {}) => {
    // Se a URL for relativa (começar com /api), adiciona o API_BASE_URL
    // Se já tiver http://localhost:5001, substitui pelo API_BASE_URL
    let finalUrl = url;
    if (url.startsWith('/api')) {
      finalUrl = `${API_BASE_URL}${url}`;
    } else if (url.includes('http://localhost:5001')) {
      finalUrl = url.replace('http://localhost:5001', API_BASE_URL);
    }

    // Sempre lê o token mais recente do localStorage para garantir que está atualizado
    const currentToken = localStorage.getItem('token') || token;

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(currentToken && { 'Authorization': `Bearer ${currentToken}` }),
        ...options.headers,
      },
      ...options,
    };

    let response = await fetch(finalUrl, defaultOptions);

    // Se 401, tenta renovar token independentemente da mensagem
    if (response.status === 401) {
      // Clona a response para poder ler o erro sem consumir o body
      const errorResponse = response.clone();
      
      // CRÍTICO: Evita tentar fazer refresh muito frequentemente
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime;
      
      // Evita múltiplas tentativas simultâneas de refresh E respeita cooldown
      if (!refreshPromise && timeSinceLastRefresh >= refreshCooldown) {
        lastRefreshTime = now;
        refreshPromise = refreshToken().finally(() => {
          refreshPromise = null;
        });
      } else if (timeSinceLastRefresh < refreshCooldown) {
        // Se ainda está em cooldown, não tenta fazer refresh
        console.log(`⏸️ Refresh em cooldown. Aguardando ${Math.ceil((refreshCooldown - timeSinceLastRefresh) / 1000)}s`);
        return response; // Retorna o 401 sem tentar refresh
      }
      
      const refreshed = refreshPromise ? await refreshPromise : false;
      
      if (refreshed) {
        // Aguarda um pouco para garantir que o token foi atualizado no contexto
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Lê o novo token do localStorage (sempre a fonte mais confiável após refresh)
        const newToken = localStorage.getItem('token');
        if (newToken) {
          // Verifica se já tentou fazer retry para esta URL específica
          const retryCount = retryCountMap.current.get(finalUrl) || 0;
          
          if (retryCount < 1) {
            retryCountMap.current.set(finalUrl, retryCount + 1);
            
            const newOptions = {
              ...defaultOptions,
              headers: {
                ...defaultOptions.headers,
                'Authorization': `Bearer ${newToken}`,
              },
            };
            
            // Tenta novamente com o novo token
            response = await fetch(finalUrl, newOptions);
            
            // Limpa o contador de retry após a tentativa
            retryCountMap.current.delete(finalUrl);
            
            // Se a segunda tentativa foi bem-sucedida, não logar o erro 401 inicial
            if (response.ok) {
              // Silencioso: token renovado automaticamente com sucesso
              // Não loga para não poluir o console
            } else {
              // Se ainda falhar, só loga se não for 404 (404 pode ser esperado em alguns casos)
              if (response.status === 401) {
                try {
                  const errorText = await errorResponse.text().catch(() => '');
                  console.warn('⚠️ 401 persistiu após refresh:', finalUrl, errorText.substring(0, 100));
                } catch {}
              }
            }
          } else {
            // Já tentou fazer retry, não tenta novamente
            retryCountMap.current.delete(finalUrl);
          }
        }
      } else {
        // Se o refresh falhou, não tenta novamente
        // O erro 401 será retornado normalmente
      }
    }

    return response;
  }, [token, refreshToken]);

  return { apiCall };
};
