import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Users, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRundown } from '@/contexts/RundownContext.jsx';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ stat, index }) => {
  const Icon = stat.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-lg hover:border-primary/50 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${stat.color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { rundowns, loadRundownState } = useRundown();
  const { toast } = useToast();
  const navigate = useNavigate();

  const stats = [
    { label: 'Projetos Ativos', value: rundowns.filter(p => p.status === 'Ativo').length, icon: FileText, color: 'from-blue-500 to-cyan-400' },
    { label: 'Modelos', value: rundowns.filter(p => p.status === 'Modelo').length, icon: Play, color: 'from-green-500 to-emerald-400' },
    { label: 'Membros da Equipe', value: '8', icon: Users, color: 'from-purple-500 to-pink-400' },
    { label: 'Tempo Total', value: '24h', icon: Clock, color: 'from-orange-500 to-amber-400' },
  ];

  const recentProjects = rundowns.slice(0, 3);

  const handleQuickStart = (project) => {
    loadRundownState(project.id);
    navigate(`/project/${project.id}/select-role`);
    toast({
      title: "✅ Projeto Selecionado",
      description: `${project.name} está pronto para transmissão!`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 overflow-hidden">
        <div className="relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-foreground tracking-tight"
          >
            Bem-vindo ao seu Estúdio Digital
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg mt-2"
          >
            Gerencie suas transmissões com precisão e estilo.
          </motion.p>
        </div>
        <div className="absolute -top-1/2 -right-1/4 w-full h-[200%] bg-gradient-to-r from-primary/10 via-primary/0 to-primary/0 rounded-full animate-[spin_20s_linear_infinite]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </div>

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Acesso Rápido</h2>
          <Button variant="ghost" className="text-primary hover:text-primary/80" onClick={() => navigate('/projects')}>
            Ver Todos <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid gap-4">
          {recentProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="bg-secondary/50 rounded-lg p-4 border border-border hover:border-primary/50 hover:bg-secondary transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'Ativo' ? 'bg-green-500/20 text-green-300' :
                      project.status === 'Modelo' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">Modificado em {new Date(project.lastModified).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => handleQuickStart(project)}
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Iniciar
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;