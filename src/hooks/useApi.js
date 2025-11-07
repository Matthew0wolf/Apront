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
      try {
        const errorText = await response.text().catch(() => '');
        console.warn('⚠️ 401 recebido. Tentando refresh...', errorText);
      } catch {}
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
        response = await fetch(finalUrl, newOptions);
      }
    }

    return response;
  }, [token, refreshToken]);

  return { apiCall };
};
