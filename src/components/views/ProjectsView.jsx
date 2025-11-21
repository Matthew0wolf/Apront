import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Play, Clock, Users, Folder, MoreVertical, ChevronDown, Minus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import CreateProjectDialog from '@/components/dialogs/CreateProjectDialog';
import { useRundown } from '@/contexts/RundownContext.jsx';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/contexts/AuthContext.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProjectsView = () => {
  const { rundowns, handleCreateRundown, handleDeleteRundown, handleUpdateRundownMembers, loadRundownState, isRunning, activeRundown } = useRundown();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectToManage, setProjectToManage] = useState(null);
  
  // Verifica se o usuário tem permissão para gerenciar rundowns (admin ou operador)
  const canManageRundowns = user && (user.role === 'admin' || user.role === 'operator');

  // Garante que rundowns seja sempre um array válido
  const safeRundowns = Array.isArray(rundowns) ? rundowns : [];
  
  const filteredProjects = safeRundowns.filter(project => {
    if (!project || typeof project !== 'object') return false;
    const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? true;
    const matchesType = filterType === 'all' || project.type?.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const handleSelectProject = project => {
    loadRundownState(project.id);
    navigate(`/project/${project.id}/select-role`);
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    
    try {
      await handleDeleteRundown(projectId);
      toast({
        title: "Projeto excluído",
        description: "O projeto foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o projeto.",
        variant: "destructive",
      });
    }
  };

  // Identifica o projeto ativo (ao vivo)
  const liveProject = isRunning && activeRundown ? rundowns.find(r => r.id === activeRundown.id) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Gradiente Vermelho */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Meus Roteiros</h1>
              <p className="text-white/90 text-lg">
                Gerencia seus roteiros e transmissões
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-white hover:bg-white/90 text-red-600 font-semibold gap-2 h-11 px-6"
            >
              <Plus className="w-5 h-5" />
              Novo Projeto
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar roteiros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-11 px-4">
                  Todos os tipos
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setFilterType('all')}>
                  Todos os tipos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('esportes')}>
                  Esportes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('shows')}>
                  Shows
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('eventos')}>
                  Eventos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Grid de Projetos */}
      <div className="container mx-auto px-6 py-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado ainda'}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Projeto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => {
              const isLive = liveProject && liveProject.id === project.id;
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card border rounded-xl p-6 hover:shadow-lg transition-all relative ${
                    isLive ? 'border-red-500 border-2' : 'border-border'
                  }`}
                >
                  {/* Menu 3 Pontos */}
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSelectProject(project)}>
                          <Play className="w-4 h-4 mr-2" />
                          Abrir Projeto
                        </DropdownMenuItem>
                        {canManageRundowns && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => {
                                // Verifica se o rundown está ao vivo antes de permitir gerenciar equipe
                                if (project.status && project.status.toLowerCase() === 'ao vivo') {
                                  toast({
                                    variant: "destructive",
                                    title: "Ação bloqueada",
                                    description: "Não é possível alterar membros de um rundown que está ao vivo.",
                                  });
                                  return;
                                }
                                setProjectToManage({ ...project, manageTeam: true });
                                setCreateDialogOpen(true);
                              }}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Gerenciar Equipe
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                // Verifica se o rundown está ao vivo antes de permitir deletar
                                if (project.status && project.status.toLowerCase() === 'ao vivo') {
                                  toast({
                                    variant: "destructive",
                                    title: "Ação bloqueada",
                                    description: "Não é possível deletar um rundown que está ao vivo.",
                                  });
                                  return;
                                }
                                handleDelete(project.id);
                              }} 
                              className="text-red-600"
                            >
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Título */}
                  <h3 className="font-bold text-lg mb-3 pr-8">
                    {project.name}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                      Esportes
                    </span>
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                      Futebol
                    </span>
                    {isLive && (
                      <span className="px-3 py-1 bg-red-600 text-white text-xs rounded-full font-semibold">
                        Ao Vivo
                      </span>
                    )}
                  </div>

                  {/* Duração e Membros */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{project.duration || '3h 30min'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{project.members?.length || 2} membros</span>
                    </div>
                  </div>

                  {/* Pastas do Projeto */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                      <Folder className="w-4 h-4" />
                      <span>Pastas do Projeto:</span>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {Array.isArray(project.items) && project.items.length > 0 ? (
                        project.items.slice(0, 3).map((folder, i) => (
                          <div key={folder.id || i} className="flex items-center justify-between">
                            <span className="text-foreground">{folder.title || `Pasta ${i + 1}`}</span>
                            <span className="text-muted-foreground">
                              {folder.children?.length || 0} itens
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm">Nenhum item ainda</div>
                      )}
                      {Array.isArray(project.items) && project.items.length > 3 && (
                        <div className="text-muted-foreground text-sm">
                          +{project.items.length - 3} mais...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Data de Modificação */}
                  <div className="text-xs text-muted-foreground mb-4">
                    Modificado em {new Date(project.lastModified || Date.now()).toLocaleDateString('pt-BR')}
                  </div>

                  {/* Botão Abrir Projeto */}
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
                    onClick={() => handleSelectProject(project)}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Abrir Projeto
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>


      {/* Dialog Criar/Editar Projeto */}
      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setProjectToManage(null);
        }}
        projectToEdit={projectToManage}
        onSave={async (data) => {
          console.log('[PROJECTS VIEW] onSave chamado:', { projectToManage, data });
          
          if (projectToManage?.manageTeam) {
            // Atualizar membros do rundown
            console.log('[PROJECTS VIEW] Atualizando membros do rundown:', projectToManage.id, data.members);
            await handleUpdateRundownMembers(projectToManage.id, data.members || []);
          } else {
            // Criar novo rundown
            console.log('[PROJECTS VIEW] Criando novo rundown:', data);
            handleCreateRundown(data);
          }
          setCreateDialogOpen(false);
          setProjectToManage(null);
        }}
      />
    </div>
  );
};

export default ProjectsView;
