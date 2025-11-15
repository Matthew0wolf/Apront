import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EditFolderDialog = ({ folder, onSave, onClose }) => {
  const [editedFolder, setEditedFolder] = useState(folder);

  useEffect(() => {
    setEditedFolder(folder);
  }, [folder]);

  const handleChange = (field, value) => {
    setEditedFolder(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(editedFolder);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>Editar Pasta</DialogTitle>
          <DialogDescription>Altere o nome da pasta. A mudança será salva.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Título</Label>
            <Input 
              id="title" 
              value={editedFolder.title} 
              onChange={(e) => handleChange('title', e.target.value)} 
              className="col-span-3" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFolderDialog;