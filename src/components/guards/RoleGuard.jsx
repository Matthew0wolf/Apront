import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useContext } from 'react';

const RoleGuard = ({ children, allowedRoles = [], fallbackPath = '/dashboard' }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Se não tem usuário logado, redireciona para login
  if (!user) {
    navigate('/login');
    return null;
  }

  // Se não especificou roles permitidas, permite acesso
  if (allowedRoles.length === 0) {
    return children;
  }

  // Verifica se o role do usuário está na lista de roles permitidos
  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    // Mostra toast de erro
    toast({
      variant: "destructive",
      title: "Acesso Negado",
      description: "Você não tem permissão para acessar esta página.",
    });

    // Redireciona para a página de fallback
    navigate(fallbackPath);
    return null;
  }

  return children;
};

export default RoleGuard;
