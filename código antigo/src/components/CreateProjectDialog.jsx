import React, { useState, useEffect } from 'react';
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

  const isEditing = !!projectToEdit;

  useEffect(() => {
    if (isEditing) {
      setProjectName(projectToEdit.name);
      setProjectType(projectToEdit.type);
    } else {
      setProjectName('');
      setProjectType('Esportes');
    }
  }, [projectToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      return;
    }
    onSave({ name: projectName, type: projectType });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Rundown' : 'Criar Novo Rundown'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Altere os detalhes do seu rundown.' : 'Dê um nome e escolha um tipo para o seu novo rundown.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Criar Rundown'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;