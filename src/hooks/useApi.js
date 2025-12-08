import { useContext, useCallback, useRef } from 'react';
import AuthContext from '@/contexts/AuthContext.jsx';
import { API_BASE_URL } from '@/config/api';

// Variável global para controlar refresh em andamento
let refreshPromise = null;

export const useApi = () => {
  const { token, refreshToken } = useContext(AuthContext);
  const retryCountRef = useRef(0);

  const apiCall = useCallback(async (url, options = {}) => {
    // Se a URL for relativa (começar com /api), adiciona o API_BASE_URL
    // Se já tiver http://localhost:5001, substitui pelo API_BASE_URL
    let finalUrl = url;
    if (url.startsWith('/api')) {
      finalUrl = `${API_BASE_URL}${url}`;
    } else if (url.includes('http://localhost:5001')) {
      finalUrl = url.replace('http://localhost:5001', API_BASE_URL);
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    let response = await fetch(finalUrl, defaultOptions);

    // Se 401, tenta renovar token independentemente da mensagem
    if (response.status === 401) {
      // Clona a response para poder ler o erro sem consumir o body
      const errorResponse = response.clone();
      
      // Evita múltiplas tentativas simultâneas de refresh
      if (!refreshPromise) {
        refreshPromise = refreshToken().finally(() => {
          refreshPromise = null;
        });
      }
      
      const refreshed = await refreshPromise;
      
      if (refreshed) {
        const newToken = localStorage.getItem('token');
        if (newToken) {
          const newOptions = {
            ...defaultOptions,
            headers: {
              ...defaultOptions.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          };
          // Tenta novamente com o novo token (máximo 1 retry)
          if (retryCountRef.current < 1) {
            retryCountRef.current++;
            response = await fetch(finalUrl, newOptions);
            retryCountRef.current = 0;
            
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
          }
        }
      } else {
        // Se o refresh falhou, loga apenas se for crítico
        // Não loga para não poluir o console com erros esperados
      }
    }

    return response;
  }, [token, refreshToken]);

  return { apiCall };
};
