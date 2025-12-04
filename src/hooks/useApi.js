import { useContext, useCallback } from 'react';
import AuthContext from '@/contexts/AuthContext.jsx';
import { API_BASE_URL } from '@/config/api';

export const useApi = () => {
  const { token, refreshToken } = useContext(AuthContext);

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
      
      const refreshed = await refreshToken();
      if (refreshed) {
        const newToken = localStorage.getItem('token');
        const newOptions = {
          ...defaultOptions,
          headers: {
            ...defaultOptions.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        };
        // Tenta novamente com o novo token
        response = await fetch(finalUrl, newOptions);
        
        // Se a segunda tentativa foi bem-sucedida, não logar o erro 401 inicial
        if (response.ok) {
          console.log('✅ Token renovado automaticamente e requisição bem-sucedida');
        } else {
          // Se ainda falhar, logar o erro
          try {
            const errorText = await errorResponse.text().catch(() => '');
            console.warn('⚠️ 401 persistiu após refresh:', errorText);
          } catch {}
        }
      } else {
        // Se o refresh falhou, logar o erro
        try {
          const errorText = await errorResponse.text().catch(() => '');
          console.warn('⚠️ 401 recebido e refresh falhou:', errorText);
        } catch {}
      }
    }

    return response;
  }, [token, refreshToken]);

  return { apiCall };
};
