import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import AuthContext from './AuthContext.jsx';

const AuthProvider = ({ children }) => {
  // Inicializa a partir do localStorage para evitar janela sem token
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try { setUser(JSON.parse(storedUser)); } catch {}
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    // Listener para atualizações de permissões via WebSocket
    const handlePermissionsUpdate = (event) => {
      const { user_id, permissions } = event.detail;
      
      // Se a atualização é para o usuário atual, atualiza o contexto
      if (user && user.id === user_id) {
        console.log('🔄 Atualizando permissões do usuário atual:', permissions);
        setUser(prevUser => ({
          ...prevUser,
          can_operate: permissions.can_operate,
          can_present: permissions.can_present,
          role: permissions.role
        }));
        
        // Atualiza localStorage
        const updatedUser = {
          ...user,
          can_operate: permissions.can_operate,
          can_present: permissions.can_present,
          role: permissions.role
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    };

    window.addEventListener('permissionsUpdated', handlePermissionsUpdate);
    
    return () => {
      window.removeEventListener('permissionsUpdated', handlePermissionsUpdate);
    };
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const refreshToken = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: currentToken })
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('✅ Token renovado com sucesso');
        return true;
      } else {
        console.log('❌ Falha ao renovar token');
        logout();
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      logout();
      return false;
    }
  }, [logout]);

  const login = useCallback((userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwt);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
