import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Play, Pause, Square, SkipForward, ArrowLeft, Users, Wifi, WifiOff, Edit, Plus, Folder, Trash2, MousePointerClick, GripVertical, FileText, Monitor, Eye, EyeOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { usePresenterConfig } from '@/contexts/PresenterConfigContext.jsx';
import EditItemDialog from '@/components/dialogs/EditItemDialog';
import EditFolderDialog from '@/components/dialogs/EditFolderDialog';
import ScriptEditorDialog from '@/components/dialogs/ScriptEditorDialog';
import PresenterConfigDialog from '@/components/dialogs/PresenterConfigDialog';
import LiveClock from '@/components/shared/LiveClock';
import FormattedScript from '@/components/shared/FormattedScript';
import * as Icons from 'lucide-react';
import { Reorder, motion } from 'framer-motion';
import { useRundown, isDraggingRef as globalDragRef } from '@/contexts/RundownContext.jsx';
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

  // Cálculo do item atual e tempo restante para alertas
  const currentItem = useMemo(() => {
    if (!rundown || !rundown.items) return null;
    return rundown.items[currentItemIndex.folderIndex]?.children[currentItemIndex.itemIndex];
  }, [rundown, currentItemIndex]);

  const itemElapsedTime = useMemo(() => {
    if (!currentItem || !isRunning || !rundown) return 0;
    const itemStartTime = calculateElapsedTimeForIndex(
      currentItemIndex.folderIndex, 
      currentItemIndex.itemIndex, 
      rundown.items
    );
    return timeElapsed - itemStartTime;
  }, [timeElapsed, currentItem, currentItemIndex, rundown, isRunning, calculateElapsedTimeForIndex]);

  const remainingTime = useMemo(() => {
    if (!currentItem || !isRunning) return currentItem?.duration || 0;
    return Math.max(currentItem.duration - itemElapsedTime, 0);
  }, [itemElapsedTime, currentItem, isRunning]);

  const flatItems = useMemo(() => {
    if (!rundown?.items || !Array.isArray(rundown.items)) return [];
    return rundown.items.flatMap(f => f.children || []);
  }, [rundown]);
  const globalCurrentIndex = useMemo(() => {
    if (!rundown) return -1;
    return rundown.items.slice(0, currentItemIndex.folderIndex).reduce((acc, f) => acc + f.children.length, 0) + currentItemIndex.itemIndex;
  }, [rundown, currentItemIndex]);

  // AudioContext e alertas sonoros para operador
  const audioContextRef = useRef(null);
  const triggeredAlerts = useRef(new Set());

  // Inicializa AudioContext na primeira interação do usuário
  useEffect(() => {
    const initAudioContext = async () => {
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        } catch (error) {
          console.warn('Erro ao inicializar AudioContext:', error);
        }
      }
    };
    
    const handleUserInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const [isOnline, setIsOnline] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingScript, setEditingScript] = useState(null);
  const { toast } = useToast();

  // Função para tocar som de alerta
  const playAlertSound = useCallback(async (frequency = 800, duration = 200) => {
    // Verifica se deve tocar som baseado na configuração
    const shouldPlay = presenterConfig.audioAlerts === 'operator' || presenterConfig.audioAlerts === 'both';
    if (!shouldPlay) {
      return;
    }
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }, [presenterConfig.audioAlerts]);

  // Alertas sonoros para operador
  useEffect(() => {
    if (!currentItem || !isRunning) {
      triggeredAlerts.current.clear();
      return;
    }

    const remainingSeconds = Math.round(remainingTime);
    const nextItem = flatItems[globalCurrentIndex + 1];

    const showToast = (title, description) => {
      toast({
        title,
        description,
        duration: 3000,
      });
    };

    if (remainingSeconds === 60 && !triggeredAlerts.current.has('1min')) {
      if (nextItem) showToast('⏳ 1 Minuto Restante', `Próximo evento: ${nextItem.title}`);
      playAlertSound(600, 300);
      triggeredAlerts.current.add('1min');
    }

    if (remainingSeconds === 30 && !triggeredAlerts.current.has('30s')) {
      if (nextItem) showToast('⏳ 30 Segundos Restantes', `Próximo evento: ${nextItem.title}`);
      playAlertSound(800, 250);
      triggeredAlerts.current.add('30s');
    }

    if (remainingSeconds <= 10 && remainingSeconds > 0 && !triggeredAlerts.current.has(`countdown-${remainingSeconds}`)) {
      if (nextItem) showToast(`⏳ ${remainingSeconds} segundos...`, `Preparar para: ${nextItem.title}`);
      playAlertSound(1000, 150);
      triggeredAlerts.current.add(`countdown-${remainingSeconds}`);
    }
  }, [remainingTime, currentItem, isRunning, flatItems, globalCurrentIndex, toast, playAlertSound]);

  useEffect(() => {
    if (currentItem) {
      triggeredAlerts.current.clear();
    }
  }, [currentItem]);

  // Refs para gerenciar estado local durante drag (Alternativa 2 - Escalável)
  const localRundownRef = useRef(null);
  
  // Ref para o indicador de drop (resolve problema de stale state)
  const dropIndicatorRef = useRef({ show: false, index: -1, type: null, folderIndex: null });
  
  // Sincroniza ref local com estado quando muda
  useEffect(() => {
    if (!globalDragRef.current) {
      localRundownRef.current = rundown;
    }
  }, [rundown]); // Removido globalDragRef das dependências para evitar loop, mas o efeito é o mesmo. O uso de globalDragRef no if já garante o comportamento.

  useEffect(() => {
    const loadRundown = async () => {
      if (!rundown || String(rundown.id) !== String(projectId)) {
        console.log('🔗 OperatorView: Carregando rundown:', projectId);
        const rundownData = await loadRundownState(projectId);
        console.log('🔗 OperatorView: Rundown carregado:', rundownData?.name);
        if (!rundownData) {
          // Aguarda um pouco mais antes de redirecionar (pode estar carregando)
          setTimeout(() => {
            if (!rundown || String(rundown.id) !== String(projectId)) {
              toast({ variant: "destructive", title: "Erro", description: "Rundown não encontrado. Tente recarregar a página." });
              navigate(`/project/${projectId}/select-role`);
            }
          }, 1000);
        }
      }
    };
    loadRundown();
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

    // Atualizar status do rundown
    if (newRunningState && rundown?.id) {
      updateRundownStatus(rundown.id, 'Ao Vivo');
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
            // Incremento menor para controle mais fino
            const newSpeedUp = Math.min(2.0, presenterConfig.scrollSpeed + 0.05);
            updatePresenterConfig({ scrollSpeed: parseFloat(newSpeedUp.toFixed(2)) });
            toast({ 
              title: `⚡ Velocidade Aumentada (Apresentador)`,
              description: `Velocidade: ${newSpeedUp.toFixed(2)}x`,
              duration: 1500
            });
          }
          break;
        
        case 'b':
          // B: Diminuir velocidade do scroll
          if (presenterConfig.autoScroll) {
            e.preventDefault();
            // Permite velocidades ainda mais baixas (até 0.05x)
            const newSpeedDown = Math.max(0.05, presenterConfig.scrollSpeed - 0.05);
            updatePresenterConfig({ scrollSpeed: parseFloat(newSpeedDown.toFixed(2)) });
            toast({ 
              title: `🐌 Velocidade Diminuída (Apresentador)`,
              description: `Velocidade: ${newSpeedDown.toFixed(2)}x`,
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
    if (!draggedItem) {
      // Se não há draggedItem, garante que o indicador está desativado
      const newIndicator = { show: false, index: -1, type: null, folderIndex: null };
      dropIndicatorRef.current = newIndicator;
      setDropIndicator(newIndicator);
      return;
    }
    
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
          const newIndicator = { show: false, index: -1, type: null, folderIndex: null };
          dropIndicatorRef.current = newIndicator;
          setDropIndicator(newIndicator);
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
            
            const newIndicator = {
              show: true,
              index: indicatorIndex,
              type: 'folder',
              folderIndex: null
            };
            dropIndicatorRef.current = newIndicator;
            setDropIndicator(newIndicator);
          }
        }
      } else if (draggedItem.type === 'item' && (itemEl || folderEl)) {
        // Para itens, calcula se deve inserir antes ou depois baseado na posição Y
        if (itemEl) {
          const targetFolderIndex = parseInt(itemEl.dataset.folderIndex);
          const targetItemIndex = parseInt(itemEl.dataset.itemIndex);
          
          // Ignora se está arrastando sobre si mesmo
          if (draggedItem && draggedItem.type === 'item' && draggedItem.folderIndex === targetFolderIndex && draggedItem.itemIndex === targetItemIndex) {
            const newIndicator = { show: false, index: -1, type: null, folderIndex: null };
            dropIndicatorRef.current = newIndicator;
            setDropIndicator(newIndicator);
            return;
          }
          
          // Encontra TODOS os itens na mesma pasta para calcular a posição correta
          // Isso garante que encontramos o item correto mesmo se houver sobreposição visual
          const allItemsInFolder = document.querySelectorAll(`[data-folder-index="${targetFolderIndex}"][data-item-index]`);
          let closestItem = null;
          let closestDistance = Infinity;
          const cursorY = info.point.y;
          
          // Encontra o item mais próximo do cursor (verticalmente)
          allItemsInFolder.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenterY = itemRect.top + itemRect.height / 2;
            const distance = Math.abs(cursorY - itemCenterY);
            
            // Verifica se o cursor está dentro dos limites verticais do item
            if (cursorY >= itemRect.top && cursorY <= itemRect.bottom) {
              if (distance < closestDistance) {
                closestDistance = distance;
                closestItem = item;
              }
            }
          });
          
          // Se encontrou um item próximo, usa ele; senão usa o itemEl original
          const itemElement = closestItem || document.querySelector(`[data-item-index="${targetItemIndex}"][data-folder-index="${targetFolderIndex}"]`);
          
          if (itemElement) {
            const actualTargetItemIndex = parseInt(itemElement.dataset.itemIndex);
            const itemRect = itemElement.getBoundingClientRect();
            const itemCenterY = itemRect.top + itemRect.height / 2;
            
            // Se o cursor está na metade superior, insere ANTES (index = actualTargetItemIndex)
            // Se o cursor está na metade inferior, insere DEPOIS (index = actualTargetItemIndex + 1)
            const insertBefore = cursorY < itemCenterY;
            const insertIndex = insertBefore ? actualTargetItemIndex : actualTargetItemIndex + 1;
            
            // Validação: garante que o índice está dentro dos limites válidos
            const currentRundown = localRundownRef.current || rundown;
            const targetFolder = currentRundown?.items?.[targetFolderIndex];
            const maxIndex = targetFolder?.children?.length || 0;
            const validInsertIndex = Math.max(0, Math.min(insertIndex, maxIndex));
            
            console.log('📍 Calculando insertIndex:', {
              targetItemIndex,
              actualTargetItemIndex,
              insertIndex,
              validInsertIndex,
              maxIndex,
              insertBefore,
              cursorY,
              itemCenterY
            });
            
            const newIndicator = {
              show: true,
              index: validInsertIndex,
              type: 'item',
              folderIndex: targetFolderIndex
            };
            dropIndicatorRef.current = newIndicator;
            setDropIndicator(newIndicator);
          }
        } else if (folderEl) {
          // Soltando dentro de uma pasta vazia ou no final
          const targetFolderIndex = parseInt(folderEl.dataset.folderIndex);
          const newIndicator = {
            show: true,
            index: -1,
            type: 'item',
            folderIndex: targetFolderIndex
          };
          dropIndicatorRef.current = newIndicator;
          setDropIndicator(newIndicator);
        }
      }
    } else {
      const newIndicator = { show: false, index: -1, type: null, folderIndex: null };
      dropIndicatorRef.current = newIndicator;
      setDropIndicator(newIndicator);
    }
  };

  const handleDragEnd = (event, info) => {
    // Lê o valor mais recente do ref (síncrono, não sofre de stale state)
    let finalDropIndicator = dropIndicatorRef.current;
    
    console.log('🛑 handleDragEnd:', { hasDraggedItem: !!draggedItem, dropIndicatorShow: finalDropIndicator.show, point: info.point });
    
    // Se o indicador não estiver mostrando, tenta detectar a posição final do mouse
    if (draggedItem && !finalDropIndicator.show) {
      console.log('🔍 Indicador não está mostrando, tentando detectar posição final...');
      
      // Tenta encontrar o elemento na posição final do mouse
      const elementsAtPoint = document.elementsFromPoint(info.point.x, info.point.y);
      
      // Procura por elementos com data-item-index ou data-folder-index
      const draggedElement = event.target.closest('[data-folder-index], [data-item-index]');
      const draggedFolderIndex = draggedElement?.dataset?.folderIndex;
      const draggedItemIndex = draggedElement?.dataset?.itemIndex;
      
      const targetElement = elementsAtPoint.find(el => {
        if (el === draggedElement || el.contains(draggedElement)) return false;
        
        const folderEl = el.closest('[data-folder-index]');
        const itemEl = el.closest('[data-item-index]');
        
        if (itemEl) {
          const folderIndex = itemEl.dataset.folderIndex;
          const itemIndex = itemEl.dataset.itemIndex;
          if (draggedItem.type === 'item' && folderIndex === draggedFolderIndex && itemIndex === draggedItemIndex) {
            return false;
          }
          return true;
        }
        
        if (folderEl) {
          const folderIndex = folderEl.dataset.folderIndex;
          if (draggedItem.type === 'folder' && folderIndex === draggedFolderIndex) {
            return false;
          }
          return true;
        }
        
        return false;
      });
      
      if (targetElement) {
        console.log('✅ Elemento alvo encontrado na posição final');
        const folderEl = targetElement.closest('[data-folder-index]');
        const itemEl = targetElement.closest('[data-item-index]');
        
        if (draggedItem.type === 'item' && itemEl) {
          const targetFolderIndex = parseInt(itemEl.dataset.folderIndex);
          const targetItemIndex = parseInt(itemEl.dataset.itemIndex);
          
          // Usa a mesma lógica melhorada do handleDrag para encontrar o item correto
          const allItemsInFolder = document.querySelectorAll(`[data-folder-index="${targetFolderIndex}"][data-item-index]`);
          let closestItem = null;
          let closestDistance = Infinity;
          const cursorY = info.point.y;
          
          // Encontra o item mais próximo do cursor (verticalmente)
          allItemsInFolder.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenterY = itemRect.top + itemRect.height / 2;
            const distance = Math.abs(cursorY - itemCenterY);
            
            // Verifica se o cursor está dentro dos limites verticais do item
            if (cursorY >= itemRect.top && cursorY <= itemRect.bottom) {
              if (distance < closestDistance) {
                closestDistance = distance;
                closestItem = item;
              }
            }
          });
          
          // Se encontrou um item próximo, usa ele; senão usa o itemEl original
          const itemElement = closestItem || document.querySelector(`[data-item-index="${targetItemIndex}"][data-folder-index="${targetFolderIndex}"]`);
          
          if (itemElement) {
            const actualTargetItemIndex = parseInt(itemElement.dataset.itemIndex);
            const itemRect = itemElement.getBoundingClientRect();
            const itemCenterY = itemRect.top + itemRect.height / 2;
            const insertBefore = cursorY < itemCenterY;
            const insertIndex = insertBefore ? actualTargetItemIndex : actualTargetItemIndex + 1;
            
            // Validação: garante que o índice está dentro dos limites válidos
            const currentRundown = localRundownRef.current || rundown;
            const targetFolder = currentRundown?.items?.[targetFolderIndex];
            const maxIndex = targetFolder?.children?.length || 0;
            const validInsertIndex = Math.max(0, Math.min(insertIndex, maxIndex));
            
            console.log('📍 handleDragEnd - Calculando insertIndex:', {
              targetItemIndex,
              actualTargetItemIndex,
              insertIndex,
              validInsertIndex,
              maxIndex,
              insertBefore
            });
            
            finalDropIndicator = {
              show: true,
              index: validInsertIndex,
              type: 'item',
              folderIndex: targetFolderIndex
            };
            dropIndicatorRef.current = finalDropIndicator;
          }
        } else if (draggedItem.type === 'item' && folderEl) {
          const targetFolderIndex = parseInt(folderEl.dataset.folderIndex);
          const currentRundown = localRundownRef.current;
          const targetFolder = currentRundown?.items[targetFolderIndex];
          
          if (targetFolder) {
            finalDropIndicator = {
              show: true,
              index: targetFolder.children.length,
              type: 'item',
              folderIndex: targetFolderIndex
            };
            dropIndicatorRef.current = finalDropIndicator;
            console.log('✅ Indicador de item atualizado:', finalDropIndicator);
          }
        } else if (draggedItem.type === 'folder' && folderEl) {
          const targetFolderIndex = parseInt(folderEl.dataset.folderIndex);
          const container = document.querySelector('.reorder-container');
          
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const relativeY = info.point.y - containerRect.top;
            const folderElement = document.querySelector(`[data-folder-index="${targetFolderIndex}"]`);
            
            if (folderElement) {
              const folderRect = folderElement.getBoundingClientRect();
              const folderRelativeY = folderRect.top - containerRect.top;
              const folderHeight = folderRect.height;
              const showAbove = relativeY < folderRelativeY + (folderHeight / 2);
              const indicatorIndex = showAbove ? targetFolderIndex : targetFolderIndex + 1;
              
              finalDropIndicator = {
                show: true,
                index: indicatorIndex,
                type: 'folder',
                folderIndex: null
              };
              dropIndicatorRef.current = finalDropIndicator;
              console.log('✅ Indicador de pasta atualizado:', finalDropIndicator);
            }
          }
        }
      } else {
        console.log('⚠️ Nenhum elemento alvo encontrado na posição final');
      }
    }
    
    // Lógica de reordenação baseada na posição final
    // EXECUTA SE O DROP FOR VÁLIDO (finalDropIndicator.show === true)
    if (draggedItem && finalDropIndicator.show) {
      const { type, data, folderIndex, itemIndex } = draggedItem;
      
      // Usa ref em vez de state direto para evitar conflitos com WebSocket
      const currentRundown = localRundownRef.current;
      
      if (!currentRundown) {
        console.error('❌ currentRundown é null no handleDragEnd');
        return;
      }
      
      console.log('🎯 Processando drop:', { 
        type, 
        folderIndex, 
        itemIndex, 
        dropIndicator: finalDropIndicator,
        currentRundownItems: currentRundown.items?.length 
      });
      
      if (type === 'folder' && finalDropIndicator.type === 'folder') {
        // Para pastas, finalDropIndicator.index é o índice onde inserir (pode ser targetFolderIndex ou targetFolderIndex + 1)
        const insertIndex = finalDropIndicator.index;
        
        // Reordenar pastas
        const newItems = [...currentRundown.items];
        const draggedFolder = newItems.splice(folderIndex, 1)[0];
        
        // Ajusta o índice de inserção considerando que já removemos o item
        let adjustedInsertIndex = insertIndex;
        if (insertIndex > folderIndex) {
          adjustedInsertIndex = insertIndex - 1;
        }
        
        // SEMPRE reorganiza se a posição for válida (remove a validação de mesma posição)
        // Isso garante que pastas "sobrepostas" sejam reorganizadas corretamente
        if (adjustedInsertIndex >= 0 && adjustedInsertIndex <= newItems.length) {
          newItems.splice(adjustedInsertIndex, 0, draggedFolder);
          
          // Atualização OTIMISTA imediata + sincronização
          setRundown({ ...currentRundown, items: newItems });
          
          if (currentRundown?.id) {
            syncFolderReorder(String(currentRundown.id), newItems);
          }
        }
      } else if (type === 'item' && finalDropIndicator.type === 'item') {
        const targetFolderIndex = finalDropIndicator.folderIndex;
        // finalDropIndicator.index é o índice ONDE devemos INSERIR (já considera +1)
        const insertIndex = finalDropIndicator.index;
        
        const newItems = [...currentRundown.items];
        
        // Validações de segurança
        if (!newItems[folderIndex]) {
          console.error('❌ sourceFolder não encontrado:', { folderIndex, itemsLength: newItems.length });
          return;
        }
        
        const sourceFolder = newItems[folderIndex];
        if (!sourceFolder.children || !Array.isArray(sourceFolder.children)) {
          console.error('❌ sourceFolder.children inválido:', sourceFolder);
          return;
        }
        
        if (itemIndex < 0 || itemIndex >= sourceFolder.children.length) {
          console.error('❌ itemIndex inválido:', { itemIndex, childrenLength: sourceFolder.children.length });
          return;
        }
        
        const sourceChildren = [...sourceFolder.children];
        const draggedItemData = sourceChildren.splice(itemIndex, 1)[0];
        
        if (!draggedItemData) {
          console.error('❌ draggedItemData é null');
          return;
        }
        
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
          
          // Validação adicional: garante que o índice ajustado não seja maior que o tamanho da lista
          // (que já foi reduzida em 1 após remover o item)
          adjustedInsertIndex = Math.max(0, Math.min(adjustedInsertIndex, sourceChildren.length));
          
          // Validações: posição válida (sempre permite reordenação se a posição for válida)
          const isValidPosition = adjustedInsertIndex >= 0 && adjustedInsertIndex <= sourceChildren.length;
          
          console.log('🔄 Reordenando dentro da mesma pasta:', {
            itemIndex,
            insertIndex,
            adjustedInsertIndex,
            sourceChildrenLength: sourceChildren.length,
            isValidPosition
          });
          
          // SEMPRE reorganiza se a posição for válida, mesmo que seja a mesma posição
          // Isso garante que itens "sobrepostos" sejam reorganizados corretamente
          if (isValidPosition) {
            console.log('✅ Reordenando item dentro da mesma pasta:', {
              itemIndex,
              adjustedInsertIndex,
              insertIndex,
              sourceChildrenLength: sourceChildren.length
            });
            
            sourceChildren.splice(adjustedInsertIndex, 0, draggedItemData);
            newItems[folderIndex] = { ...sourceFolder, children: sourceChildren };
            
            // Atualização OTIMISTA imediata + sincronização
            setRundown({ ...currentRundown, items: newItems });
            
            if (currentRundown?.id) {
              syncItemReorder(String(currentRundown.id), folderIndex, newItems[folderIndex].children);
            }
          } else {
            console.error('❌ Posição inválida para reordenação:', {
              adjustedInsertIndex,
              sourceChildrenLength: sourceChildren.length
            });
          }
        } else {
          // Entre pastas diferentes - mover
          if (!newItems[targetFolderIndex]) {
            console.error('❌ targetFolder não encontrado:', { targetFolderIndex, itemsLength: newItems.length });
            return;
          }
          
          const targetFolder = newItems[targetFolderIndex];
          const targetChildren = [...(targetFolder.children || [])];
          const finalInsertIndex = insertIndex === -1 ? targetChildren.length : insertIndex;
          
          // SEMPRE reorganiza se a posição for válida
          if (finalInsertIndex >= 0 && finalInsertIndex <= targetChildren.length) {
            console.log('✅ Movendo item entre pastas:', {
              fromFolder: folderIndex,
              toFolder: targetFolderIndex,
              finalInsertIndex,
              targetChildrenLength: targetChildren.length
            });
            
            targetChildren.splice(finalInsertIndex, 0, draggedItemData);
            
            newItems[folderIndex] = { ...sourceFolder, children: sourceChildren };
            newItems[targetFolderIndex] = { ...targetFolder, children: targetChildren };

            // Atualização OTIMISTA imediata + sincronização
            setRundown({ ...currentRundown, items: newItems });

            // Sincroniza a nova ordem de ambas as pastas
            if (currentRundown?.id) {
              syncRundownUpdate(String(currentRundown.id), { items: newItems });
            }
          } else {
            console.error('❌ finalInsertIndex inválido:', { finalInsertIndex, targetChildrenLength: targetChildren.length });
          }
        }
      }
    }
    
    // Libera flag DEPOIS de sincronizar
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverIndex(-1);
    
    // Reseta o ref e o state
    const resetIndicator = { show: false, index: -1, type: null, folderIndex: null };
    dropIndicatorRef.current = resetIndicator;
    setDropIndicator(resetIndicator);
    
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
            <div 
              className="flex-1 overflow-y-auto relative overflow-x-hidden" 
              style={{ 
                width: '100%',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y'
              }}
            >
              <Reorder.Group axis="y" values={rundown.items} onReorder={handleFolderReorder} className="space-y-2 p-1 min-h-full">
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
                    <Reorder.Group axis="y" values={folder.children || []} onReorder={(newOrder) => handleItemReorder(fIndex, newOrder)} className="border-t border-border p-1 space-y-1">
                      {(folder.children || []).map((item, iIndex) => {
                        const isCurrent = currentItemIndex.folderIndex === fIndex && currentItemIndex.itemIndex === iIndex;
                        const itemStartTime = calculateElapsedTimeForIndex(fIndex, iIndex, rundown.items);
                        const itemElapsedTime = isCurrent && isRunning ? timeElapsed - itemStartTime : 0;
                        const remainingTime = Math.max(0, item.duration - itemElapsedTime);
                        const progress = isCurrent && item.duration > 0 ? Math.min((itemElapsedTime / item.duration) * 100, 100) : 0;
                        let progressColor = 'bg-blue-500';
                        if (remainingTime <= 30) progressColor = 'bg-yellow-500';
                        if (remainingTime <= 10) progressColor = 'bg-red-500';
                        return (
                          <Reorder.Item key={item.id} value={item} className={cn("group relative flex items-center gap-2 sm:gap-4 p-3 rounded-md border-l-4 overflow-hidden", isCurrent ? 'bg-primary/20' : 'bg-card hover:bg-secondary')} style={{ borderColor: item.color }}>
                            <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground cursor-grab flex-shrink-0" />
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
                          </Reorder.Item>
                        );
                      })}
                      {(folder.children || []).length === 0 && (
                        <div className="text-center text-muted-foreground p-4 text-sm">
                          Esta pasta está vazia. Adicione um evento.
                        </div>
                      )}
                    </Reorder.Group>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </div>
        </main>
      </div>
      
      {/* DnD visual flutuante removido; Reorder lida com o feedback de arraste */}
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
        currentItem={rundown?.items[currentItemIndex.folderIndex]?.children[currentItemIndex.itemIndex]}
      />
    </>
  );
};

export default OperatorView;