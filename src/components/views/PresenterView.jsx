import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Info, Wifi, WifiOff, FileText, EyeOff, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiveClock from '@/components/shared/LiveClock';
import * as Icons from 'lucide-react';
import FormattedScript from '@/components/shared/FormattedScript';
import { useToast } from '@/components/ui/use-toast';
import { useRundown } from '@/contexts/RundownContext.jsx';
import { useTimer } from '@/contexts/TimerContext.jsx';
import { useSync } from '@/contexts/SyncContext.jsx';
import { usePresenterConfig } from '@/contexts/PresenterConfigContext.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/useApi';

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

const getIcon = (item, className = "w-16 h-16 text-primary mx-auto mb-4") => {
  if (item.iconType === 'image' && item.iconData) {
    return <img src={item.iconData} alt={item.title} className={cn(className, "object-contain")} />;
  }
  const Icon = Icons[item.iconData || item.icon];
  return Icon ? <Icon className={className} /> : <Icons.HelpCircle className={className} />;
};

const UrgencyIndicator = ({ urgency }) => {
  const urgencyStyles = {
    normal: 'bg-green-500/20 text-green-400',
    attention: 'bg-yellow-500/20 text-yellow-400',
    urgent: 'bg-red-500/20 text-red-400',
  };
  const urgencyText = {
    normal: 'Normal',
    attention: 'Atenção',
    urgent: 'Urgente',
  };
  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${urgencyStyles[urgency] || 'bg-gray-500/20 text-gray-400'}`}>
      {urgencyText[urgency] || 'Padrão'}
    </span>
  );
};

const TimeDisplay = React.memo(({ time, className }) => {
  return <p className={className}>{formatTime(time)}</p>;
});

const ProgressBar = ({ progress, remainingTime }) => {
  let colorClass = 'bg-green-500';
  if (remainingTime <= 30) colorClass = 'bg-yellow-500';
  if (remainingTime <= 10) colorClass = 'bg-red-500';

  return (
    <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
      <motion.div
        className={cn("h-4 rounded-full", colorClass)}
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

const PresenterView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    activeRundown: rundown,
    currentItemIndex,
    isRunning,
    loadRundownState,
  } = useRundown();
  const { timeElapsed } = useTimer();
  const { isConnected, setActiveRundownId } = useSync();
  
  // Configurações sincronizadas com operador
  const { presenterConfig, updatePresenterConfig } = usePresenterConfig();

  const { toast } = useToast();
  const { apiCall } = useApi();
  const triggeredAlerts = useRef(new Set());
  const [flash, setFlash] = useState(false);
  const [currentScript, setCurrentScript] = useState(null);
  
  // Estado local para mostrar painel de configurações
  const [showSettings, setShowSettings] = useState(false);
  
  // Estado para auto-scroll
  const [scrollProgress, setScrollProgress] = useState(0); // 0-100%
  const scriptContainerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);
  const [manualScrollUntil, setManualScrollUntil] = useState(0);

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
      console.log('🔗 PresenterView: Conectando ao rundown:', projectId);
      setActiveRundownId(projectId);
    }
    
    return () => {
      console.log('🔗 PresenterView: Desconectando do rundown:', projectId);
      setActiveRundownId(null);
    };
  }, [projectId, setActiveRundownId]);

  const currentItem = useMemo(() => rundown?.items[currentItemIndex.folderIndex]?.children[currentItemIndex.itemIndex], [rundown, currentItemIndex]);
  
  const flatItems = useMemo(() => rundown?.items.flatMap(f => f.children) || [], [rundown]);
  
  const globalCurrentIndex = useMemo(() => {
    if (!rundown) return -1;
    return rundown.items.slice(0, currentItemIndex.folderIndex).reduce((acc, f) => acc + f.children.length, 0) + currentItemIndex.itemIndex;
  }, [rundown, currentItemIndex]);

  const itemElapsedTime = useMemo(() => {
    if (!currentItem || !isRunning) return 0;
    const previousItemsDuration = rundown.items.slice(0, currentItemIndex.folderIndex).reduce((acc, f) => acc + f.children.reduce((a, i) => a + i.duration, 0), 0) + rundown.items[currentItemIndex.folderIndex].children.slice(0, currentItemIndex.itemIndex).reduce((a, i) => a + i.duration, 0);
    return timeElapsed - previousItemsDuration;
  }, [timeElapsed, currentItem, currentItemIndex, rundown, isRunning]);

  const remainingTime = useMemo(() => {
    if (!currentItem || !isRunning) return currentItem?.duration || 0;
    return Math.max(currentItem.duration - itemElapsedTime, 0);
  }, [itemElapsedTime, currentItem, isRunning]);

  const progress = useMemo(() => {
    if (!currentItem || !isRunning || currentItem.duration <= 0) return 0;
    return Math.min((itemElapsedTime / currentItem.duration) * 100, 100);
  }, [itemElapsedTime, currentItem, isRunning]);

  useEffect(() => {
    if (currentItem) {
      triggeredAlerts.current.clear();
    }
  }, [currentItem]);

  // Função para tocar som de alerta
  const playAlertSound = useCallback((frequency = 800, duration = 200) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }, []);

  useEffect(() => {
    if (!currentItem || !isRunning) return;

    const remainingSeconds = Math.round(remainingTime);
    const nextItem = flatItems[globalCurrentIndex + 1];

    const showToast = (title, description) => {
      toast({
        title,
        description,
        duration: 3000,
      });
    };

    const triggerFlash = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 1000);
    };

    if (remainingSeconds === 60 && !triggeredAlerts.current.has('1min')) {
      if (nextItem) showToast('⏳ 1 Minuto Restante', `Próximo evento: ${nextItem.title}`);
      playAlertSound(600, 300);
      triggerFlash();
      triggeredAlerts.current.add('1min');
    }

    if (remainingSeconds === 30 && !triggeredAlerts.current.has('30s')) {
      if (nextItem) showToast('⏳ 30 Segundos Restantes', `Próximo evento: ${nextItem.title}`);
      playAlertSound(800, 250);
      triggerFlash();
      triggeredAlerts.current.add('30s');
    }

    if (remainingSeconds <= 10 && remainingSeconds > 0 && !triggeredAlerts.current.has(`countdown-${remainingSeconds}`)) {
      if (nextItem) showToast(`⏳ ${remainingSeconds} segundos...`, `Preparar para: ${nextItem.title}`);
      playAlertSound(1000, 150);
      triggerFlash();
      triggeredAlerts.current.add(`countdown-${remainingSeconds}`);
    }
  }, [remainingTime, currentItem, isRunning, flatItems, globalCurrentIndex, toast, playAlertSound]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Carregar script do item atual
  useEffect(() => {
    const loadScript = async () => {
      if (!currentItem?.id) {
        setCurrentScript(null);
        return;
      }

      try {
        // Verifica se o item tem ID temporário (string) ou real (número)
        const isTemporaryId = isNaN(Number(currentItem.id));
        
        if (isTemporaryId) {
          // Item ainda não foi salvo no backend: não tenta carregar da API
          console.log('📝 Item temporário, pulando carregamento da API:', currentItem.id);
          setCurrentScript(null);
          return;
        }
        
        const response = await apiCall(`/api/items/${currentItem.id}/script`);
        
        if (response.ok) {
          const data = await response.json();
          setCurrentScript(data);
        } else {
          setCurrentScript(null);
        }
      } catch (error) {
        console.error('Erro ao carregar script:', error);
        setCurrentScript(null);
      }
    };

    loadScript();
  }, [currentItem, apiCall]);

  // Função para toggle do script
  const toggleScript = () => {
    updatePresenterConfig({ showScript: !presenterConfig.showScript });
    toast({
      title: !presenterConfig.showScript ? "📖 Script Visível" : "👁️ Script Oculto",
      description: !presenterConfig.showScript 
        ? "Exibindo scripts dos itens" 
        : "Modo simplificado ativado - apenas títulos",
      duration: 2000
    });
  };

  // Função para entrar em fullscreen
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  // Função para sair do fullscreen
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  // Auto-scroll do script
  useEffect(() => {
    const container = scriptContainerRef.current;
    if (!container) return;
    if (!presenterConfig.autoScroll || !currentItem) return;

    const getTotalHeight = () => Math.max(0, container.scrollHeight - container.clientHeight);
    const itemDuration = Number(currentItem.duration) || 0;
    const effectiveDuration = itemDuration > 0 ? itemDuration : 120;
    const getPixelsPerSecond = () => (getTotalHeight() / effectiveDuration) * presenterConfig.scrollSpeed;

    const step = (ts) => {
      if (Date.now() >= manualScrollUntil) {
        if (lastTsRef.current) {
          const dt = Math.min((ts - lastTsRef.current) / 1000, 0.2);
          const totalHeight = getTotalHeight();
          if (container.scrollTop < totalHeight) {
            const minStep = 0.5;
            const pixelsPerSecond = getPixelsPerSecond();
            const delta = Math.max(minStep, pixelsPerSecond * dt);
            container.scrollTop = Math.min(totalHeight, container.scrollTop + delta);
            const progress = totalHeight > 0 ? (container.scrollTop / totalHeight) * 100 : 100;
            setScrollProgress(Math.min(progress, 100));
          } else {
            setScrollProgress(100);
          }
        }
      }
      lastTsRef.current = ts;
      rafRef.current = requestAnimationFrame(step);
    };

    const start = () => {
      lastTsRef.current = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    const startTimeout = setTimeout(start, 50);

    const onWheel = () => setManualScrollUntil(Date.now() + 1200);
    const onTouch = () => setManualScrollUntil(Date.now() + 1200);
    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('touchmove', onTouch, { passive: true });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(startTimeout);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchmove', onTouch);
      lastTsRef.current = 0;
    };
  }, [presenterConfig.autoScroll, presenterConfig.scrollSpeed, currentItem, manualScrollUntil]);

  // Reset scroll ao mudar de item
  useEffect(() => {
    if (scriptContainerRef.current) {
      scriptContainerRef.current.scrollTop = 0;
      setScrollProgress(0);
    }
  }, [currentItem]);

  // Pausa breve ao entrar/sair de fullscreen
  useEffect(() => {
    const onFsChange = () => {
      setManualScrollUntil(Date.now() + 600);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          // F: Toggle Fullscreen
          if (document.fullscreenElement) {
            exitFullscreen();
            toast({ title: "🖥️ Fullscreen Desativado", duration: 1500 });
          } else {
            enterFullscreen();
            toast({ title: "🖥️ Fullscreen Ativado", duration: 1500 });
          }
          break;
        
        case 's':
          // S: Toggle Script
          toggleScript();
          break;
        
        case 'h':
          // H: Hide/Show Header
          document.querySelector('header')?.classList.toggle('hidden');
          toast({ title: "👁️ Interface Alternada", duration: 1500 });
          break;
        
        case 'a':
          // A: Toggle Auto-scroll
          updatePresenterConfig({ autoScroll: !presenterConfig.autoScroll });
          toast({ 
            title: !presenterConfig.autoScroll ? "▶️ Auto-scroll Ativado" : "⏸️ Auto-scroll Pausado", 
            duration: 1500 
          });
          break;
        
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toast, toggleScript, presenterConfig.autoScroll, updatePresenterConfig]);

  return (
    <div 
      className="min-h-screen text-gray-100 p-3 sm:p-6 flex flex-col font-sans relative"
      style={{ backgroundColor: presenterConfig.backgroundColor }}
    >
      {isMounted && (
        <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #1a202c 0, #000 70%)' }} />
      )}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
      
      <AnimatePresence>
        {flash && (
          <motion.div
            className="absolute inset-0 z-0"
            style={{ backgroundColor: currentItem?.color || '#8B5CF6' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      <header className="relative z-10 flex items-center justify-between mb-3 sm:mb-6 flex-shrink-0">
        <Button 
          onClick={() => navigate('/projects')}
          variant="ghost"
          className="hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Sair
        </Button>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <motion.div 
            className="w-4 h-4 rounded-full"
            animate={{
              backgroundColor: isRunning ? ['#ff0000', '#ff4d4d', '#ff0000'] : '#4a5568',
              boxShadow: isRunning ? '0 0 12px #ff0000' : 'none'
            }}
            transition={isRunning ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
          />
          <h1 className="text-lg sm:text-2xl font-bold tracking-widest">
            {isRunning ? 'AO VIVO' : 'STANDBY'}
          </h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-400">
                <Wifi className="w-4 h-4" />
                <span className="text-sm">Sincronizado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-400">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Desconectado</span>
              </div>
            )}
          </div>
          
          {/* Botão Toggle Script */}
          <Button
            onClick={toggleScript}
            variant={presenterConfig.showScript ? "default" : "outline"}
            size="sm"
            className="gap-2"
            title={presenterConfig.showScript ? "Ocultar Scripts (S)" : "Mostrar Scripts (S)"}
          >
            {presenterConfig.showScript ? (
              <>
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Script</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="hidden sm:inline">Simplificado</span>
              </>
            )}
          </Button>

          {/* Botão Configurações */}
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant={showSettings ? "default" : "outline"}
            size="sm"
            className="gap-2"
            title="Configurações de Visualização"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Config</span>
          </Button>
          
          {/* Indicador de Atalhos */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
            <kbd className="px-2 py-1 bg-white/10 rounded">F</kbd>
            <span>Fullscreen</span>
            <kbd className="px-2 py-1 bg-white/10 rounded ml-2">S</kbd>
            <span>Script</span>
            <kbd className="px-2 py-1 bg-white/10 rounded ml-2">A</kbd>
            <span>Auto-scroll</span>
            <kbd className="px-2 py-1 bg-white/10 rounded ml-2">H</kbd>
            <span>Ocultar</span>
          </div>
        </div>
        <LiveClock />
      </header>

      {/* Painel de Configurações */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-20 mx-3 sm:mx-6 mb-3 sm:mb-4 bg-card/95 backdrop-blur-lg border border-border rounded-xl p-4 sm:p-6 shadow-2xl max-h-[calc(100vh-150px)] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações de Visualização
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Tamanho da Fonte */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  Tamanho da Fonte
                  <span className="text-xs text-muted-foreground">{presenterConfig.fontSize}px</span>
                </label>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={presenterConfig.fontSize}
                  onChange={(e) => updatePresenterConfig({ fontSize: parseInt(e.target.value) })}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>16px</span>
                  <span>48px</span>
                </div>
              </div>

              {/* Espaçamento entre Linhas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  Espaçamento
                  <span className="text-xs text-muted-foreground">{presenterConfig.lineHeight.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={presenterConfig.lineHeight}
                  onChange={(e) => updatePresenterConfig({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Compacto</span>
                  <span>Espaçado</span>
                </div>
              </div>

              {/* Família da Fonte */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Fonte
                </label>
                <select
                  value={presenterConfig.fontFamily}
                  onChange={(e) => updatePresenterConfig({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="sans-serif">Sans-serif (Moderna)</option>
                  <option value="serif">Serif (Clássica)</option>
                  <option value="mono">Monospace (Código)</option>
                </select>
              </div>

              {/* Auto-scroll */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  Auto-scroll
                  <span className={`text-xs px-2 py-1 rounded-full ${presenterConfig.autoScroll ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {presenterConfig.autoScroll ? 'Ativo' : 'Inativo'}
                  </span>
                </label>
                <Button
                  onClick={() => updatePresenterConfig({ autoScroll: !presenterConfig.autoScroll })}
                  variant={presenterConfig.autoScroll ? "default" : "outline"}
                  className="w-full"
                  size="sm"
                >
                  {presenterConfig.autoScroll ? '⏸️ Pausar' : '▶️ Ativar'} Auto-scroll
                </Button>
                <p className="text-xs text-muted-foreground">
                  Atalho: Tecla <kbd className="px-1 py-0.5 bg-white/10 rounded text-xs">A</kbd>
                </p>
              </div>

              {/* Velocidade do Scroll */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  Velocidade
                  <span className="text-xs text-muted-foreground">{presenterConfig.scrollSpeed.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={presenterConfig.scrollSpeed}
                  onChange={(e) => updatePresenterConfig({ scrollSpeed: parseFloat(e.target.value) })}
                  disabled={!presenterConfig.autoScroll}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x (Lento)</span>
                  <span>2.0x (Rápido)</span>
                </div>
              </div>
            </div>

            {/* Preview da Formatação */}
            <div className="mt-6 p-4 bg-black/40 rounded-lg border border-white/10">
              <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">Preview</h4>
              <FormattedScript
                text="Este é um **texto em negrito**, com __ênfase__, [PAUSA] e texto normal. [IMPORTANTE]"
                className="text-left"
                style={{
                  fontSize: `${presenterConfig.fontSize}px`,
                  lineHeight: presenterConfig.lineHeight,
                  fontFamily: presenterConfig.fontFamily === 'serif' ? 'Georgia, serif' : 
                             presenterConfig.fontFamily === 'mono' ? 'monospace' : 
                             'Inter, system-ui, sans-serif',
                  color: presenterConfig.textColor
                }}
              />
            </div>

            {/* Botão para Resetar */}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePresenterConfig({
                  fontSize: 24,
                  lineHeight: 1.8,
                  fontFamily: 'sans-serif',
                  backgroundColor: '#000000',
                  textColor: '#FFFFFF',
                  autoScroll: false,
                  scrollSpeed: 1.0
                })}
              >
                Resetar Padrões
              </Button>
              <Button
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                Fechar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center overflow-y-auto">
        {!rundown ? (
          <div className="text-center">
            <AlertTriangle className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Aguardando Rundown</h2>
            <p className="text-xl text-gray-400">O operador ainda não iniciou um projeto</p>
          </div>
        ) : (
          <div className="w-full max-w-6xl space-y-8 py-4">
            <AnimatePresence mode="wait">
              {currentItem && (
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden"
                  style={{
                    '--item-color': currentItem.color || '#8B5CF6',
                  }}
                >
                  <motion.div 
                    className="absolute inset-0 border-2 rounded-3xl pointer-events-none"
                    style={{ borderColor: 'var(--item-color)' }}
                    animate={{
                      boxShadow: isRunning ? ['0 0 15px 0px var(--item-color)', '0 0 30px 5px var(--item-color)', '0 0 15px 0px var(--item-color)'] : '0 0 10px 0px var(--item-color)',
                    }}
                    transition={isRunning ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                  />
                  
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <p className="text-lg font-medium" style={{ color: 'var(--item-color)' }}>AGORA</p>
                    <UrgencyIndicator urgency={currentItem.urgency} />
                  </div>
                  {getIcon(currentItem, "w-20 h-20 mx-auto mb-4")}
                  <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-4">{currentItem.title}</h2>
                  <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-6 max-w-3xl mx-auto">{currentItem.description}</p>
                  
                  {currentItem.reminder && (
                    <div className="mb-6 inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg">
                      <Info className="w-5 h-5" />
                      <span className="font-semibold">{currentItem.reminder}</span>
                    </div>
                  )}

                  {/* Script do Apresentador */}
                  {presenterConfig.showScript && currentScript && currentScript.script && (
                    <div className="mb-6 bg-black/40 rounded-xl border border-white/5">
                      {/* Header com indicador de progresso */}
                      <div className="px-6 pt-6 pb-2">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                            <Icons.FileText className="w-5 h-5" />
                            Script
                          </h3>
                          {presenterConfig.autoScroll && isRunning && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-400 animate-pulse">▶️ Auto-scroll</span>
                              <span className="text-muted-foreground">{scrollProgress.toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Barra de progresso de leitura */}
                        {presenterConfig.autoScroll && (
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-4">
                            <motion.div
                              className="h-2 bg-primary rounded-full"
                              initial={{ width: '0%' }}
                              animate={{ width: `${scrollProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Container do script com scroll */}
                      <div 
                        ref={scriptContainerRef}
                        className="px-4 sm:px-6 pb-4 sm:pb-6 max-h-[60vh] min-h-[200px] overflow-y-auto scroll-smooth"
                      >
                        <FormattedScript 
                          text={currentScript.script}
                          className="text-left leading-relaxed whitespace-pre-wrap"
                          style={{
                            fontSize: `${presenterConfig.fontSize}px`,
                            lineHeight: presenterConfig.lineHeight,
                            fontFamily: presenterConfig.fontFamily === 'serif' ? 'Georgia, serif' : 
                                       presenterConfig.fontFamily === 'mono' ? 'monospace' : 
                                       'Inter, system-ui, sans-serif',
                            color: presenterConfig.textColor
                          }}
                        />
                        {currentScript.presenter_notes && (
                          <div className="mt-6 pt-4 border-t border-white/10">
                            <h4 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                              <Icons.StickyNote className="w-4 h-4" />
                              Notas Privadas
                            </h4>
                            <div className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                              {currentScript.presenter_notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-lg font-mono">
                      <span className="text-gray-400">Progresso</span>
                      <span className="font-bold text-white">{formatTimeShort(remainingTime)}</span>
                    </div>
                    <ProgressBar progress={progress} remainingTime={remainingTime} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Próximos Eventos</h3>
              <div className="space-y-2 sm:space-y-3">
                {flatItems.slice(globalCurrentIndex + 1, globalCurrentIndex + 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-white/5 rounded-lg" style={{ borderLeft: `4px solid ${item.color || 'transparent'}` }}>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-gray-400 flex-shrink-0">
                      {getIcon(item, "w-4 h-4 sm:w-6 sm:h-6")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm sm:text-base truncate">{item.title}</h4>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <UrgencyIndicator urgency={item.urgency} />
                      <div className="text-xs sm:text-sm font-mono text-gray-400">
                        {formatTimeShort(item.duration)}
                      </div>
                    </div>
                  </div>
                ))}
                 {flatItems.length <= globalCurrentIndex + 1 && (
                    <div className="text-center text-gray-500 p-4">
                        Não há mais eventos no rundown.
                    </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PresenterView;
