import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useApi } from '@/hooks/useApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CreateProjectDialog = ({ isOpen, onOpenChange, onSave, projectToEdit }) => {
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Esportes');
  const [team, setTeam] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const { token } = useContext(AuthContext);
  const { apiCall } = useApi();

  const isEditing = !!projectToEdit && !projectToEdit.manageTeam;
  const managingTeam = !!projectToEdit && projectToEdit.manageTeam;

  useEffect(() => {
    if (isEditing) {
      setProjectName(projectToEdit.name);
      setProjectType(projectToEdit.type);
      setSelectedMembers([]);
    } else {
      setProjectName('');
      setProjectType('Esportes');
      setSelectedMembers([]);
    }
  }, [projectToEdit, isOpen]);

  // Carrega membros da equipe para seleção
  useEffect(() => {
    if (!isOpen || !token) return;
    
    // Carrega lista de membros da empresa
    apiCall('/api/team')
      .then(res => res.ok ? res.json() : { team: [] })
      .then(data => setTeam(data.team || []))
      .catch(() => setTeam([]));
    
    // Se estiver gerenciando equipe, carrega membros atuais do rundown
    if (managingTeam && projectToEdit?.id) {
      apiCall(`/api/rundowns/${projectToEdit.id}/members`)
        .then(res => res.ok ? res.json() : { members: [] })
        .then(data => {
          // Marca os membros atuais como selecionados
          const currentMemberIds = (data.members || []).map(m => m.id);
          setSelectedMembers(currentMemberIds);
        })
        .catch(() => setSelectedMembers([]));
    }
  }, [isOpen, token, apiCall, managingTeam, projectToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!managingTeam && !projectName.trim()) {
      return;
    }
    // Garante que members seja sempre um array
    onSave({ 
      name: projectName, 
      type: projectType, 
      members: Array.isArray(selectedMembers) ? selectedMembers : [] 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
          <DialogTitle>{managingTeam ? 'Gerenciar Equipe do Rundown' : (isEditing ? 'Editar Rundown' : 'Criar Novo Rundown')}</DialogTitle>
            <DialogDescription>
            {managingTeam ? 'Defina quem tem acesso a este rundown.' : (isEditing ? 'Altere os detalhes do seu rundown.' : 'Dê um nome e escolha um tipo para o seu novo rundown.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!managingTeam && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Final do Campeonato"
                required
              />
            </div>
            )}
            {!managingTeam && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <select
                id="type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="col-span-3 w-full px-3 py-2 bg-background border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Esportes">Esportes</option>
                <option value="Jornalismo">Jornalismo</option>
                <option value="Entretenimento">Entretenimento</option>
                <option value="Podcast">Podcast</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Equipe</Label>
              <div className="col-span-3 border border-input p-2 text-sm">
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {team.length === 0 && <div className="text-muted-foreground">Sem membros disponíveis</div>}
                  {team.map(member => (
                    <label key={member.email} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={(e) => {
                          setSelectedMembers(prev => e.target.checked ? [...prev, member.id] : prev.filter(id => id !== member.id));
                        }}
                      />
                      <span>{member.name} ({member.role})</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Admin sempre terá acesso. Selecionados terão acesso a este rundown.</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{managingTeam ? 'Salvar Equipe' : (isEditing ? 'Salvar Alterações' : 'Criar Rundown')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;