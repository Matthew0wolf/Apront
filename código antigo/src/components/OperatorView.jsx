import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, Square, SkipForward, ArrowLeft, Users, Wifi, WifiOff, Edit, Plus, Folder, Trash2, MousePointerClick, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import EditItemDialog from '@/components/EditItemDialog';
import EditFolderDialog from '@/components/EditFolderDialog';
import LiveClock from '@/components/LiveClock';
import * as Icons from 'lucide-react';
import { Reorder, motion } from 'framer-motion';
import { useRundown } from '@/contexts/RundownContext.jsx';
import { useTimer } from '@/contexts/TimerContext.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatTimeShort = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const UrgencyIndicator = ({ urgency }) => {
  const urgencyStyles = {
    normal: 'bg-green-500/20 text-green-500',
    attention: 'bg-yellow-500/20 text-yellow-500',
    urgent: 'bg-red-500/20 text-red-500',
  };
  const urgencyText = {
    normal: 'Normal',
    attention: 'Atenção',
    urgent: 'Urgente',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${urgencyStyles[urgency] || 'bg-gray-500/20 text-gray-400'}`}>
      {urgencyText[urgency] || 'Padrão'}
    </span>
  );
};

const TimeDisplay = React.memo(() => {
  const { timeElapsed } = useTimer();
  return <p className="text-5xl font-mono font-bold tracking-tighter">{formatTime(timeElapsed)}</p>;
});

const getIcon = (item) => {
  if (item.iconType === 'image' && item.iconData) {
    return <img src={item.iconData} alt={item.title} className="w-5 h-5 object-contain" />;
  }
  const Icon = Icons[item.iconData || item.icon];
  return Icon ? <Icon className="w-5 h-5" /> : <Icons.HelpCircle className="w-5 h-5" />;
};

const OperatorView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    activeRundown: rundown,
    setActiveRundown: setRundown,
    currentItemIndex,
    setCurrentItemIndex,
    isRunning,
    setIsRunning,
    handleNextItem: onNext,
    loadRundownState,
    calculateElapsedTimeForIndex,
  } = useRundown();

  const { timeElapsed, setTimeElapsed } = useTimer();

  const [isOnline, setIsOnline] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!rundown || rundown.id !== projectId) {
      const rundownData = loadRundownState(projectId);
      if (!rundownData) {
        toast({ variant: "destructive", title: "Erro", description: "Rundown não encontrado." });
        navigate('/projects');
      }
    }
  }, [projectId, rundown, loadRundownState, navigate, toast]);

  useEffect(() => {
    const connectionInterval = setInterval(() => setIsOnline(Math.random() > 0.1), 5000);
    return () => clearInterval(connectionInterval);
  }, []);

  const totalDuration = useMemo(() => {
    if (!rundown) return 0;
    return rundown.items.reduce((total, folder) => {
      return total + folder.children.reduce((folderTotal, item) => folderTotal + item.duration, 0);
    }, 0);
  }, [rundown]);

  const handlePlayPause = () => setIsRunning(!isRunning);

  const handleStop = () => {
    setIsRunning(false);
    setTimeElapsed(0);
    setCurrentItemIndex(0, 0);
    toast({ title: "⏹️ Transmissão Parada", description: "Rundown resetado." });
  };

  const handleItemUpdate = (updatedItem) => {
    const newRundown = { ...rundown };
    const folderIndex = newRundown.items.findIndex(f => f.children.some(c => c.id === updatedItem.id));
    if (folderIndex !== -1) {
      const itemIndex = newRundown.items[folderIndex].children.findIndex(c => c.id === updatedItem.id);
      if (itemIndex !== -1) {
        newRundown.items[folderIndex].children[itemIndex] = updatedItem;
        setRundown(newRundown);
        toast({ title: "✅ Evento Atualizado", description: `"${updatedItem.title}" foi salvo.` });
      }
    }
    setEditingItem(null);
  };

  const handleFolderUpdate = (updatedFolder) => {
    const newRundown = { ...rundown };
    const folderIndex = newRundown.items.findIndex(f => f.id === updatedFolder.id);
    if (folderIndex !== -1) {
      newRundown.items[folderIndex] = { ...newRundown.items[folderIndex], ...updatedFolder };
      setRundown(newRundown);
      toast({ title: "✅ Pasta Atualizada", description: `"${updatedFolder.title}" foi salva.` });
    }
    setEditingFolder(null);
  };

  const addFolder = () => {
    const newFolder = { id: `folder-${Date.now()}`, title: 'Nova Pasta', type: 'folder', children: [] };
    setRundown(prev => ({ ...prev, items: [...prev.items, newFolder] }));
    toast({ title: "📁 Pasta Adicionada" });
  };

  const addItem = (folderIndex) => {
    const newItem = {
      id: `item-${Date.now()}`, title: 'Novo Evento', duration: 60, description: 'Descrição.',
      type: 'generic', status: 'pending', iconType: 'lucide', iconData: 'Plus', color: '#808080', urgency: 'normal', reminder: ''
    };
    const newRundown = { ...rundown };
    newRundown.items[folderIndex].children.push(newItem);
    setRundown(newRundown);
    toast({ title: "✨ Evento Adicionado" });
  };

  const removeItem = (folderIndex, itemIndex) => {
    const newRundown = { ...rundown };
    newRundown.items[folderIndex].children.splice(itemIndex, 1);
    setRundown(newRundown);
    toast({ variant: "destructive", title: "🗑️ Evento Removido" });
  };

  const removeFolder = (folderIndex) => {
    const newRundown = { ...rundown };
    newRundown.items.splice(folderIndex, 1);
    setRundown(newRundown);
    toast({ variant: "destructive", title: "🗑️ Pasta Removida" });
  };

  const handleFolderReorder = (newOrder) => {
    setRundown(prev => ({ ...prev, items: newOrder }));
  };

  const handleItemReorder = (folderIndex, newOrder) => {
    const newRundown = { ...rundown };
    newRundown.items[folderIndex].children = newOrder;
    setRundown(newRundown);
  };

  if (!rundown) return null;

  return (
    <>
      <div className="h-screen w-screen bg-background text-foreground flex flex-col p-4 gap-4 font-sans">
        <header className="flex items-center justify-between p-2 bg-card border border-border rounded-xl flex-shrink-0 shadow-sm">
          <Button onClick={() => navigate('/projects')} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
          <h1 className="text-xl font-bold truncate px-4">{rundown.name}</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => {
              const url = `${window.location.origin}/project/${rundown.id}/presenter`;
              navigator.clipboard.writeText(url);
              toast({ title: "✅ Link Copiado!", description: "O link para a tela do apresentador foi copiado." });
            }}>Copiar Link</Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4" /> 3</div>
            <LiveClock />
          </div>
        </header>

        <main className="flex-1 flex gap-4 overflow-hidden">
          <div className="w-[320px] flex flex-col gap-4 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center flex-grow">
              <p className="text-muted-foreground mb-2 text-lg">DURAÇÃO TOTAL</p>
              <p className="text-7xl font-mono font-bold tracking-tighter">{formatTime(totalDuration)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <p className="text-muted-foreground mb-2">TEMPO DECORRIDO</p>
              <TimeDisplay />
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center">
              <p className="text-muted-foreground mb-2">STATUS</p>
              <div className={`flex items-center gap-2 text-2xl font-bold ${isRunning ? 'text-red-500' : 'text-gray-500'}`}>
                <div className={`w-4 h-4 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                {isRunning ? 'AO VIVO' : 'PARADO'}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 gap-2">
              <Button onClick={handlePlayPause} className={`h-20 text-lg ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-600 hover:bg-green-700'}`}>
                {isRunning ? <Pause className="w-6 h-6 mr-2" /> : <Play className="w-6 h-6 mr-2" />}
                {isRunning ? 'PAUSAR' : 'INICIAR'}
              </Button>
              <Button onClick={onNext} disabled={!isRunning} className="h-20 text-lg"><SkipForward className="w-6 h-6 mr-2" />PRÓXIMO</Button>
              <Button onClick={handleStop} variant="destructive" className="h-20 text-lg col-span-2"><Square className="w-6 h-6 mr-2" />PARAR/RESETAR</Button>
            </div>
          </div>

          <div className="flex-1 bg-card border border-border rounded-xl p-2 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-2 border-b border-border mb-2 flex-shrink-0">
              <h3 className="text-xl font-bold text-foreground">Timeline do Rundown</h3>
              <Button variant="outline" size="sm" onClick={addFolder}><Folder className="w-4 h-4 mr-1" /> Nova Pasta</Button>
            </div>
            <Reorder.Group axis="y" values={rundown.items} onReorder={handleFolderReorder} className="flex-1 space-y-2 overflow-y-auto p-1">
              {rundown.items.map((folder, fIndex) => (
                <Reorder.Item key={folder.id} value={folder} className="bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between gap-2 p-2 rounded-t-md">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                      <Folder className="w-5 h-5 text-primary" />
                      <h4 className="font-bold text-foreground">{folder.title}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingFolder(folder)}><Edit className="w-4 h-4" /></Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addItem(fIndex)}><Plus className="w-4 h-4" /></Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFolder(fIndex)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <Reorder.Group axis="y" values={folder.children} onReorder={(newOrder) => handleItemReorder(fIndex, newOrder)} className="border-t border-border p-1 space-y-1">
                    {folder.children.map((item, iIndex) => {
                      const isCurrent = currentItemIndex.folderIndex === fIndex && currentItemIndex.itemIndex === iIndex;
                      
                      const itemStartTime = calculateElapsedTimeForIndex(fIndex, iIndex, rundown.items);
                      const itemElapsedTime = isCurrent && isRunning ? timeElapsed - itemStartTime : 0;
                      const remainingTime = Math.max(0, item.duration - itemElapsedTime);
                      const progress = isCurrent && item.duration > 0 ? Math.min((itemElapsedTime / item.duration) * 100, 100) : 0;

                      let progressColor = 'bg-blue-500';
                      if (remainingTime <= 30) progressColor = 'bg-yellow-500';
                      if (remainingTime <= 10) progressColor = 'bg-red-500';

                      return (
                        <Reorder.Item key={item.id} value={item} className={cn(`group relative flex items-center gap-4 p-3 transition-all rounded-md border-l-4 overflow-hidden`, isCurrent ? 'bg-primary/20' : 'bg-card hover:bg-secondary')} style={{ borderColor: item.color }}>
                          <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                          <div className="w-8 text-center text-muted-foreground">{getIcon(item)}</div>
                          <div className="w-20 text-center font-mono text-muted-foreground">{formatTimeShort(item.duration)}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            {item.reminder && <p className="text-xs text-amber-500 mt-1">Lembrete: {item.reminder}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <UrgencyIndicator urgency={item.urgency} />
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentItemIndex(fIndex, iIndex)}><MousePointerClick className="w-4 h-4 text-blue-500" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingItem(item)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(fIndex, iIndex)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                          {isCurrent && (
                            <motion.div 
                              className={cn("absolute bottom-0 left-0 h-1", progressColor)}
                              initial={{ width: '0%' }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.2, ease: 'linear' }}
                            />
                          )}
                        </Reorder.Item>
                      );
                    })}
                     {folder.children.length === 0 && (
                        <div className="text-center text-muted-foreground p-4 text-sm">
                            Esta pasta está vazia. Adicione um evento.
                        </div>
                    )}
                  </Reorder.Group>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </main>
      </div>
      {editingItem && (
        <EditItemDialog
          item={editingItem}
          onSave={handleItemUpdate}
          onClose={() => setEditingItem(null)}
        />
      )}
      {editingFolder && (
        <EditFolderDialog
          folder={editingFolder}
          onSave={handleFolderUpdate}
          onClose={() => setEditingFolder(null)}
        />
      )}
    </>
  );
};

export default OperatorView;