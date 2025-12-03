import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FileText, Filter, Download, Search, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { API_BASE_URL } from '@/config/api';

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
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const AuditoriaView = () => {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const eventsPerPage = 20;

  useEffect(() => {
    if (user?.role === 'admin') {
      loadEvents();
    }
  }, [filterType, user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/api/notifications/events?limit=500`;
      
      if (filterType !== 'all') {
        url += `&event_type=${filterType}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        throw new Error('Erro ao carregar eventos');
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os eventos de auditoria'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
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

  const formatEventAction = (event) => {
    const eventType = event.event_type || '';
    const metadata = event.metadata || {};
    const resourceName = metadata.name || metadata.resource_name || metadata.project_name || 'Recurso';
    const companyName = event.company_name || 'Sistema';
    
    if (eventType.includes('rundown.created') || eventType.includes('project.created')) {
      return {
        action: `Criou o projeto`,
        resource: resourceName,
        in: companyName
      };
    }
    
    if (eventType.includes('rundown.deleted') || eventType.includes('project.deleted')) {
      return {
        action: `Deletou o projeto`,
        resource: resourceName,
        in: companyName
      };
    }
    
    if (eventType.includes('script_updated') || eventType.includes('script.added')) {
      const itemTitle = metadata.item_title || 'evento';
      return {
        action: metadata.has_script ? `Adicionou script ao evento` : `Modificou script do evento`,
        resource: itemTitle,
        in: metadata.project_name || 'Projeto'
      };
    }
    
    if (eventType.includes('structure_updated') || eventType.includes('rundown.updated')) {
      return {
        action: `Modificou a estrutura do projeto`,
        resource: resourceName,
        in: companyName
      };
    }
    
    if (eventType.includes('item.add') || eventType.includes('event.add')) {
      return {
        action: `Adicionou o evento`,
        resource: resourceName || 'Evento',
        in: metadata.project_name || resourceName
      };
    }
    
    if (eventType.includes('item.remove') || eventType.includes('folder.remove')) {
      return {
        action: `Removeu`,
        resource: resourceName || 'item',
        in: metadata.project_name || 'Projeto'
      };
    }
    
    return {
      action: 'Realizou ação em',
      resource: resourceName || 'Recurso',
      in: metadata.project_name || companyName
    };
  };

  const filteredEvents = events.filter(event => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        event.user_name?.toLowerCase().includes(searchLower) ||
        event.event_type?.toLowerCase().includes(searchLower) ||
        JSON.stringify(event.metadata || {}).toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    return true;
  });

  const paginatedEvents = filteredEvents.slice(
    (page - 1) * eventsPerPage,
    page * eventsPerPage
  );

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <p className="text-xl text-muted-foreground">Acesso negado. Apenas administradores podem ver esta página.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
      {/* Cabeçalho */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-[48px] font-extrabold mb-2 flex items-center gap-3" style={{ color: isLight ? '#080808' : '#ffffff' }}>
          <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
          Registro de Auditoria Completo
        </h1>
        <p className="text-base sm:text-lg" style={{ color: isLight ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.7)' }}>
          Visualize todos os eventos e ações realizadas no sistema
        </p>
      </div>

      {/* Filtros e Busca */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255,255,255,0.5)' }} />
            <Input
              placeholder="Buscar por usuário, ação ou projeto..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10"
              style={{
                backgroundColor: isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C',
                borderColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)',
                color: isLight ? '#080808' : '#ffffff'
              }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Todos
            </Button>
            <Button
              variant={filterType === 'rundown.created' ? 'default' : 'outline'}
              onClick={() => setFilterType('rundown.created')}
            >
              Criados
            </Button>
            <Button
              variant={filterType === 'rundown.deleted' ? 'default' : 'outline'}
              onClick={() => setFilterType('rundown.deleted')}
            >
              Deletados
            </Button>
            <Button
              variant={filterType === 'item.script_updated' ? 'default' : 'outline'}
              onClick={() => setFilterType('item.script_updated')}
            >
              Scripts
            </Button>
            <Button
              variant={filterType === 'rundown.structure_updated' ? 'default' : 'outline'}
              onClick={() => setFilterType('rundown.structure_updated')}
            >
              Modificações
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={{ color: isLight ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.7)' }}>Carregando eventos...</p>
        </div>
      ) : paginatedEvents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255,255,255,0.5)' }} />
          <p className="text-xl font-semibold mb-2" style={{ color: isLight ? '#080808' : '#ffffff' }}>
            Nenhum evento encontrado
          </p>
          <p style={{ color: isLight ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.7)' }}>
            {searchTerm ? 'Tente ajustar os filtros de busca' : 'Os eventos aparecerão aqui conforme forem registrados'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6">
            {paginatedEvents.map((event, index) => {
              const eventAction = formatEventAction(event);
              const userRole = event.user_role || event.metadata?.role || 'Operador';
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm" style={{ color: isLight ? 'rgba(8,8,8,0.7)' : 'rgba(255,255,255,0.7)' }}>
                Mostrando {((page - 1) * eventsPerPage) + 1} a {Math.min(page * eventsPerPage, filteredEvents.length)} de {filteredEvents.length} eventos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditoriaView;

