import React, { useContext, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, FolderOpen, Clock, Users, Folder, Calendar, 
  Film, Edit3, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRundown } from '@/contexts/RundownContext.jsx';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { API_BASE_URL } from '@/config/api';
import Footer from '@/components/shared/Footer.jsx';

// Componente helper para botão estilizado (mesmo estilo da top bar)
const StyledButton = ({ children, onClick, isLight, className = '', Icon, iconClassName = '' }) => {
  return (
    <button
      className={`relative h-[38px] px-3 transition-all font-medium overflow-hidden cursor-pointer group flex items-center gap-2 ${className}`}
      style={{
        backgroundColor: isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C',
        color: isLight ? '#080808' : '#ffffff'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.7)' : '#171717';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C';
      }}
    >
      {/* Borda principal com 20% de opacidade */}
      <div 
        className="absolute inset-0 border pointer-events-none transition-colors" 
        style={{ 
          borderColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.4)' : 'rgba(255, 255, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)';
        }}
      />
      
      {/* Cantos decorativos */}
      <div className="absolute top-0 left-0 w-[9.822px] h-[8.929px] border-t border-l pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }} />
      <div className="absolute bottom-0 left-0 w-[8.929px] h-[9.822px] border-b border-l pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }} />
      <div className="absolute top-0 right-0 w-[8.929px] h-[9.822px] border-t border-r pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }} />
      <div className="absolute bottom-0 right-0 w-[9.822px] h-[8.929px] border-b border-r pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }} />
      
      {/* Conteúdo */}
      <div className="relative z-10 flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${iconClassName}`} style={{ color: isLight ? '#080808' : '#ffffff' }} />}
        <span className="text-sm font-medium leading-none whitespace-nowrap" style={{ color: isLight ? '#080808' : '#ffffff' }}>
          {children}
        </span>
      </div>
    </button>
  );
};

