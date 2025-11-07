import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SecurityAuditView = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadEvents();
  }, [filterType]);

  const loadEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filterType === 'all' 
        ? '/api/notifications/events?limit=100'
        : `/api/notifications/events?limit=100&event_type=${filterType}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os eventos"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    if (eventType.includes('success') || eventType.includes('login.success')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (eventType.includes('failure') || eventType.includes('denied')) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    } else if (eventType.includes('suspicious') || eventType.includes('warning')) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
    return <Eye className="w-5 h-5 text-blue-500" />;
  };

  const getEventColor = (eventType) => {
    if (eventType.includes('success')) return 'bg-green-500/10 border-green-500/30';
    if (eventType.includes('failure') || eventType.includes('denied')) return 'bg-red-500/10 border-red-500/30';
    if (eventType.includes('suspicious')) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-blue-500/10 border-blue-500/30';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Shield className="w-10 h-10 text-primary" />
          Auditoria de Segurança
        </h1>
        <p className="text-muted-foreground">
          Monitore eventos de segurança e atividades do sistema
        </p>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <p className="text-sm text-muted-foreground">Logins Sucesso</p>
          </div>
          <p className="text-2xl font-bold">
            {events.filter(e => e.event_type === 'auth.login.success').length}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-muted-foreground">Logins Falhos</p>
          </div>
          <p className="text-2xl font-bold">
            {events.filter(e => e.event_type === 'auth.login.failure').length}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <p className="text-sm text-muted-foreground">Acessos Negados</p>
          </div>
          <p className="text-2xl font-bold">
            {events.filter(e => e.event_type.includes('denied')).length}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <p className="text-sm text-muted-foreground">Total de Eventos</p>
          </div>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">Todos os Eventos</option>
            <option value="auth.login.success">✅ Logins Bem-sucedidos</option>
            <option value="auth.login.failure">❌ Logins Falhos</option>
            <option value="security.permission_denied">🚫 Acessos Negados</option>
            <option value="data.create">➕ Criações</option>
            <option value="data.update">✏️ Modificações</option>
            <option value="data.delete">🗑️ Exclusões</option>
          </select>

          <Button variant="outline" size="sm" onClick={loadEvents}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Eventos Recentes</h2>
        </div>

        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum evento encontrado
              </h3>
              <p className="text-muted-foreground">
                Os eventos de segurança aparecerão aqui
              </p>
            </div>
          ) : (
            events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`p-4 border-l-4 ${getEventColor(event.event_type)}`}
              >
                <div className="flex items-start gap-4">
                  {getEventIcon(event.event_type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{event.event_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.user_name} • {event.ip_address}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-secondary/50 rounded text-xs font-mono">
                        {JSON.stringify(event.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-foreground mb-1">Sistema de Auditoria Ativo</p>
            <p className="text-sm text-muted-foreground">
              Todas as ações importantes são registradas e monitoradas. 
              Eventos suspeitos são sinalizados automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAuditView;

