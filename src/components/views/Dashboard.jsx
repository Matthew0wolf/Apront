import React, { useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, FolderOpen, ChevronRight, ExternalLink, Clock, 
  TrendingUp, Users, Folder, Calendar, Award, Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRundown } from '@/contexts/RundownContext.jsx';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/contexts/AuthContext.jsx';

const Dashboard = () => {
  const { rundowns } = useRundown();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Pega os 4 projetos mais recentes para "Acesso Rápido"
  const recentProjects = rundowns.slice(0, 4);

  // Calcula estatísticas
  const stats = useMemo(() => {
    const totalProjects = rundowns.length;
    const liveProjects = rundowns.filter(r => r.status === 'live' || r.status === 'Ao Vivo').length;
    
    // Calcula total de horas (converte duração de string para minutos)
  const totalMinutes = rundowns.reduce((acc, r) => {
      const duration = r.duration || '0';
      const match = duration.match(/(\d+)h?\s*(\d+)?/);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const mins = parseInt(match[2]) || 0;
        return acc + (hours * 60) + mins;
      }
      return acc;
    }, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    
    // Projetos desta semana (simplificado - últimos 7 dias)
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekProjects = rundowns.filter(r => {
      const created = new Date(r.created || r.last_modified);
      return created >= weekAgo;
    }).length;
    
    return {
      totalProjects,
      liveProjects,
      totalHours,
      thisWeekProjects
    };
  }, [rundowns]);

  const openProject = (rundownId) => {
    navigate(`/rundown/${rundownId}`);
  };

  // Formata duração para exibição
  const formatDuration = (duration) => {
    if (!duration) return '0min';
    return duration;
  };

  // Obtém status badge color
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'live':
      case 'ao vivo':
        return 'bg-primary text-white';
      case 'novo':
        return 'bg-green-600 text-white';
      case 'concluído':
      case 'concluido':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Banner Unificado */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-center p-4 sm:p-8 lg:p-12">
              {/* Texto do Banner */}
              <div className="text-white">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
                  Versão 1.0 Lançada!
                </h1>
                <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90">
                  Confira todas as atualizações da Apront 1.0
                </p>
                <Button 
                  className="bg-black hover:bg-black/90 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg h-auto rounded-lg shadow-lg"
                >
                  Saiba Mais
                </Button>
              </div>

              {/* Mockup do Notebook */}
              <div className="relative hidden sm:block">
                {/* Moldura do Notebook */}
                <div className="relative bg-black rounded-t-xl border-4 sm:border-8 border-gray-900 shadow-2xl">
                  {/* Webcam do Notebook */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-800 rounded-full"></div>
                  
                  {/* Tela do Notebook */}
                  <div className="bg-black p-4 sm:p-6 lg:p-8 aspect-video">
                    <div className="space-y-3">
                      {/* Header "AO VIVO" */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full animate-pulse"></div>
                          <span className="text-primary font-bold text-xs sm:text-sm lg:text-base">AO VIVO</span>
                        </div>
                        <span className="text-white font-mono text-xs lg:text-sm">16:40:20</span>
                      </div>

                      {/* Seção "AGORA" */}
                      <div className="bg-primary/20 border border-primary/30 rounded-lg p-2 sm:p-3 lg:p-4">
                        <span className="text-primary text-xs font-bold">AGORA</span>
                        <div className="flex items-center justify-between mt-1 sm:mt-2">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white flex-shrink-0" />
                            <div>
                              <p className="text-white font-semibold text-xs lg:text-sm">Introdução</p>
                              <p className="text-white/70 text-xs hidden lg:block">Apresente o início da transmissão</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white/70 text-xs">Restante</p>
                            <p className="text-white font-bold text-xs sm:text-sm">00:09</p>
                          </div>
                        </div>
                      </div>

                      {/* Próximos Eventos */}
                      <div>
                        <p className="text-white/70 text-xs mb-1 sm:mb-2">Próximos Eventos</p>
                        <div className="space-y-1 sm:space-y-1.5">
                          {['Partida', 'Pré-Jogo', 'Intervalo'].map((event, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-primary rounded-full"></div>
                                <span className="text-white">{event}</span>
                              </div>
                              <span className="text-white/70 font-mono">{['45:00', '20:00', '10:00'][i]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Base/Teclado do Notebook */}
                <div className="relative h-3 bg-gradient-to-b from-gray-900 to-black rounded-b-xl shadow-lg">
                  <div className="absolute inset-x-0 top-0 h-px bg-gray-800"></div>
                </div>
                
                {/* Sombra do Notebook */}
                <div className="absolute -bottom-2 inset-x-4 h-2 bg-black/30 blur-xl rounded-full"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="container mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Total de Projetos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Folder className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-1">{stats.totalProjects}</h3>
            <p className="text-white/80 text-sm sm:text-base">Total de Projetos</p>
          </motion.div>

          {/* Projetos Ao Vivo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-primary to-primary/90 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
              {stats.liveProjects > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold">LIVE</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-1">{stats.liveProjects}</h3>
            <p className="text-white/80 text-sm sm:text-base">Projetos Ao Vivo</p>
          </motion.div>

          {/* Horas de Conteúdo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
              <Award className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-1">{stats.totalHours}h</h3>
            <p className="text-white/80 text-sm sm:text-base">Horas de Conteúdo</p>
          </motion.div>

          {/* Projetos Esta Semana */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg sm:rounded-xl p-4 sm:p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
              <span className="text-xs font-bold bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">7 dias</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-1">{stats.thisWeekProjects}</h3>
            <p className="text-white/80 text-sm sm:text-base">Projetos Esta Semana</p>
          </motion.div>
        </div>
      </section>

      {/* Acesso Rápido */}
      <section className="container mx-auto px-3 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold">Acesso Rápido</h2>
          <Button
            variant="outline"
            onClick={() => navigate('/projects')}
            className="gap-2 w-full sm:w-auto"
          >
            <FolderOpen className="w-4 h-4" />
            Ir para Meus Roteiros
          </Button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground text-base sm:text-lg mb-4">
              Nenhum projeto criado ainda
            </p>
            <Button onClick={() => navigate('/projects')} className="w-full sm:w-auto">
              Criar Primeiro Projeto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {recentProjects.map((project, index) => (
            <motion.div
              key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-lg sm:rounded-xl overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all relative group cursor-pointer"
                onClick={() => openProject(project.id)}
              >
                {/* Header com Gradiente */}
                <div className={`p-3 sm:p-4 ${
                  project.status?.toLowerCase() === 'ao vivo' || project.status?.toLowerCase() === 'live'
                    ? 'bg-gradient-to-r from-primary to-primary/90'
                    : 'bg-gradient-to-r from-gray-700 to-gray-800'
                } text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(project.status)}`}>
                      {project.status || 'Novo'}
                    </span>
                    {(project.status?.toLowerCase() === 'ao vivo' || project.status?.toLowerCase() === 'live') && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold">LIVE</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-base sm:text-lg line-clamp-2">
                    {project.name || `Projeto ${project.id}`}
                  </h3>
                </div>

                {/* Conteúdo */}
                <div className="p-3 sm:p-4">
                  {/* Tipo do Projeto */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                    <Folder className="w-4 h-4" />
                    <span>{project.type || 'Transmissão'}</span>
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        Duração
                      </span>
                      <span className="font-semibold">{formatDuration(project.duration)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        Equipe
                      </span>
                      <span className="font-semibold">{project.team_members || 1} {project.team_members === 1 ? 'membro' : 'membros'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        Modificado
                      </span>
                      <span className="font-semibold">{project.last_modified || project.created || 'Hoje'}</span>
                    </div>
                  </div>

                  {/* Botão Abrir Projeto */}
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white gap-2 text-sm sm:text-base"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProject(project.id);
                    }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Abrir Projeto
                  </Button>
                </div>
            </motion.div>
          ))}
        </div>
        )}
      </section>

      {/* Atalhos Rápidos */}
      <section className="container mx-auto px-3 sm:px-6 pb-8 sm:pb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Atalhos Rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Criar Novo Projeto */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate('/projects')}
            className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg sm:rounded-xl p-4 sm:p-6 text-left transition-all shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Criar Novo Projeto</h3>
            <p className="text-white/80 text-xs sm:text-sm">Comece um novo roteiro do zero ou use um template</p>
          </motion.button>

          {/* Explorar Modelos */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => navigate('/templates')}
            className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg sm:rounded-xl p-4 sm:p-6 text-left transition-all shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Explorar Modelos</h3>
            <p className="text-white/80 text-xs sm:text-sm">Descubra templates prontos da comunidade</p>
          </motion.button>

          {/* Gerenciar Equipe */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            onClick={() => navigate('/team')}
            className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg sm:rounded-xl p-4 sm:p-6 text-left transition-all shadow-lg hover:shadow-xl group"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Gerenciar Equipe</h3>
            <p className="text-white/80 text-xs sm:text-sm">Adicione membros e gerencie permissões</p>
          </motion.button>
        </div>
      </section>

      {/* Mensagem de Boas-Vindas (somente para novos usuários) */}
      {rundowns.length === 0 && (
        <section className="container mx-auto px-3 sm:px-6 pb-8 sm:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              Bem-vindo ao Apront, {user?.name || 'Usuário'}! 🎉
            </h2>
            <p className="text-base sm:text-lg mb-4 sm:mb-6 opacity-90">
              Você está pronto para criar seu primeiro projeto de transmissão profissional.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                onClick={() => navigate('/projects')}
                className="bg-white hover:bg-gray-100 text-indigo-600 font-semibold px-6 py-4 sm:py-6 h-auto w-full sm:w-auto"
              >
                Criar Meu Primeiro Projeto
              </Button>
              <Button
                onClick={() => navigate('/templates')}
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-6 py-4 sm:py-6 h-auto w-full sm:w-auto"
              >
                Explorar Templates
              </Button>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