// Componente helper para aplicar estilo de botão da top bar
const StyledCard = ({ children, className = '', onClick, isLight }) => {
  return (
    <div
      className={`relative overflow-hidden cursor-pointer transition-all ${className}`}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.7)' : '#171717';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C';
      }}
      style={{
        backgroundColor: isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C'
      }}
    >
      {/* Borda principal com 20% de opacidade */}
      <div 
        className="absolute inset-0 border pointer-events-none transition-colors" 
        style={{ 
          borderColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.4)' : 'rgba(255, 255, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)';
        }}
      />
      
      {/* Cantos decorativos - 100% de opacidade */}
      {/* Canto superior esquerdo */}
      <div 
        className="absolute top-0 left-0 w-[9.822px] h-[8.929px] border-t border-l pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
      />
      
      {/* Canto inferior esquerdo */}
      <div 
        className="absolute bottom-0 left-0 w-[8.929px] h-[9.822px] border-b border-l pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
      />
      
      {/* Canto superior direito */}
      <div 
        className="absolute top-0 right-0 w-[8.929px] h-[9.822px] border-t border-r pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
      />
      
      {/* Canto inferior direito */}
      <div 
        className="absolute bottom-0 right-0 w-[9.822px] h-[8.929px] border-b border-r pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
      />
      
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { rundowns } = useRundown();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const { toast } = useToast();
  const isLight = theme === 'light';
  const [auditEvents, setAuditEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Mostra mensagem de versão de testes ao acessar o Dashboard após login
  useEffect(() => {
    // Verifica se acabou de fazer login (marcador no localStorage)
    const justLoggedIn = localStorage.getItem('justLoggedIn');
    
    if (justLoggedIn === 'true' && user) {
      // Mostra a mensagem
      toast({
        title: "⚠️ Versão de Testes",
        description: "Você está em uma versão de testes, qualquer bug encontrado por favor, reportar a equipe de desenvolvimento",
        duration: 10000, // 10 segundos
      });
      
      // Remove o marcador para não mostrar novamente
      localStorage.removeItem('justLoggedIn');
    }
  }, [user, toast]);

  // Calcula estatísticas conforme Figma
  const stats = useMemo(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Transmissões este mês (rundowns criados ou ao vivo este mês)
    const transmissionsThisMonth = rundowns.filter(r => {
      const created = new Date(r.created || r.last_modified);
      return created >= firstDayOfMonth;
    }).length;
    
    // Tempo total ao vivo (simplificado - soma das durações)
    let totalMinutes = rundowns.reduce((acc, r) => {
      const duration = r.duration || '0';
      const match = duration.match(/(\d+)h?\s*(\d+)?/);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const mins = parseInt(match[2]) || 0;
        return acc + (hours * 60) + mins;
      }
      return acc;
    }, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // Alterações este mês (simplificado - usa modificações)
    const changesThisMonth = rundowns.filter(r => {
      const modified = new Date(r.last_modified || r.created);
      return modified >= firstDayOfMonth;
    }).length * 3; // Multiplica por 3 como aproximação
    
    // Membros na equipe (simplificado - soma os team_members de cada projeto)
    const teamMembers = rundowns.reduce((acc, r) => {
      return acc + (r.team_members || 1);
    }, 0);
    const avgTeamMembers = rundowns.length > 0 ? Math.max(1, Math.floor(teamMembers / rundowns.length)) : 0;
    
    // Projetos existentes
    const existingProjects = rundowns.length;
    
    return {
      transmissionsThisMonth: transmissionsThisMonth,
      totalHoursLive: hours,
      totalMinutesLive: minutes,
      changesThisMonth: changesThisMonth,
      teamMembers: avgTeamMembers,
      existingProjects: existingProjects
    };
  }, [rundowns]);

  // Carrega eventos de auditoria
  useEffect(() => {
    const loadAuditEvents = async () => {
      try {
        setLoadingEvents(true);
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${API_BASE_URL}/api/notifications/events?limit=6`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAuditEvents(data.events || []);
        }
      } catch (error) {
        console.error('Erro ao carregar eventos de auditoria:', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    
    loadAuditEvents();
    
    // Recarrega eventos a cada 20 minutos para manter atualizado
    const interval = setInterval(loadAuditEvents, 20 * 60 * 1000); // 20 minutos
    
    return () => clearInterval(interval);
  }, [rundowns.length]); // Recarrega quando o número de rundowns mudar

  // Formata tempo relativo
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Há pouco tempo';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 2) return 'Há 2 min.';
    if (diffMins < 60) return `Há ${diffMins} min.`;
    if (diffHours < 2) return 'Há 2 horas';
    if (diffHours < 24) return `Há ${diffHours} horas`;
    if (diffDays === 1) return 'Há 1 dia';
    return `Há ${diffDays} dias`;
  };

  // Formata evento para exibição
  const formatEventAction = (event) => {
    const eventType = event.event_type || '';
    const metadata = event.metadata || {};
    const resourceType = event.resource_type || '';
    const resourceName = metadata.name || metadata.resource_name || metadata.project_name || 'Recurso';
    const companyName = event.company_name || 'Sistema';
    
    // Criação de projeto/rundown
    if (eventType.includes('rundown.created') || eventType.includes('project.created')) {
      return {
        action: `Criou o projeto`,
        resource: resourceName,
        in: companyName
      };
    }
    
    // Deleção de projeto/rundown
    if (eventType.includes('rundown.deleted') || eventType.includes('project.deleted')) {
      return {
        action: `Deletou o projeto`,
        resource: resourceName,
        in: companyName
      };
    }
    
    // Atualização de script
    if (eventType.includes('script_updated') || eventType.includes('script.added')) {
      const itemTitle = metadata.item_title || 'evento';
      return {
        action: metadata.has_script ? `Adicionou script ao evento` : `Modificou script do evento`,
        resource: itemTitle,
        in: metadata.project_name || 'Projeto'
      };
    }
    
    // Modificação da estrutura do projeto
    if (eventType.includes('structure_updated') || eventType.includes('rundown.updated')) {
      return {
        action: `Modificou a estrutura do projeto`,
        resource: resourceName,
        in: companyName
      };
    }
    
    // Adição de evento/item
    if (eventType.includes('item.add') || eventType.includes('event.add')) {
      return {
        action: `Adicionou o evento`,
        resource: resourceName || 'Evento',
        in: metadata.project_name || resourceName
      };
    }
    
    // Remoção de pasta/item
    if (eventType.includes('item.remove') || eventType.includes('folder.remove')) {
      return {
        action: `Removeu`,
        resource: resourceName || 'item',
        in: metadata.project_name || 'Projeto'
      };
    }
    
    // Login/entrada
    if (eventType.includes('login') || eventType.includes('entrou')) {
      return {
        action: `Entrou como`,
        resource: event.user_role || 'Usuário',
        in: metadata.project_name || companyName
      };
    }
    
    return {
      action: 'Realizou ação em',
      resource: resourceName || 'Recurso',
      in: metadata.project_name || companyName
    };
  };

  const openProject = (rundownId) => {
    navigate(`/rundown/${rundownId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Banner do Figma - Full Width */}
      <section 
        className="relative mb-6 sm:mb-8 overflow-hidden -mt-3 sm:-mt-6"
        style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full"
        >
          {/* Imagem completa do banner do Figma */}
          <div className="relative w-full flex justify-center">
            <img 
              src="/banner-version-1.0.png"
              alt="Apront Versão 1.0 Lançada - Banner"
              className="w-full h-auto block"
              style={{ width: '100%', maxWidth: 'none', display: 'block' }}
              onError={(e) => {
                // Se a imagem não existir, oculta o banner silenciosamente
                e.target.style.display = 'none';
              }}
            />
            
            {/* Área clicável transparente sobre o botão fake da imagem */}
            <button
              onClick={() => navigate('/updates')}
              className="absolute left-[3.5%] bottom-[9%] w-[152px] h-[56px] sm:left-[4%] sm:bottom-[11%] sm:w-[162px] sm:h-[60px] lg:left-[5.5%] lg:bottom-[13%] lg:w-[180px] lg:h-[65px] bg-transparent cursor-pointer z-10 border-0 p-0 m-0 outline-none"
              style={{ 
                fontFamily: "'Darker Grotesque', sans-serif",
                boxShadow: 'none',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Saiba Mais sobre a Versão 1.0"
            >
              <span className="sr-only">Saiba Mais</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Estatísticas Rápidas - Conforme Figma */}
      <section className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="text-3xl sm:text-[48px] font-extrabold" style={{ color: isLight ? '#080808' : '#ffffff' }}>
            Estatísticas Rápidas
          </h2>
          <StyledButton
            onClick={() => navigate('/analytics')}
            isLight={isLight}
            Icon={BarChart3}
          >
            Ir para Analytics
          </StyledButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Estatística 1: Transmissões este mês */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StyledCard isLight={isLight} className="min-h-[201px] p-4 sm:p-6">
              <div className="flex flex-col h-full justify-between">
                <Film className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-4" style={{ color: '#e71d36' }} />
                <div>
                  <h3 className="text-3xl sm:text-4xl lg:text-[50px] font-extrabold mb-2" style={{ color: isLight ? '#080808' : '#ffffff' }}>
                    {stats.transmissionsThisMonth}
                  </h3>
                  <p className="text-base sm:text-lg lg:text-[33px] font-medium" style={{ color: isLight ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.7)' }}>
                    Transmissões este mês
                  </p>
                </div>
              </div>
            </StyledCard>
          </motion.div>

          {/* Estatística 2: Tempo total ao vivo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StyledCard isLight={isLight} className="min-h-[201px] p-4 sm:p-6">
              <div className="flex flex-col h-full justify-between">
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-4" style={{ color: '#e71d36' }} />
                <div>
                  <h3 className="text-3xl sm:text-4xl lg:text-[50px] font-extrabold mb-2" style={{ color: isLight ? '#080808' : '#ffffff' }}>
                    {stats.totalHoursLive}h {stats.totalMinutesLive}m
                  </h3>
                  <p className="text-base sm:text-lg lg:text-[33px] font-medium" style={{ color: isLight ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.7)' }}>
                    Tempo total ao vivo
                  </p>
                </div>
              </div>
            </StyledCard>
          </motion.div>

          {/* Estatística 3: Alterações este mês */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StyledCard isLight={isLight} className="min-h-[201px] p-4 sm:p-6">
              <div className="flex flex-col h-full justify-between">
                <Edit3 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-4" style={{ color: '#e71d36' }} />
                <div>
                  <h3 className="text-3xl sm:text-4xl lg:text-[50px] font-extrabold mb-2" style={{ color: isLight ? '#080808' : '#ffffff' }}>
                    {stats.changesThisMonth}
                  </h3>
                  <p className="text-base sm:text-lg lg:text-[33px] font-medium" style={{ color: isLight ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.7)' }}>
                    Alterações este mês
                  </p>
                </div>
              </div>
            </StyledCard>
          </motion.div>

          {/* Estatística 4: Membros na equipe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StyledCard isLight={isLight} className="min-h-[201px] p-4 sm:p-6">
              <div className="flex flex-col h-full justify-between">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-4" style={{ color: '#e71d36' }} />
                <div>
                  <h3 className="text-3xl sm:text-4xl lg:text-[50px] font-extrabold mb-2" style={{ color: isLight ? '#080808' : '#ffffff' }}>
                    {stats.teamMembers}
                  </h3>
                  <p className="text-base sm:text-lg lg:text-[33px] font-medium" style={{ color: isLight ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.7)' }}>
                    Membros na equipe
                  </p>
                </div>
              </div>
            </StyledCard>
          </motion.div>

          {/* Estatística 5: Projetos existentes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <StyledCard isLight={isLight} className="min-h-[201px] p-4 sm:p-6">
              <div className="flex flex-col h-full justify-between">
                <Folder className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-4" style={{ color: '#e71d36' }} />
                <div>
                  <h3 className="text-3xl sm:text-4xl lg:text-[50px] font-extrabold mb-2" style={{ color: isLight ? '#080808' : '#ffffff' }}>
                    {stats.existingProjects}
                  </h3>
                  <p className="text-base sm:text-lg lg:text-[33px] font-medium" style={{ color: isLight ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.7)' }}>
                    Projetos existentes
                  </p>
                </div>
              </div>
            </StyledCard>
          </motion.div>
        </div>
      </section>

      {/* Registro de Auditoria - Conforme Figma */}
      <section className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="text-3xl sm:text-[48px] font-extrabold" style={{ color: isLight ? '#080808' : '#ffffff' }}>
            Registro de Auditoria
          </h2>
          {user?.role === 'admin' && (
            <StyledButton
              onClick={() => navigate('/auditoria')}
              isLight={isLight}
              Icon={BarChart3}
            >
              Ver Todos os Logs
            </StyledButton>
          )}
        </div>

        {loadingEvents ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando eventos...</p>
          </div>
        ) : auditEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum evento de auditoria encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
            {auditEvents.slice(0, 6).map((event, index) => {
              const eventAction = formatEventAction(event);
              const userRole = event.user_role || event.metadata?.role || 'Operador';
              const isPresenter = userRole?.toLowerCase().includes('apresentador');
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StyledCard isLight={isLight} className="h-[180px] p-3 sm:p-4">
                    <div className="flex flex-col h-full">
                      {/* Avatar e nome do usuário */}
                      <div className="flex items-start gap-3 mb-3 flex-shrink-0">
                        <img
                          src={event.user_avatar ? `${API_BASE_URL}/api/user/avatar/${event.user_avatar}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(event.user_name || 'Usuário')}&background=random&rounded=true`}
                          alt={`Avatar de ${event.user_name}`}
                          className="w-8 h-8 sm:w-9 sm:h-9 lg:w-[39px] lg:h-[39px] rounded-full object-cover flex-shrink-0"
                          onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.user_name || 'Usuário')}&background=random&rounded=true`; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-lg sm:text-xl lg:text-[25px] font-extrabold truncate" style={{ color: isLight ? '#080808' : '#ffffff' }}>
                            {event.user_name || 'Usuário'}
                          </p>
                          <p className="text-sm sm:text-base lg:text-[16px] font-medium truncate" style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255,255,255,0.5)' }}>
                            {userRole} | {formatTimeAgo(event.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Ação */}
                      <div className="flex-1 flex flex-col justify-end min-h-0">
                        <p className="text-sm sm:text-base lg:text-[20px] font-medium leading-tight line-clamp-2" style={{ color: isLight ? '#080808' : '#ffffff' }}>
                          <span>{eventAction.action} </span>
                          <span className="font-bold underline" style={{ color: '#e71d36' }}>
                            {eventAction.resource}
                          </span>
                        </p>
                        <p className="text-sm sm:text-base lg:text-[20px] font-medium leading-tight mt-1 line-clamp-1" style={{ color: isLight ? '#080808' : '#ffffff' }}>
                          <span>em </span>
                          <span className="font-bold underline" style={{ color: '#e71d36' }}>
                            {eventAction.in}
                          </span>
                        </p>
                      </div>
                    </div>
                  </StyledCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Rodapé */}
      <Footer />
    </div>
  );
};

export default Dashboard;