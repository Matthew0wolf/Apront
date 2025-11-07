import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from '@/contexts/AuthContext.jsx';

const PermissionGuard = ({ children, permission, fallbackPath = '/dashboard' }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Se não tem usuário logado, redireciona para login
  if (!user) {
    navigate('/login');
    return null;
  }

  // Admin tem todas as permissões
  if (user.role === 'admin') {
    return children;
  }

  // Verifica permissão específica
  const hasPermission = user[`can_${permission}`] || false;

  if (!hasPermission) {
    // Mostra toast de erro
    toast({
      variant: "destructive",
      title: "Acesso Negado",
      description: `Você não tem permissão para acessar esta funcionalidade.`,
    });

    // Redireciona para a página de fallback
    navigate(fallbackPath);
    return null;
  }

  return children;
};

export default PermissionGuard;
