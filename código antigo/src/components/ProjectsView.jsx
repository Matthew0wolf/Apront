import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Play, Edit, Trash2, Clock, Users, Folder, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CreateProjectDialog from '@/components/CreateProjectDialog';
import { useRundown } from '@/contexts/RundownContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ProjectsView = () => {
  const { rundowns, handleCreateRundown, handleUpdateRundown, handleDeleteRundown, loadRundownState, isRunning, activeRundown } = useRundown();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const filteredProjects = rundowns.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || project.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || project.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleSelectProject = project => {
    loadRundownState(project.id);
    navigate(`/project/${project.id}/select-role`);
    toast({
      title: "✅ Rundown Selecionado",
      description: `${project.name} está pronto para uso!`
    });
  };

  const openEditDialog = (project) => {
    setProjectToEdit(project);
    setCreateDialogOpen(true);
  };

  const openCreateDialog = () => {
    setProjectToEdit(null);
    setCreateDialogOpen(true);
  };

  const handleSave = (data) => {
    if (projectToEdit) {
      handleUpdateRundown(projectToEdit.id, data);
    } else {
      handleCreateRundown(data);
    }
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      handleDeleteRundown(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-1">Meus Rundowns</h1>
          <p className="text-muted-foreground">Gerencie seus rundowns e transmissões</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Rundown
        </Button>
      </div>

      <CreateProjectDialog 
        isOpen={isCreateDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onSave={handleSave}
        projectToEdit={projectToEdit}
      />

      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o rundown "{projectToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input type="text" placeholder="Buscar rundowns..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-secondary border border-transparent rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-colors" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2.5 bg-secondary border border-transparent rounded-lg text-foreground focus:border-primary focus:outline-none transition-colors">
          <option value="all">Todos os Tipos</option>
          <option value="Esportes">Esportes</option>
          <option value="Jornalismo">Jornalismo</option>
          <option value="Entretenimento">Entretenimento</option>
          <option value="Podcast">Podcast</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project, index) => {
          const isProjectActive = isRunning && activeRundown?.id === project.id;

          return (
            <motion.div 
              key={project.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.05 }} 
              className={`bg-card rounded-xl border p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 ${isProjectActive ? 'border-red-500/50' : 'border-border hover:border-primary/50'}`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-1">{project.name}</h3>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      {project.type}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 -mr-2 -mt-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(project)}>
                        <Edit className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({ title: "🚧 Não implementado" })}>
                        <Users className="w-4 h-4 mr-2" /> Gerenciar Equipe
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setProjectToDelete(project)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{project.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{project.teamMembers} membros</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Folder className="w-4 h-4" /> Pastas do Rundown:
                  </p>
                  <div className="space-y-1.5">
                    {project.items && project.items.length > 0 ? (
                      <>
                        {project.items.slice(0, 2).map(item => (
                          <div key={item.id} className="text-sm text-foreground bg-secondary rounded px-3 py-1.5 truncate">
                            {item.title}
                          </div>
                        ))}
                        {project.items.length > 2 && (
                          <div className="text-xs text-muted-foreground px-3 py-1">
                            +{project.items.length - 2} mais...
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground bg-secondary/50 rounded px-3 py-1.5">Nenhuma pasta ainda.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  {isProjectActive ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      Ao Vivo
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${
                      project.status === 'Modelo' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        project.status === 'Modelo' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}></div>
                      {project.status}
                    </div>
                  )}
                  <span>Modificado em {new Date(project.lastModified).toLocaleDateString('pt-BR')}</span>
                </div>
                <Button size="lg" className="w-full" onClick={() => handleSelectProject(project)}>
                  <Play className="w-5 h-5 mr-2" />
                  Abrir Rundown
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-16 col-span-full">
          <div className="text-muted-foreground mb-4">
            <Search className="w-16 h-16 mx-auto mb-6 opacity-30" />
            <p className="text-lg">Nenhum rundown encontrado</p>
            <p className="text-sm">Tente ajustar os filtros de busca ou crie um novo rundown.</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProjectsView;