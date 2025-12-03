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
  const MAX_NAME_LENGTH = 50;

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
    
    // Se estiver editando ou gerenciando equipe, carrega membros atuais do rundown
    if ((isEditing || managingTeam) && projectToEdit?.id) {
      apiCall(`/api/rundowns/${projectToEdit.id}/members`)
        .then(res => res.ok ? res.json() : { members: [] })
        .then(data => {
          // Salva membros completos (com roles) para identificar owner
          setRundownMembers(data.members || []);
          // Marca apenas os membros NÃO-owner como selecionados (owner será mostrado separadamente e não precisa estar no selectedMembers)
          // IMPORTANTE: Garante que IDs sejam comparáveis (convertendo para número se necessário)
          const owner = (data.members || []).find(m => m.rundown_role === 'owner');
          const currentMemberIds = (data.members || [])
            .filter(m => m.rundown_role !== 'owner') // Remove owner da lista de selecionados
            .map(m => typeof m.id === 'string' ? parseInt(m.id) : m.id); // Garante tipo consistente
          setSelectedMembers(currentMemberIds);
          console.log('[DIALOG] Membros carregados do rundown:', data.members);
          console.log('[DIALOG] Owner:', owner);
          console.log('[DIALOG] IDs selecionados (sem owner):', currentMemberIds);
        })
        .catch(() => {
          setRundownMembers([]);
          setSelectedMembers([]);
        });
    } else {
      setRundownMembers([]);
    }
  }, [isOpen, token, apiCall, managingTeam, isEditing, projectToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!managingTeam && !projectName.trim()) {
      return;
    }
    if (!managingTeam && projectName.length > MAX_NAME_LENGTH) {
      // O maxLength já previne isso, mas garantimos aqui também
      return;
    }
    
    // Garante que members seja sempre um array
    // IMPORTANTE: Owner não deve estar em selectedMembers (já foi filtrado ao carregar), mas garantimos aqui também
    let members = Array.isArray(selectedMembers) ? selectedMembers : [];
    
    if (managingTeam && rundownMembers.length > 0) {
      // Remove o owner da lista de membros a enviar (backend sempre mantém)
      // Garante comparação correta mesmo se IDs forem de tipos diferentes
      const owner = rundownMembers.find(m => m.rundown_role === 'owner');
      if (owner) {
        const ownerId = typeof owner.id === 'string' ? parseInt(owner.id) : owner.id;
        members = members.filter(id => {
          const memberId = typeof id === 'string' ? parseInt(id) : id;
          return memberId !== ownerId;
        });
        console.log('[DIALOG] Owner removido da lista de membros a enviar:', ownerId);
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
              <div className="col-span-3">
                <Input
                  id="name"
                  value={projectName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= MAX_NAME_LENGTH) {
                      setProjectName(value);
                    }
                  }}
                  className={projectName.length > MAX_NAME_LENGTH ? 'border-red-500' : ''}
                  placeholder="Ex: Final do Campeonato"
                  required
                  maxLength={MAX_NAME_LENGTH}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {projectName.length}/{MAX_NAME_LENGTH} caracteres
                  {projectName.length > MAX_NAME_LENGTH && (
                    <span className="text-red-500 ml-2">Limite excedido</span>
                  )}
                </p>
              </div>
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
                  
                  {/* Mostra owner separadamente se estiver editando ou gerenciando equipe */}
                  {(isEditing || managingTeam) && rundownMembers.length > 0 && (() => {
                    const owner = rundownMembers.find(m => m.rundown_role === 'owner');
                    if (owner) {
                      // Verifica se o owner também está na lista de membros da empresa (para evitar duplicação)
                      const ownerInTeam = team.find(m => {
                        const ownerId = typeof owner.id === 'string' ? parseInt(owner.id) : owner.id;
                        const memberId = typeof m.id === 'string' ? parseInt(m.id) : m.id;
                        return ownerId === memberId;
                      });
                      
                      // Só mostra se realmente for o owner do rundown
                      return (
                        <div key={`owner-${owner.id}`} className="flex items-center gap-2 pb-2 mb-2 border-b">
                          <input
                            type="checkbox"
                            checked={true}
                            disabled={true}
                            className="opacity-50 cursor-not-allowed"
                          />
                          <span className="font-medium">
                            {owner.name} ({owner.role}) - <span className="text-blue-500">Criador</span>
                            {ownerInTeam && <span className="text-xs text-muted-foreground ml-2">(não pode ser removido)</span>}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Lista de membros (excluindo owner se estiver editando ou gerenciando) */}
                  {team
                    .filter(member => {
                      // Se estiver editando ou gerenciando equipe, exclui o owner da lista de checkboxes
                      if ((isEditing || managingTeam) && rundownMembers.length > 0) {
                        const owner = rundownMembers.find(m => m.rundown_role === 'owner');
                        if (owner) {
                          // Garante comparação correta mesmo se IDs forem de tipos diferentes
                          const ownerId = typeof owner.id === 'string' ? parseInt(owner.id) : owner.id;
                          const memberId = typeof member.id === 'string' ? parseInt(member.id) : member.id;
                          return ownerId !== memberId;
                        }
                      }
                      return true;
                    })
                    .map(member => {
                      // Garante comparação correta de IDs para o checkbox
                      const memberId = typeof member.id === 'string' ? parseInt(member.id) : member.id;
                      const isSelected = selectedMembers.some(id => {
                        const selectedId = typeof id === 'string' ? parseInt(id) : id;
                        return selectedId === memberId;
                      });
                      
                      return (
                        <label key={member.email} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers(prev => {
                                  // Evita duplicatas
                                  if (prev.some(id => {
                                    const prevId = typeof id === 'string' ? parseInt(id) : id;
                                    return prevId === memberId;
                                  })) {
                                    return prev;
                                  }
                                  return [...prev, memberId];
                                });
                              } else {
                                setSelectedMembers(prev => prev.filter(id => {
                                  const prevId = typeof id === 'string' ? parseInt(id) : id;
                                  return prevId !== memberId;
                                }));
                              }
                            }}
                          />
                          <span>{member.name} ({member.role})</span>
                        </label>
                      );
                    })}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {(isEditing || managingTeam)
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