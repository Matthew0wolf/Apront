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
  const [rundownMembers, setRundownMembers] = useState([]); // Membros atuais do rundown (com roles)
  const { token, user } = useContext(AuthContext);
  const { apiCall } = useApi();

  const isEditing = !!projectToEdit && !projectToEdit.manageTeam;
  const managingTeam = !!projectToEdit && projectToEdit.manageTeam;

  useEffect(() => {
    if (managingTeam) {
      // No modo gerenciar equipe, não precisa setar nome/tipo
      // Os membros serão carregados no outro useEffect
      return;
    }
    
    if (isEditing) {
      setProjectName(projectToEdit.name);
      setProjectType(projectToEdit.type);
      setSelectedMembers([]);
    } else {
      setProjectName('');
      setProjectType('Esportes');
      setSelectedMembers([]);
    }
  }, [projectToEdit, isOpen, managingTeam, isEditing]);

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
          // Salva membros completos (com roles) para identificar owner
          setRundownMembers(data.members || []);
          // Marca TODOS os membros atuais como selecionados (incluindo owner, mas owner será filtrado na UI)
          // IMPORTANTE: Todos os membros que já estão no rundown devem aparecer selecionados
          const currentMemberIds = (data.members || []).map(m => m.id);
          setSelectedMembers(currentMemberIds);
          console.log('[DIALOG] Membros carregados do rundown:', data.members);
          console.log('[DIALOG] IDs selecionados:', currentMemberIds);
        })
        .catch(() => {
          setRundownMembers([]);
          setSelectedMembers([]);
        });
    } else {
      setRundownMembers([]);
    }
  }, [isOpen, token, apiCall, managingTeam, projectToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!managingTeam && !projectName.trim()) {
      return;
    }
    
    // Garante que members seja sempre um array
    // IMPORTANTE: Remove o owner da lista antes de enviar (o backend sempre mantém o owner)
    let members = Array.isArray(selectedMembers) ? selectedMembers : [];
    
    if (managingTeam && rundownMembers.length > 0) {
      // Remove o owner da lista de membros a enviar (backend sempre mantém)
      const owner = rundownMembers.find(m => m.rundown_role === 'owner');
      if (owner) {
        members = members.filter(id => id !== owner.id);
        console.log('[DIALOG] Owner removido da lista de membros a enviar:', owner.id);
      }
    }
    
    console.log('[DIALOG] Salvando:', { managingTeam, members, selectedMembers, projectToEdit });
    
    onSave({ 
      name: projectName, 
      type: projectType, 
      members: members
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
                  
                  {/* Mostra owner separadamente se estiver gerenciando equipe */}
                  {managingTeam && rundownMembers.length > 0 && (() => {
                    const owner = rundownMembers.find(m => m.rundown_role === 'owner');
                    if (owner) {
                      return (
                        <div key={`owner-${owner.id}`} className="flex items-center gap-2 pb-2 mb-2 border-b">
                          <input
                            type="checkbox"
                            checked={true}
                            disabled={true}
                            className="opacity-50 cursor-not-allowed"
                          />
                          <span className="font-medium">{owner.name} ({owner.role}) - <span className="text-blue-500">Criador</span></span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Lista de membros (excluindo owner se estiver gerenciando) */}
                  {team
                    .filter(member => {
                      // Se estiver gerenciando equipe, exclui o owner da lista de checkboxes
                      if (managingTeam && rundownMembers.length > 0) {
                        const owner = rundownMembers.find(m => m.rundown_role === 'owner');
                        return owner && member.id !== owner.id;
                      }
                      return true;
                    })
                    .map(member => (
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
                <div className="text-xs text-muted-foreground mt-2">
                  {managingTeam 
                    ? 'O criador sempre terá acesso e não pode ser removido. Selecione ou desmarque outros membros.'
                    : 'Selecione os membros que terão acesso a este rundown. Se nenhum for selecionado, apenas você terá acesso.'}
                </div>
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