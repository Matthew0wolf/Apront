import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, Square, SkipForward, ArrowLeft, Users, Wifi, WifiOff, Edit, Plus, Folder, Trash2, MousePointerClick, GripVertical, FileText, Monitor, Eye, EyeOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNotifications } from '@/contexts/NotificationsContext.jsx';
import { usePresenterConfig } from '@/contexts/PresenterConfigContext.jsx';
import EditItemDialog from '@/components/dialogs/EditItemDialog';
import EditFolderDialog from '@/components/dialogs/EditFolderDialog';
import ScriptEditorDialog from '@/components/dialogs/ScriptEditorDialog';
import PresenterConfigDialog from '@/components/dialogs/PresenterConfigDialog';
import LiveClock from '@/components/shared/LiveClock';
import FormattedScript from '@/components/shared/FormattedScript';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { useRundown } from '@/contexts/RundownContext.jsx';
import { useTimer } from '@/contexts/TimerContext.jsx';
import { useSync } from '@/contexts/SyncContext.jsx';
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
    syncFolderReorder,
    syncItemReorder,
    syncTimerState,
    syncCurrentItemChange,
    syncRundownUpdate,
    isDraggingRef: globalDragRef,
  } = useRundown();

  const { isConnected, setActiveRundownId, updateRundownStatus } = useSync();
  
  // Controle das configurações do apresentador (agora em Dialog)
  const [showPresenterConfigDialog, setShowPresenterConfigDialog] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropIndicator, setDropIndicator] = useState({ show: false, index: -1, type: null, folderIndex: null });
  const { presenterConfig, updatePresenterConfig } = usePresenterConfig();

  const { timeElapsed, setTimeElapsed } = useTimer();

  const [isOnline, setIsOnline] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingScript, setEditingScript] = useState(null);
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  // Refs para gerenciar estado local durante drag (Alternativa 2 - Escalável)
  const localRundownRef = useRef(null);
  
  // Sincroniza ref local com estado quando muda
  useEffect(() => {
    if (!globalDragRef.current) {
      localRundownRef.current = rundown;
    }
  }, [rundown, globalDragRef]);

  useEffect(() => {
    if (!rundown || rundown.id !== projectId) {
      const rundownData = loadRundownState(projectId);
      if (!rundownData) {
        toast({ variant: "destructive", title: "Erro", description: "Rundown não encontrado." });
        navigate(`/project/${projectId}/select-role`);
      }
    }
  }, [projectId, rundown, loadRundownState, navigate, toast]);

  // Conecta ao rundown via WebSocket quando o componente monta
  useEffect(() => {
    if (projectId) {
      console.log('🔗 OperatorView: Conectando ao rundown:', projectId);
      setActiveRundownId(projectId);
    }
    
    return () => {
      console.log('🔗 OperatorView: Desconectando do rundown:', projectId);
      setActiveRundownId(null);
    };
  }, [projectId, setActiveRundownId]);

  useEffect(() => {
    const connectionInterval = setInterval(() => setIsOnline(Math.random() > 0.1), 5000);
    return () => clearInterval(connectionInterval);
  }, []);

  // Funções de controle - DEVEM estar antes dos useEffect que as usam
  const handlePlayPause = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    
    // Sincroniza o estado do timer com outros clientes
    syncTimerState(newRunningState, timeElapsed, currentItemIndex);
    
    toast({ 
      title: newRunningState ? "▶️ Transmissão Iniciada" : "⏸️ Transmissão Pausada", 
      description: newRunningState ? "Rundown está ao vivo!" : "Rundown pausado." 
    });

    // Notificação para equipe
    if (newRunningState) {
      if (rundown?.id) {
        updateRundownStatus(rundown.id, 'Ao Vivo');
      }
      addNotification({
        type: 'success',
        title: 'Transmissão iniciada',
        description: `${rundown?.name || 'Rundown'} está AO VIVO`
      });
    } else {
      addNotification({
        type: 'info',
        title: 'Transmissão pausada',
        description: `${rundown?.name || 'Rundown'} foi pausado`
      });
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeElapsed(0);
    setCurrentItemIndex(0, 0);
    
    // Sincroniza o estado de parada com outros clientes
    syncTimerState(false, 0, { folderIndex: 0, itemIndex: 0 });
    
    toast({ title: "⏹️ Transmissão Parada", description: "Rundown resetado." });

    if (rundown?.id) {
      updateRundownStatus(rundown.id, 'Parado');
    }
    addNotification({
      type: 'warning',
      title: 'Transmissão encerrada',
      description: `${rundown?.name || 'Rundown'} foi encerrado`
    });
  };

  const addFolder = () => {
    const newFolder = { id: `folder-${Date.now()}`, title: 'Nova Pasta', type: 'folder', children: [] };
    const newRundown = { ...rundown, items: [...rundown.items, newFolder] };
    setRundown(newRundown);
    
    // Sincroniza com outros clientes
    if (rundown?.id) {
      syncRundownUpdate(String(rundown.id), { items: newRundown.items });
    }
    
    toast({ title: "📁 Pasta Adicionada" });
  };

  // Atalhos de teclado para operador
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignorar se estiver digitando em um input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ignorar se algum dialog estiver aberto
      if (editingItem || editingFolder || editingScript) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'p':
          // Space ou P: Play/Pause
          e.preventDefault();
          handlePlayPause();
          break;
        
        case 'n':
        case 'arrowright':
          // N ou →: Próximo item
          if (isRunning) {
            e.preventDefault();
            onNext();
          }
          break;
        
        case 's':
          // S: Stop/Reset OU Toggle Script (sem Ctrl)
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleStop();
          } else {
            // Toggle script do apresentador
            e.preventDefault();
            const newValue = !presenterConfig.showScript;
            updatePresenterConfig({ showScript: newValue });
            toast({ 
              title: newValue ? "📖 Script Visível (Apresentador)" : "👁️ Script Oculto (Apresentador)",
              description: newValue ? "Apresentador pode ver os scripts" : "Apresentador vê apenas títulos",
              duration: 2000
            });
          }
          break;
        
        case 'a':
          // A: Toggle Auto-scroll do apresentador
          e.preventDefault();
          const newAutoScroll = !presenterConfig.autoScroll;
          updatePresenterConfig({ autoScroll: newAutoScroll });
          toast({ 
            title: newAutoScroll ? "▶️ Auto-scroll Ativado (Apresentador)" : "⏸️ Auto-scroll Desativado (Apresentador)",
            description: newAutoScroll ? "Script rola automaticamente" : "Scroll manual",
            duration: 2000
          });
          break;
        
        case '+':
        case '=':
          // +: Aumentar fonte do apresentador
          e.preventDefault();
          const newFontSizeUp = Math.min(48, presenterConfig.fontSize + 2);
          updatePresenterConfig({ fontSize: newFontSizeUp });
          toast({ 
            title: `📏 Fonte Aumentada (Apresentador)`,
            description: `Tamanho: ${newFontSizeUp}px`,
            duration: 1500
          });
          break;
        
        case '-':
        case '_':
          // -: Diminuir fonte do apresentador
          e.preventDefault();
          const newFontSizeDown = Math.max(16, presenterConfig.fontSize - 2);
          updatePresenterConfig({ fontSize: newFontSizeDown });
          toast({ 
            title: `📏 Fonte Diminuída (Apresentador)`,
            description: `Tamanho: ${newFontSizeDown}px`,
            duration: 1500
          });
          break;
        
        case 'v':
          // V: Aumentar velocidade do scroll
          if (presenterConfig.autoScroll) {
            e.preventDefault();
            const newSpeedUp = Math.min(2.0, presenterConfig.scrollSpeed + 0.1);
            updatePresenterConfig({ scrollSpeed: parseFloat(newSpeedUp.toFixed(1)) });
            toast({ 
              title: `⚡ Velocidade Aumentada (Apresentador)`,
              description: `Velocidade: ${newSpeedUp.toFixed(1)}x`,
              duration: 1500
            });
          }
          break;
        
        case 'b':
          // B: Diminuir velocidade do scroll
          if (presenterConfig.autoScroll) {
            e.preventDefault();
            const newSpeedDown = Math.max(0.5, presenterConfig.scrollSpeed - 0.1);
            updatePresenterConfig({ scrollSpeed: parseFloat(newSpeedDown.toFixed(1)) });
            toast({ 
              title: `🐌 Velocidade Diminuída (Apresentador)`,
              description: `Velocidade: ${newSpeedDown.toFixed(1)}x`,
              duration: 1500
            });
          }
          break;
        
        case 'f':
          // F: Adicionar pasta
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            addFolder();
          }
          break;
        
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRunning, editingItem, editingFolder, editingScript, presenterConfig, handlePlayPause, onNext, handleStop, addFolder, updatePresenterConfig, toast]);

  const totalDuration = useMemo(() => {
    if (!rundown || !rundown.items) return 0;
    return rundown.items.reduce((total, folder) => {
      if (!folder.children) return total;
      return total + folder.children.reduce((folderTotal, item) => {
        const duration = typeof item.duration === 'number' ? item.duration : parseInt(item.duration) || 0;
        return folderTotal + duration;
      }, 0);
    }, 0);
  }, [rundown]);

  const handleItemUpdate = (updatedItem) => {
    const newRundown = { ...rundown };
    const folderIndex = newRundown.items.findIndex(f => f.children.some(c => c.id === updatedItem.id));
    if (folderIndex !== -1) {
      const itemIndex = newRundown.items[folderIndex].children.findIndex(c => c.id === updatedItem.id);
      if (itemIndex !== -1) {
        newRundown.items[folderIndex].children[itemIndex] = updatedItem;
        setRundown(newRundown);
        
        // Sincroniza com outros clientes
        if (rundown?.id) {
          syncRundownUpdate(String(rundown.id), { items: newRundown.items });
        }
        
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
      
      // Sincroniza com outros clientes
      if (rundown?.id) {
        syncRundownUpdate(String(rundown.id), { items: newRundown.items });
      }
      
      toast({ title: "✅ Pasta Atualizada", description: `"${updatedFolder.title}" foi salva.` });
    }
    setEditingFolder(null);
  };

  const handleScriptUpdate = (scriptData) => {
    const newRundown = { ...rundown };
    const folderIndex = newRundown.items.findIndex(f => f.children.some(c => c.id === editingScript.id));
    if (folderIndex !== -1) {
      const itemIndex = newRundown.items[folderIndex].children.findIndex(c => c.id === editingScript.id);
      if (itemIndex !== -1) {
        // Atualiza os campos de script no item
        newRundown.items[folderIndex].children[itemIndex] = {
          ...newRundown.items[folderIndex].children[itemIndex],
          script: scriptData.script,
          talking_points: scriptData.talkingPoints,
          pronunciation_guide: scriptData.pronunciationGuide,
          presenter_notes: scriptData.presenterNotes
        };
        setRundown(newRundown);
        
        // Sincroniza com outros clientes
        if (rundown?.id) {
          syncRundownUpdate(String(rundown.id), { items: newRundown.items });
        }
      }
    }
  };

  const addItem = (folderIndex) => {
    const newItem = {
      id: `item-${Date.now()}`, title: 'Novo Evento', duration: 60, description: 'Descrição.',
      type: 'generic', status: 'pending', iconType: 'lucide', iconData: 'Plus', color: '#808080', urgency: 'normal', reminder: ''
    };
    const newRundown = { ...rundown };
    newRundown.items[folderIndex].children.push(newItem);
    setRundown(newRundown);
    
    // Sincroniza com outros clientes
    if (rundown?.id) {
      syncRundownUpdate(parseInt(rundown.id), { items: newRundown.items });
    }
    
    toast({ title: "✨ Evento Adicionado" });
  };

  const removeItem = (folderIndex, itemIndex) => {
    const newRundown = { ...rundown };
    newRundown.items[folderIndex].children.splice(itemIndex, 1);
    setRundown(newRundown);
    
    // Sincroniza com outros clientes
    if (rundown?.id) {
      syncRundownUpdate(parseInt(rundown.id), { items: newRundown.items });
    }
    
    toast({ variant: "destructive", title: "🗑️ Evento Removido" });
  };

  const removeFolder = (folderIndex) => {
    const newRundown = { ...rundown };
    newRundown.items.splice(folderIndex, 1);
    setRundown(newRundown);
    
    // Sincroniza com outros clientes
    if (rundown?.id) {
      syncRundownUpdate(parseInt(rundown.id), { items: newRundown.items });
    }
    
    toast({ variant: "destructive", title: "🗑️ Pasta Removida" });
  };

  const handleFolderReorder = (newOrder) => {
    console.log('🔄 Operador: Reordenando pastas:', { rundownId: rundown?.id, type: typeof rundown?.id, newOrder });
    setRundown(prev => ({ ...prev, items: newOrder }));
    // Sincroniza com outros clientes
    if (rundown?.id) {
      console.log('📤 Operador: Enviando reordenação de pastas para backend');
      syncFolderReorder(String(rundown.id), newOrder);
    } else {
      console.log('❌ Operador: rundown.id não disponível para sincronização');
    }
  };

  // Funções para Drag and Drop Visual
  const handleDragStart = (event, info, item, folderIndex, itemIndex) => {
    globalDragRef.current = true;
    localRundownRef.current = rundown; // Snapshot do estado atual
    setDraggedItem({ type: 'item', data: item, folderIndex, itemIndex });
    setIsDragging(true);
    setDragOffset({ x: info.offset.x, y: info.offset.y });
  };

  const handleFolderDragStart = (event, info, folder, folderIndex) => {
    globalDragRef.current = true;
    localRundownRef.current = rundown; // Snapshot do estado atual
    setDraggedItem({ type: 'folder', data: folder, folderIndex });
    setIsDragging(true);
    setDragOffset({ x: info.offset.x, y: info.offset.y });
  };

  const handleDrag = (event, info) => {
    setDragPosition({ x: info.point.x, y: info.point.y });
    
    // Verifica se draggedItem existe
    if (!draggedItem) return;
    
    // Calcula onde mostrar o indicador de drop
    // Usa getElementsFromPoint e filtra elementos que não são o item sendo arrastado
    const elementsBelow = document.elementsFromPoint(info.point.x, info.point.y);
    
    // Filtra elementos que não são o item/pasta sendo arrastado
    const draggedElement = event.target.closest('[data-folder-index], [data-item-index]');
    const draggedFolderIndex = draggedElement?.dataset?.folderIndex;
    const draggedItemIndex = draggedElement?.dataset?.itemIndex;
    
    const targetElement = elementsBelow.find(el => {
      // Ignora o próprio elemento sendo arrastado
      if (el === draggedElement || el.contains(draggedElement)) return false;
      
      // Procura por elementos com data-folder-index ou data-item-index
      const folderEl = el.closest('[data-folder-index]');
      const itemEl = el.closest('[data-item-index]');
      
      if (itemEl) {
        const folderIndex = itemEl.dataset.folderIndex;
        const itemIndex = itemEl.dataset.itemIndex;
        // Ignora se for o mesmo item
        if (draggedItem.type === 'item' && folderIndex === draggedFolderIndex && itemIndex === draggedItemIndex) {
          return false;
        }
        return true;
      }
      
      if (folderEl) {
        const folderIndex = folderEl.dataset.folderIndex;
        // Ignora se for a mesma pasta
        if (draggedItem.type === 'folder' && folderIndex === draggedFolderIndex) {
          return false;
        }
        return true;
      }
      
      return false;
    });
    
    if (targetElement) {
      const folderEl = targetElement.closest('[data-folder-index]');
      const itemEl = targetElement.closest('[data-item-index]');
      
      if (draggedItem.type === 'folder' && (folderEl || targetElement.dataset.folderIndex)) {
        const targetFolderIndex = parseInt((folderEl || targetElement).dataset.folderIndex);
        
        // Ignora se está arrastando sobre si mesmo
        if (draggedItem && draggedItem.type === 'folder' && draggedItem.folderIndex === targetFolderIndex) {
          setDropIndicator({ show: false, index: -1, type: null, folderIndex: null });
          return;
        }
        
        // Calcula se deve mostrar indicador acima ou abaixo
        const container = document.querySelector('.reorder-container');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const relativeY = info.point.y - containerRect.top;
          
          // Encontra a pasta atual para calcular sua posição real
          const folderElement = document.querySelector(`[data-folder-index="${targetFolderIndex}"]`);
          if (folderElement) {
            const folderRect = folderElement.getBoundingClientRect();
            const folderRelativeY = folderRect.top - containerRect.top;
            const folderHeight = folderRect.height;
            
            // Se está na metade superior da pasta, mostra indicador acima
            const showAbove = relativeY < folderRelativeY + (folderHeight / 2);
            const indicatorIndex = showAbove ? targetFolderIndex : targetFolderIndex + 1;
            
            setDropIndicator({
              show: true,
              index: indicatorIndex,
              type: 'folder',
              folderIndex: null
            });
          }
        }
      } else if (draggedItem.type === 'item' && (itemEl || folderEl)) {
        // Para itens, calcula se deve inserir antes ou depois baseado na posição Y
        if (itemEl) {
          const targetFolderIndex = parseInt(itemEl.dataset.folderIndex);
          const targetItemIndex = parseInt(itemEl.dataset.itemIndex);
          
          // Ignora se está arrastando sobre si mesmo
          if (draggedItem && draggedItem.type === 'item' && draggedItem.folderIndex === targetFolderIndex && draggedItem.itemIndex === targetItemIndex) {
            setDropIndicator({ show: false, index: -1, type: null, folderIndex: null });
            return;
          }
          
          // Calcula se o cursor está na metade superior ou inferior do item
          const itemElement = document.querySelector(`[data-item-index="${targetItemIndex}"][data-folder-index="${targetFolderIndex}"]`);
          
          if (itemElement) {
            const itemRect = itemElement.getBoundingClientRect();
            const cursorY = info.point.y;
            const itemCenterY = itemRect.top + itemRect.height / 2;
            
            // Se o cursor está na metade superior, insere ANTES (index = targetItemIndex)
            // Se o cursor está na metade inferior, insere DEPOIS (index = targetItemIndex + 1)
            const insertBefore = cursorY < itemCenterY;
            const insertIndex = insertBefore ? targetItemIndex : targetItemIndex + 1;
            
            setDropIndicator({
              show: true,
              index: insertIndex,
              type: 'item',
              folderIndex: targetFolderIndex
            });
          }
        } else if (folderEl) {
          // Soltando dentro de uma pasta vazia ou no final
          const targetFolderIndex = parseInt(folderEl.dataset.folderIndex);
          setDropIndicator({
            show: true,
            index: -1,
            type: 'item',
            folderIndex: targetFolderIndex
          });
        }
      }
    } else {
      setDropIndicator({ show: false, index: -1, type: null, folderIndex: null });
    }
  };

  const handleDragEnd = (event, info) => {
    console.log('🛑 handleDragEnd:', { hasDraggedItem: !!draggedItem, dropIndicatorShow: dropIndicator.show });
    
    // Lógica de reordenação baseada na posição final
    if (draggedItem && dropIndicator.show) {
      const { type, data, folderIndex, itemIndex } = draggedItem;
      
      // Usa ref em vez de state direto para evitar conflitos com WebSocket
      const currentRundown = localRundownRef.current;
      
      console.log('🎯 Processando drop:', { type, folderIndex, itemIndex, dropIndicator });
      
      if (type === 'folder' && dropIndicator.type === 'folder') {
        // Para pastas, dropIndicator.index é o índice onde inserir (pode ser targetFolderIndex ou targetFolderIndex + 1)
        const insertIndex = dropIndicator.index;
        
        // Reordenar pastas
        const newItems = [...currentRundown.items];
        const draggedFolder = newItems.splice(folderIndex, 1)[0];
        
        // Ajusta o índice de inserção considerando que já removemos o item
        let adjustedInsertIndex = insertIndex;
        if (insertIndex > folderIndex) {
          adjustedInsertIndex = insertIndex - 1;
        }
        
        // Garante que não está tentando inserir na mesma posição
        if (adjustedInsertIndex !== folderIndex && adjustedInsertIndex >= 0 && adjustedInsertIndex <= newItems.length) {
          newItems.splice(adjustedInsertIndex, 0, draggedFolder);
          
          // Atualização OTIMISTA imediata + sincronização
          setRundown({ ...currentRundown, items: newItems });
          
          if (currentRundown?.id) {
            syncFolderReorder(String(currentRundown.id), newItems);
          }
        }
      } else if (type === 'item' && dropIndicator.type === 'item') {
        const targetFolderIndex = dropIndicator.folderIndex;
        // dropIndicator.index é o índice ONDE devemos INSERIR (já considera +1)
        const insertIndex = dropIndicator.index;
        
        const newItems = [...currentRundown.items];
        const sourceFolder = newItems[folderIndex];
        const sourceChildren = [...sourceFolder.children];
        const draggedItemData = sourceChildren.splice(itemIndex, 1)[0];
        
        if (folderIndex === targetFolderIndex) {
          // Mesmo dentro da pasta - reordenar
          // insertIndex é onde queremos inserir na lista ORIGINAL (antes de remover o item)
          // Após remover o item, precisamos ajustar o índice
          let adjustedInsertIndex = insertIndex;
          
          // Se insertIndex > itemIndex, significa que estamos movendo para baixo
          // Após remover o item na posição itemIndex, os índices acima dele não mudam
          // mas os índices >= itemIndex são reduzidos em 1
          // Então insertIndex precisa ser reduzido em 1 se insertIndex > itemIndex
          if (insertIndex > itemIndex) {
            adjustedInsertIndex = insertIndex - 1;
          }
          // Se insertIndex <= itemIndex, o insertIndex permanece o mesmo
          // porque estamos inserindo antes ou na mesma posição (que será removida)
          
          // Validações: deve haver mudança de posição e posição válida
          const wouldChangePosition = adjustedInsertIndex !== itemIndex;
          const isValidPosition = adjustedInsertIndex >= 0 && adjustedInsertIndex <= sourceChildren.length;
          
          if (wouldChangePosition && isValidPosition) {
            sourceChildren.splice(adjustedInsertIndex, 0, draggedItemData);
            newItems[folderIndex] = { ...sourceFolder, children: sourceChildren };
            
            // Atualização OTIMISTA imediata + sincronização
            setRundown({ ...currentRundown, items: newItems });
            
            if (currentRundown?.id) {
              syncItemReorder(String(currentRundown.id), folderIndex, newItems[folderIndex].children);
            }
          }
        } else {
          // Entre pastas diferentes - mover
          const targetFolder = newItems[targetFolderIndex];
          const targetChildren = [...(targetFolder.children || [])];
          const finalInsertIndex = insertIndex === -1 ? targetChildren.length : insertIndex;
          
          if (finalInsertIndex >= 0 && finalInsertIndex <= targetChildren.length) {
            targetChildren.splice(finalInsertIndex, 0, draggedItemData);
            
            newItems[folderIndex] = { ...sourceFolder, children: sourceChildren };
            newItems[targetFolderIndex] = { ...targetFolder, children: targetChildren };
            
            // Atualização OTIMISTA imediata + sincronização
            setRundown({ ...currentRundown, items: newItems });
            
            if (currentRundown?.id) {
              syncItemReorder(String(currentRundown.id), folderIndex, newItems[folderIndex].children);
              syncItemReorder(String(currentRundown.id), targetFolderIndex, newItems[targetFolderIndex].children);
            }
          }
        }
      }
    }
    
    // Libera flag DEPOIS de sincronizar
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverIndex(-1);
    setDropIndicator({ show: false, index: -1, type: null, folderIndex: null });
    
    // Libera lock com delay para evitar duplicação do WebSocket
    setTimeout(() => {
      globalDragRef.current = false;
    }, 100);
  };

  const handleItemReorder = (folderIndex, newOrder) => {
    console.log('🔄 Operador: handleItemReorder chamado:', { 
      folderIndex, 
      oldLength: rundown.items[folderIndex]?.children?.length,
      newLength: newOrder.length,
      oldOrder: rundown.items[folderIndex]?.children?.map(i => i.id),
      newOrder: newOrder.map(i => i.id)
    });
    
    // Verifica se realmente houve mudança
    const oldIds = rundown.items[folderIndex]?.children?.map(i => i.id).join(',');
    const newIds = newOrder.map(i => i.id).join(',');
    
    if (oldIds === newIds) {
      console.log('⚠️ Mesma ordem, ignorando reordenação');
      return; // Não faz nada se a ordem não mudou
    }
    
    console.log('✅ Ordem diferente, aplicando mudança');
    const newRundown = { ...rundown };
    newRundown.items[folderIndex].children = newOrder;
    setRundown(newRundown);
    // Sincroniza com outros clientes
    if (rundown?.id) {
      console.log('📤 Operador: Enviando reordenação de itens para backend');
      syncItemReorder(String(rundown.id), folderIndex, newOrder);
    } else {
      console.log('❌ Operador: rundown.id não disponível para sincronização');
    }
  };

  if (!rundown) return null;

  return (
    <>
      <div className="min-h-screen w-screen bg-background text-foreground flex flex-col p-2 sm:p-4 gap-2 sm:gap-4 font-sans">
        <header className="flex items-center justify-between p-2 sm:p-3 bg-card border border-border rounded-xl flex-shrink-0 shadow-sm">
          <Button onClick={() => navigate('/projects')} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Button>
          <h1 className="text-lg sm:text-xl font-bold truncate px-2 sm:px-4">{rundown.name}</h1>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => {
              const url = `${window.location.origin}/project/${rundown.id}/presenter`;
              navigator.clipboard.writeText(url);
              toast({ title: "✅ Link Copiado!", description: "O link para a tela do apresentador foi copiado." });
            }}>Copiar Link</Button>
            
            {/* Botão para configurações do apresentador */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPresenterConfigDialog(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4" /> 3</div>
            
            {/* Indicador de Atalhos */}
            <div className="hidden lg:flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-2 sm:px-3 py-1 flex-wrap">
              <kbd className="px-1 sm:px-1.5 py-0.5 bg-background rounded text-xs">Space</kbd>
              <span className="hidden sm:inline">Play</span>
              <kbd className="px-1 sm:px-1.5 py-0.5 bg-background rounded text-xs ml-1 sm:ml-2">N</kbd>
              <span className="hidden sm:inline">Próximo</span>
              <kbd className="px-1 sm:px-1.5 py-0.5 bg-background rounded text-xs ml-1 sm:ml-2">S</kbd>
              <span className="hidden sm:inline">Script</span>
              <kbd className="px-1 sm:px-1.5 py-0.5 bg-background rounded text-xs ml-1 sm:ml-2">A</kbd>
              <span className="hidden sm:inline">Auto</span>
              <kbd className="px-1 sm:px-1.5 py-0.5 bg-background rounded text-xs ml-1 sm:ml-2">+/-</kbd>
              <span className="hidden sm:inline">Fonte</span>
            </div>
            
            <LiveClock />
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row gap-2 sm:gap-4 overflow-hidden">
          <div className="w-full lg:w-[320px] flex flex-col gap-2 sm:gap-4 flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center flex-grow">
              <p className="text-muted-foreground mb-1 sm:mb-2 text-sm sm:text-lg">DURAÇÃO TOTAL</p>
              <p className="text-4xl sm:text-6xl lg:text-7xl font-mono font-bold tracking-tighter">{formatTime(totalDuration)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center">
              <p className="text-muted-foreground mb-1 sm:mb-2 text-sm">TEMPO DECORRIDO</p>
              <TimeDisplay />
            </div>
            <div className="bg-card border border-border rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center">
              <p className="text-muted-foreground mb-1 sm:mb-2 text-sm">STATUS</p>
              <div className={`flex items-center gap-2 text-lg sm:text-2xl font-bold ${isRunning ? 'text-red-500' : 'text-gray-500'}`}>
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                {isRunning ? 'AO VIVO' : 'PARADO'}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 sm:p-4 grid grid-cols-2 gap-2">
              <Button onClick={handlePlayPause} className={`h-16 sm:h-20 text-sm sm:text-lg ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-600 hover:bg-green-700'}`}>
                {isRunning ? <Pause className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2" /> : <Play className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2" />}
                <span className="hidden sm:inline">{isRunning ? 'PAUSAR' : 'INICIAR'}</span>
              </Button>
              <Button onClick={onNext} disabled={!isRunning} className="h-16 sm:h-20 text-sm sm:text-lg">
                <SkipForward className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">PRÓXIMO</span>
              </Button>
              <Button onClick={handleStop} variant="destructive" className="h-16 sm:h-20 text-sm sm:text-lg col-span-2">
                <Square className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
                PARAR/RESETAR
              </Button>
            </div>

          </div>

          <div className="flex-1 bg-card border border-border rounded-xl p-2 sm:p-3 flex flex-col overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2 border-b border-border mb-2 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-lg sm:text-xl font-bold text-foreground">Timeline do Rundown</h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="hidden sm:inline">{isConnected ? 'Sincronizado' : 'Desconectado'}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={addFolder} className="w-full sm:w-auto">
                <Folder className="w-4 h-4 mr-1" /> 
                <span className="sm:inline">Nova Pasta</span>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto reorder-container relative overflow-x-hidden" style={{ width: '100%' }}>
              {/* Drop Indicator */}
              {dropIndicator.show && dropIndicator.type === 'folder' && (
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-primary rounded-full z-50 shadow-lg"
                  style={{
                    top: `${(dropIndicator.index * 100) + (dropIndicator.index * 8) + 8}px`, // Ajuste para padding e espaçamento
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute -left-2 -right-2 h-3 bg-primary/20 rounded-full" />
                  <div className="absolute -left-1 -right-1 h-2 bg-primary/40 rounded-full" />
                </motion.div>
              )}
              
              <div className="space-y-2 p-1 min-h-full">
                {rundown.items.map((folder, fIndex) => (
                <motion.div 
                  key={folder.id}
                  drag="y"
                  dragElastic={0}
                  dragMomentum={false}
                  onDragStart={(e, info) => handleFolderDragStart(e, info, folder, fIndex)}
                  onDrag={(e, info) => handleDrag(e, info)}
                  onDragEnd={(e, info) => handleDragEnd(e, info)}
                  className={cn(
                    "bg-secondary/50 rounded-lg cursor-move",
                    dragOverIndex === fIndex && "ring-2 ring-primary ring-offset-2 bg-primary/10",
                    draggedItem?.data?.id === folder.id && "opacity-50 scale-95"
                  )}
                  style={{ width: '100%' }}
                  data-folder-index={fIndex}
                  data-folder-id={folder.id}
                  whileHover={{ scale: 1.02 }}
                  whileDrag={{ 
                    scale: 1.05, 
                    rotate: 2,
                    boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
                    zIndex: 1000
                  }}
                >
                  <div className="flex items-center justify-between gap-2 p-2 rounded-t-md">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                      <Folder className="w-5 h-5 text-primary" />
                      <h4 className="font-bold text-foreground">{folder.title}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingFolder(folder)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addItem(fIndex)}><Plus className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFolder(fIndex)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  
                  <div className="border-t border-border p-1 space-y-1">
                      {/* Indicador antes do primeiro item */}
                      {dropIndicator.show && 
                       dropIndicator.type === 'item' && 
                       dropIndicator.folderIndex === fIndex && 
                       dropIndicator.index === 0 && (
                        <motion.div
                          key="drop-indicator-start"
                          className="w-full h-1 bg-primary rounded-full mb-1"
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          exit={{ scaleX: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-full h-3 bg-primary/20 rounded-full -mt-1" />
                          <div className="w-full h-2 bg-primary/40 rounded-full -mt-2" />
                        </motion.div>
                      )}
                      {(folder.children || []).map((item, iIndex) => {
                        // Mostra indicador ANTES deste item se dropIndicator.index === iIndex
                        // Mostra indicador DEPOIS deste item se dropIndicator.index === iIndex + 1
                        const shouldShowIndicatorBefore = dropIndicator.show && 
                          dropIndicator.type === 'item' && 
                          dropIndicator.folderIndex === fIndex && 
                          dropIndicator.index === iIndex;
                        
                        const shouldShowIndicatorAfter = dropIndicator.show && 
                          dropIndicator.type === 'item' && 
                          dropIndicator.folderIndex === fIndex && 
                          dropIndicator.index === iIndex + 1;
                        
                      const isCurrent = currentItemIndex.folderIndex === fIndex && currentItemIndex.itemIndex === iIndex;
                      
                      const itemStartTime = calculateElapsedTimeForIndex(fIndex, iIndex, rundown.items);
                      const itemElapsedTime = isCurrent && isRunning ? timeElapsed - itemStartTime : 0;
                      const remainingTime = Math.max(0, item.duration - itemElapsedTime);
                      const progress = isCurrent && item.duration > 0 ? Math.min((itemElapsedTime / item.duration) * 100, 100) : 0;

                      let progressColor = 'bg-blue-500';
                      if (remainingTime <= 30) progressColor = 'bg-yellow-500';
                      if (remainingTime <= 10) progressColor = 'bg-red-500';

                      return (
                        <React.Fragment key={item.id}>
                          {shouldShowIndicatorBefore && (
                            <motion.div
                              key={`drop-indicator-before-${item.id}`}
                              className="w-full h-1 bg-primary rounded-full mb-1"
                              initial={{ scaleX: 0, opacity: 0 }}
                              animate={{ scaleX: 1, opacity: 1 }}
                              exit={{ scaleX: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="w-full h-3 bg-primary/20 rounded-full -mt-1" />
                              <div className="w-full h-2 bg-primary/40 rounded-full -mt-2" />
                            </motion.div>
                          )}
                        <motion.div
                          drag="y"
                          dragElastic={0}
                          dragMomentum={false}
                          onDragStart={(e, info) => handleDragStart(e, info, item, fIndex, iIndex)}
                          onDrag={(e, info) => handleDrag(e, info)}
                          onDragEnd={(e, info) => handleDragEnd(e, info)}
                          className={cn(
                            "group relative flex items-center gap-2 sm:gap-4 p-3 rounded-md border-l-4 cursor-move",
                            isCurrent ? 'bg-primary/20' : 'bg-card hover:bg-secondary',
                            dragOverIndex === iIndex && "ring-2 ring-primary ring-offset-2 bg-primary/10",
                            draggedItem?.data?.id === item.id && "opacity-50 scale-95"
                          )}
                          style={{ borderColor: item.color, width: '100%' }}
                          data-folder-index={fIndex}
                          data-item-index={iIndex}
                          whileHover={{ scale: 1.01 }}
                          whileDrag={{ 
                            scale: 1.03, 
                            rotate: 1,
                            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                            zIndex: 1000
                          }}
                        >
                          <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground cursor-move flex-shrink-0" />
                          <div className="w-6 h-6 sm:w-8 sm:h-8 text-center text-muted-foreground flex items-center justify-center">{getIcon(item)}</div>
                          <div className="w-12 sm:w-20 text-center font-mono text-xs sm:text-sm text-muted-foreground">{formatTimeShort(item.duration)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm sm:text-lg text-foreground truncate">{item.title}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.description}</p>
                            {item.reminder && <p className="text-xs text-amber-500 mt-1 truncate">Lembrete: {item.reminder}</p>}
                          </div>
                          <UrgencyIndicator urgency={item.urgency} />
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setCurrentItemIndex(fIndex, iIndex)} title="Definir como atual"><MousePointerClick className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setEditingScript(item)} title="Editar Script"><FileText className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setEditingItem(item)} title="Editar Item"><Edit className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-destructive" onClick={() => removeItem(fIndex, iIndex)} title="Remover"><Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
                          </div>
                          {isCurrent && (
                            <motion.div 
                              className={cn("absolute bottom-0 left-0 h-1", progressColor)}
                              initial={{ width: '0%' }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.2, ease: 'linear' }}
                            />
                          )}
                        </motion.div>
                        {shouldShowIndicatorAfter && (
                          <motion.div
                            key={`drop-indicator-after-${item.id}`}
                            className="w-full h-1 bg-primary rounded-full mb-1 mt-1"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            exit={{ scaleX: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="w-full h-3 bg-primary/20 rounded-full -mt-1" />
                            <div className="w-full h-2 bg-primary/40 rounded-full -mt-2" />
                          </motion.div>
                        )}
                        </React.Fragment>
                      );
                      })}
                      {/* Indicador no final da lista (quando dropIndicator.index é igual ao tamanho da lista) */}
                      {dropIndicator.show && 
                       dropIndicator.type === 'item' && 
                       dropIndicator.folderIndex === fIndex && 
                       dropIndicator.index === (folder.children || []).length && (
                        <motion.div
                          key="drop-indicator-end"
                          className="w-full h-1 bg-primary rounded-full mb-1 mt-1"
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          exit={{ scaleX: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-full h-3 bg-primary/20 rounded-full -mt-1" />
                          <div className="w-full h-2 bg-primary/40 rounded-full -mt-2" />
                        </motion.div>
                      )}
                      {dropIndicator.show && dropIndicator.type === 'item' && dropIndicator.folderIndex === fIndex && dropIndicator.index === -1 && (
                        <motion.div
                          className="w-full h-1 bg-primary rounded-full mb-1"
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          exit={{ scaleX: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-full h-3 bg-primary/20 rounded-full -mt-1" />
                          <div className="w-full h-2 bg-primary/40 rounded-full -mt-2" />
                        </motion.div>
                      )}
                      {(!folder.children || folder.children.length === 0) && (
                        <motion.div 
                          className="text-center text-muted-foreground p-4 text-sm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          Esta pasta está vazia. Adicione um evento.
                        </motion.div>
                      )}
                    </div>
                </motion.div>
                ))}
                </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Elemento flutuante durante drag - versão completa */}
        {isDragging && draggedItem && (
            <motion.div
              className="fixed pointer-events-none z-[9999]"
              style={{
                left: dragPosition.x - dragOffset.x,
                top: dragPosition.y - dragOffset.y,
              }}
            >
          {draggedItem?.type === 'folder' ? (
            // Pasta completa sendo arrastada
            <div className="bg-secondary/50 rounded-lg shadow-2xl border-2 border-primary/50" style={{ width: '300px' }}>
              <div className="flex items-center justify-between gap-2 p-2 rounded-t-md">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                  <Folder className="w-5 h-5 text-primary" />
                  <h4 className="font-bold text-foreground">{draggedItem?.data?.title || ''}</h4>
                </div>
              </div>
              <div className="border-t border-border p-1">
                <div className="text-center text-muted-foreground p-4 text-sm">
                  {draggedItem?.data?.children?.length || 0} itens
                </div>
              </div>
            </div>
          ) : (
            // Item completo sendo arrastado
            <div className="group relative flex items-center gap-2 sm:gap-4 p-3 rounded-md border-l-4 bg-card shadow-2xl border-2 border-primary/50" style={{ width: '400px', borderColor: draggedItem?.data?.color }}>
              <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground cursor-move flex-shrink-0" />
              <div className="w-6 h-6 sm:w-8 sm:h-8 text-center text-muted-foreground flex items-center justify-center">{getIcon(draggedItem?.data)}</div>
              <div className="w-12 sm:w-20 text-center font-mono text-xs sm:text-sm text-muted-foreground">{formatTimeShort(draggedItem?.data?.duration || 0)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-lg text-foreground truncate">{draggedItem?.data?.title || ''}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{draggedItem?.data?.description || ''}</p>
                {draggedItem?.data?.reminder && <p className="text-xs text-amber-500 mt-1 truncate">Lembrete: {draggedItem?.data?.reminder}</p>}
              </div>
            </div>
          )}
        </motion.div>
      )}
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
      {editingScript && (
        <ScriptEditorDialog
          item={editingScript}
          onSave={handleScriptUpdate}
          onClose={() => setEditingScript(null)}
        />
      )}
      
      {/* Dialog de Configurações do Apresentador */}
      <PresenterConfigDialog
        open={showPresenterConfigDialog}
        onClose={() => setShowPresenterConfigDialog(false)}
      />
    </>
  );
};

export default OperatorView;