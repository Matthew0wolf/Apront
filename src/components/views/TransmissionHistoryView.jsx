import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Calendar, User, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TransmissionHistoryView = () => {
  const { toast } = useToast();
  const [transmissions, setTransmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/history/transmissions?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransmissions(data.transmissions);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o histórico"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/history/transmissions/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Histórico de Transmissões</h2>
        <p className="text-muted-foreground">
          Acompanhe todas as transmissões realizadas pela sua equipe
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total</p>
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.total_transmissions}</p>
            <p className="text-xs text-muted-foreground mt-1">transmissões</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Tempo Total</p>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{formatTime(stats.total_duration)}</p>
            <p className="text-xs text-muted-foreground mt-1">no ar</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Média</p>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold">{formatTime(stats.average_duration)}</p>
            <p className="text-xs text-muted-foreground mt-1">por transmissão</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold">
              {stats.total_transmissions > 0 
                ? Math.round((stats.completed / stats.total_transmissions) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completed} completas, {stats.interrupted} interrompidas
            </p>
          </motion.div>
        </div>
      )}

      {/* Lista de Transmissões */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-bold">Transmissões Recentes</h3>
        </div>

        <div className="divide-y divide-border">
          {transmissions.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma transmissão registrada
              </h3>
              <p className="text-muted-foreground">
                As transmissões ao vivo serão registradas automaticamente aqui
              </p>
            </div>
          ) : (
            transmissions.map((transmission, index) => (
              <motion.div
                key={transmission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold">{transmission.rundown_name}</h4>
                      {transmission.status === 'completed' ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completa
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Interrompida
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Data</p>
                        <p className="font-medium">{formatDate(transmission.started_at)}</p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Duração</p>
                        <p className="font-medium">{formatTime(transmission.total_duration)}</p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Operador</p>
                        <p className="font-medium flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {transmission.user_name}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Itens</p>
                        <p className="font-medium">
                          {transmission.items_completed} de {transmission.items_total}
                        </p>
                      </div>
                    </div>

                    {transmission.notes && (
                      <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">{transmission.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TransmissionHistoryView;

