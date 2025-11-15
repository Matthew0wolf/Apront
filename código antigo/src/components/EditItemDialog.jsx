import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ColorPicker from '@/components/ColorPicker';
import * as Icons from 'lucide-react';
import { Upload } from 'lucide-react';

const iconList = [
  'PlayCircle', 'List', 'Mic', 'Zap', 'Repeat', 'MessageSquare', 'DollarSign',
  'Camera', 'Video', 'Music', 'Award', 'BarChart', 'Bell', 'Briefcase', 'ClipboardList',
  'Clock', 'Coffee', 'Cpu', 'CreditCard', 'Database', 'FileText', 'Film', 'Flag',
  'Gift', 'Globe', 'Heart', 'Image', 'Link', 'MapPin', 'Monitor', 'Package', 'Phone',
  'PieChart', 'Rocket', 'Server', 'Shield', 'ShoppingCart', 'Star', 'Tag', 'Target',
  'Trophy', 'Truck', 'Umbrella', 'User', 'Voicemail', 'Wallet', 'Watch', 'Wifi'
];

const EditItemDialog = ({ item, onSave, onClose }) => {
  const [editedItem, setEditedItem] = useState({
    urgency: 'normal',
    reminder: '',
    iconType: 'lucide',
    iconData: 'HelpCircle',
    ...item
  });

  useEffect(() => {
    setEditedItem({
      urgency: 'normal',
      reminder: '',
      iconType: item.iconType || 'lucide',
      iconData: item.iconData || item.icon || 'HelpCircle',
      ...item
    });
  }, [item]);

  const handleChange = (field, value) => {
    setEditedItem(prev => ({ ...prev, [field]: value }));
  };

  const handleIconChange = (iconName) => {
    setEditedItem(prev => ({ ...prev, iconType: 'lucide', iconData: iconName }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedItem(prev => ({ ...prev, iconType: 'image', iconData: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({ ...editedItem, icon: editedItem.iconData });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card">
        <DialogHeader>
          <DialogTitle>Editar Evento do Rundown</DialogTitle>
          <DialogDescription>Faça alterações no evento. As mudanças serão salvas para esta transmissão.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Título</Label>
            <Input id="title" value={editedItem.title} onChange={(e) => handleChange('title', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descrição</Label>
            <Textarea id="description" value={editedItem.description} onChange={(e) => handleChange('description', e.target.value)} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminder" className="text-right">Lembrete</Label>
            <Input id="reminder" value={editedItem.reminder} onChange={(e) => handleChange('reminder', e.target.value)} className="col-span-3" placeholder="Ex: Mostrar patrocinador" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">Duração (s)</Label>
            <Input id="duration" type="number" value={editedItem.duration} onChange={(e) => handleChange('duration', parseInt(e.target.value, 10) || 0)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="urgency" className="text-right">Urgência</Label>
            <select
              id="urgency"
              value={editedItem.urgency}
              onChange={(e) => handleChange('urgency', e.target.value)}
              className="col-span-3 w-full px-3 py-2 bg-background border border-input rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="normal">Normal</option>
              <option value="attention">Atenção</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Cor</Label>
            <div className="col-span-3">
              <ColorPicker color={editedItem.color} onChange={(newColor) => handleChange('color', newColor)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Ícone</Label>
            <div className="col-span-3 space-y-2">
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto p-2 bg-secondary rounded-md border">
                {iconList.map(iconName => {
                  const Icon = Icons[iconName];
                  return (
                    <Button key={iconName} variant="ghost" size="icon" onClick={() => handleIconChange(iconName)} className={`transform transition-transform hover:scale-110 ${editedItem.iconType === 'lucide' && editedItem.iconData === iconName ? 'bg-primary text-primary-foreground' : ''}`}>
                      {Icon ? <Icon className="w-5 h-5" /> : null}
                    </Button>
                  );
                })}
              </div>
              <Label htmlFor="image-upload" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Ou envie uma imagem (PNG, JPG, SVG)</span>
              </Label>
              <Input id="image-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" onChange={handleImageUpload} />
              {editedItem.iconType === 'image' && editedItem.iconData && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={editedItem.iconData} alt="Ícone" className="w-10 h-10 rounded-md object-cover" />
                  <span className="text-sm text-muted-foreground">Imagem selecionada.</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;