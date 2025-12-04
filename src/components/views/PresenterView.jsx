import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Info, Wifi, WifiOff } from 'lucide-react';
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
  
  // Configurações sincronizadas com operador (apenas leitura)
  const { presenterConfig } = usePresenterConfig();

  const { toast } = useToast();
  const { apiCall } = useApi();
  const triggeredAlerts = useRef(new Set());
  const [flash, setFlash] = useState(false);
  const [currentScript, setCurrentScript] = useState(null);
  
  
  // Estado para auto-scroll
  const [scrollProgress, setScrollProgress] = useState(0); // 0-100%
  const scriptContainerRef = useRef(null);
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);
  const manualScrollUntil = useRef(0);
  const accumulatedScroll = useRef(0); // Acumulador de scroll para garantir movimento
  const savedScrollPosition = useRef(0); // Salva posição quando oculta/mostra script

  useEffect(() => {
    if (!rundown || rundown.id !== projectId) {
      console.log('🔗 PresenterView: Carregando rundown:', projectId);
      const rundownData = loadRundownState(projectId);
      console.log('🔗 PresenterView: Rundown carregado:', rundownData?.name);
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
      
      // CRÍTICO: Solicita estado atual do timer após conectar
      // Aguarda um pouco para garantir que o WebSocket está conectado
      // Solicita múltiplas vezes para garantir que recebe o estado
      const requestTimerState1 = setTimeout(() => {
        console.log('📡 PresenterView: Solicitando estado atual do timer (tentativa 1)...');
        window.dispatchEvent(new CustomEvent('requestTimerState', {
          detail: { rundownId: projectId }
        }));
      }, 1000); // Aguarda 1 segundo após conectar
      
      const requestTimerState2 = setTimeout(() => {
        console.log('📡 PresenterView: Solicitando estado atual do timer (tentativa 2)...');
        window.dispatchEvent(new CustomEvent('requestTimerState', {
          detail: { rundownId: projectId }
        }));
      }, 2500); // Aguarda 2.5 segundos (segunda tentativa)
      
      const requestTimerState3 = setTimeout(() => {
        console.log('📡 PresenterView: Solicitando estado atual do timer (tentativa 3)...');
        window.dispatchEvent(new CustomEvent('requestTimerState', {
          detail: { rundownId: projectId }
        }));
      }, 4000); // Aguarda 4 segundos (terceira tentativa)
      
      return () => {
        clearTimeout(requestTimerState1);
        clearTimeout(requestTimerState2);
        clearTimeout(requestTimerState3);
        console.log('🔗 PresenterView: Desconectando do rundown:', projectId);
        setActiveRundownId(null);
      };
    }
  }, [projectId, setActiveRundownId]);

  const currentItem = useMemo(() => rundown?.items[currentItemIndex.folderIndex]?.children[currentItemIndex.itemIndex], [rundown, currentItemIndex]);
  
  const flatItems = useMemo(() => {
    if (!rundown?.items || !Array.isArray(rundown.items)) return [];
    return rundown.items.flatMap(f => f.children || []);
  }, [rundown]);
  
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

  // AudioContext global para evitar problemas de autoplay
  const audioContextRef = useRef(null);
  
  // Inicializa AudioContext na primeira interação do usuário
  useEffect(() => {
    const initAudioContext = async () => {
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          // Tenta resumir o contexto (necessário para autoplay)
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        } catch (error) {
          console.warn('Erro ao inicializar AudioContext:', error);
        }
      }
    };
    
    // Inicializa quando o usuário interage pela primeira vez
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

  // Função para tocar som de alerta
  const playAlertSound = useCallback(async (frequency = 800, duration = 200) => {
    // Verifica se deve tocar som baseado na configuração
    const shouldPlay = presenterConfig.audioAlerts === 'presenter' || presenterConfig.audioAlerts === 'both';
    if (!shouldPlay) {
      return;
    }
    
    try {
      // Garante que o AudioContext está inicializado
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      // Resume o contexto se estiver suspenso
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

  // Função para carregar script do item atual
  const loadScript = useCallback(async (itemId) => {
    if (!itemId) {
      setCurrentScript(null);
      return;
    }

    try {
      // Verifica se o item tem ID temporário (string) ou real (número)
      const isTemporaryId = isNaN(Number(itemId));
      
      if (isTemporaryId) {
        // Item ainda não foi salvo no backend: não tenta carregar da API
        console.log('📝 Item temporário, pulando carregamento da API:', itemId);
        setCurrentScript(null);
        return;
      }
      
      const response = await apiCall(`/api/items/${itemId}/script`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Script carregado para item:', itemId, data);
        setCurrentScript(data);
      } else {
        console.warn('⚠️ Erro ao carregar script:', response.status);
        setCurrentScript(null);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar script:', error);
      setCurrentScript(null);
    }
  }, [apiCall]);

  // Carregar script do item atual quando o item muda
  useEffect(() => {
    if (currentItem?.id) {
      loadScript(currentItem.id);
    } else {
      setCurrentScript(null);
    }
  }, [currentItem?.id, loadScript]);

  // Listener para detectar quando o script foi atualizado via sincronização
  useEffect(() => {
    const handleRundownSync = (event) => {
      const { rundownId, changes } = event.detail;
      
      // Verifica se há mudanças nos items e se o item atual foi atualizado
      if (changes?.items && currentItem?.id && rundown?.id && String(rundown.id) === String(rundownId)) {
        console.log('📡 PresenterView: Detectada atualização de items, verificando script do item atual...', {
          currentItemId: currentItem.id,
          changes: changes.items
        });
        
        // Verifica se o item atual está nas mudanças
        const itemWasUpdated = changes.items.some(folder => 
          folder.children?.some(item => String(item.id) === String(currentItem.id))
        );
        
        if (itemWasUpdated) {
          console.log('✅ PresenterView: Item atual foi atualizado, recarregando script...');
          // Recarrega o script do item atual
          loadScript(currentItem.id);
        }
      }
    };

    // Listener para evento de atualização de script específico
    const handleScriptUpdated = (event) => {
      const { itemId } = event.detail;
      if (itemId && currentItem?.id && String(itemId) === String(currentItem.id)) {
        console.log('📡 PresenterView: Script atualizado detectado, recarregando...', itemId);
        loadScript(currentItem.id);
      }
    };

    window.addEventListener('rundownSync', handleRundownSync);
    window.addEventListener('scriptUpdated', handleScriptUpdated);

    return () => {
      window.removeEventListener('rundownSync', handleRundownSync);
      window.removeEventListener('scriptUpdated', handleScriptUpdated);
    };
  }, [currentItem, rundown, loadScript]);


  // Auto-scroll do script
  useEffect(() => {
    const container = scriptContainerRef.current;
    
    // Log inicial para debug
    console.log('🔍 Auto-scroll: useEffect executado', {
      hasContainer: !!container,
      autoScroll: presenterConfig.autoScroll,
      showScript: presenterConfig.showScript,
      hasCurrentItem: !!currentItem,
      isRunning,
      hasCurrentScript: !!currentScript,
      hasScript: !!(currentScript?.script),
      scrollSpeed: presenterConfig.scrollSpeed
    });
    
    if (!container) {
      console.log('⚠️ Auto-scroll: Container não encontrado');
      return;
    }
    
    // Verifica se o script está visível
    if (!presenterConfig.showScript) {
      console.log('⚠️ Auto-scroll: Script oculto, salvando posição e parando scroll');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Salva a posição atual do scroll para restaurar depois
      if (container) {
        savedScrollPosition.current = container.scrollTop;
        accumulatedScroll.current = container.scrollTop;
      }
      // Não reseta o progresso, apenas para a animação
      return;
    }
    
    if (!presenterConfig.autoScroll || !currentItem) {
      console.log('⚠️ Auto-scroll: Desativado ou sem item', { 
        autoScroll: presenterConfig.autoScroll, 
        hasItem: !!currentItem,
        currentItemId: currentItem?.id,
        currentItemTitle: currentItem?.title
      });
      // Só reseta se auto-scroll foi DESATIVADO (não apenas pausado)
      if (!presenterConfig.autoScroll) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setScrollProgress(0);
        accumulatedScroll.current = 0;
        savedScrollPosition.current = 0;
      }
      return;
    }

    if (!isRunning) {
      console.log('⚠️ Auto-scroll: Timer não está rodando, pausando scroll mas mantendo posição', { isRunning });
      // Pausa a animação mas mantém a posição atual
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Salva a posição atual
      if (container) {
        savedScrollPosition.current = container.scrollTop;
        accumulatedScroll.current = container.scrollTop;
      }
      return;
    }
    
    // Verifica se o script está disponível
    if (!currentScript || !currentScript.script) {
      console.log('⚠️ Auto-scroll: Script não disponível ainda', { 
        hasCurrentScript: !!currentScript, 
        hasScript: !!(currentScript?.script),
        currentItemId: currentItem?.id,
        currentItemTitle: currentItem?.title
      });
      return;
    }

    console.log('✅ Auto-scroll: Todas as condições atendidas, iniciando...', { 
      autoScroll: presenterConfig.autoScroll, 
      isRunning, 
      scrollSpeed: presenterConfig.scrollSpeed,
      itemDuration: currentItem.duration,
      scriptLength: currentScript.script?.length || 0
    });

    const getTotalHeight = () => {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const total = Math.max(0, scrollHeight - clientHeight);
      
      // Log quando não há altura (para debug)
      if (total === 0 && scrollHeight > 0) {
        console.warn('⚠️ Auto-scroll: Container sem altura para scrollar', {
          scrollHeight,
          clientHeight,
          total,
          hasContent: container.children.length > 0,
          containerVisible: container.offsetHeight > 0
        });
      }
      
      return total;
    };
    
    const itemDuration = Number(currentItem.duration) || 0;
    const effectiveDuration = itemDuration > 0 ? itemDuration : 120;
    
    const getPixelsPerSecond = () => {
      const totalHeight = getTotalHeight();
      if (totalHeight <= 0) return 0;
      // Calcula pixels por segundo baseado na duração do item e velocidade configurada
      // scrollSpeed é um multiplicador (0.05x = muito lento, 2.0x = muito rápido)
      const basePixelsPerSecond = totalHeight / effectiveDuration;
      const pixelsPerSecond = basePixelsPerSecond * presenterConfig.scrollSpeed;
      
      // Log apenas quando mudar significativamente
      if (pixelsPerSecond > 0 && pixelsPerSecond < 1) {
        console.log('🐌 Auto-scroll: Velocidade muito lenta', { 
          totalHeight, 
          effectiveDuration, 
          scrollSpeed: presenterConfig.scrollSpeed, 
          pixelsPerSecond: pixelsPerSecond.toFixed(4) 
        });
      }
      
      return pixelsPerSecond;
    };

    const step = (ts) => {
      // Log apenas ocasionalmente para não poluir o console
      if (Math.random() < 0.01) { // 1% das vezes
        console.log('🔄 Auto-scroll: step executado', {
          isRunning,
          autoScroll: presenterConfig.autoScroll,
          hasContainer: !!container,
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight
        });
      }
      
      if (!isRunning || !presenterConfig.autoScroll) {
        console.log('⏸️ Auto-scroll: Parando', { isRunning, autoScroll: presenterConfig.autoScroll });
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        return;
      }

      // Verifica se pode fazer scroll (não está em pausa manual)
      const canScroll = Date.now() >= manualScrollUntil.current;
      
      if (canScroll) {
        if (lastTsRef.current) {
          const dt = Math.min((ts - lastTsRef.current) / 1000, 0.2);
          const totalHeight = getTotalHeight();
          
          if (totalHeight > 0) {
            const currentScrollTop = container.scrollTop;
            
            // Verifica se ainda não chegou no final (com margem de 2px para evitar problemas de arredondamento)
            if (currentScrollTop < totalHeight - 2) {
              // Calcula velocidade baseada na duração do item
              const pixelsPerSecond = getPixelsPerSecond();
              
              // Log de debug para entender o problema
              if (pixelsPerSecond === 0) {
                console.warn('⚠️ Auto-scroll: pixelsPerSecond é 0!', {
                  totalHeight: getTotalHeight(),
                  effectiveDuration,
                  scrollSpeed: presenterConfig.scrollSpeed,
                  currentItem: currentItem?.title
                });
                // Não retorna, apenas continua (pode ser temporário)
              }
              
              // Calcula delta baseado no tempo decorrido
              let delta = pixelsPerSecond * dt;
              
              // Garante movimento mínimo para evitar travamento
              // Sempre garante movimento quando há velocidade configurada
              if (pixelsPerSecond > 0) {
                // Mínimo absoluto: garante movimento mesmo quando dt é muito pequeno
                // Ajustado para ser menor em velocidades baixas, maior em velocidades altas
                let minDelta;
                if (presenterConfig.scrollSpeed < 0.3) {
                  minDelta = 0.1; // Muito lento: mínimo menor
                } else if (presenterConfig.scrollSpeed < 1.0) {
                  minDelta = 0.2; // Lento: mínimo médio
                } else {
                  minDelta = 0.3; // Normal/Rápido: mínimo maior
                }
                
                // Se o delta calculado for muito pequeno ou zero, usa o mínimo
                if (delta <= 0 || delta < minDelta) {
                  const oldDelta = delta;
                  delta = minDelta;
                  // Log apenas na primeira vez ou quando delta é muito pequeno
                  if (oldDelta <= 0 || (oldDelta < 0.01 && Math.random() < 0.1)) {
                    console.log('🔧 Auto-scroll: Aplicando mínimo', {
                      oldDelta: oldDelta.toFixed(4),
                      newDelta: delta.toFixed(4),
                      minDelta: minDelta.toFixed(4),
                      pixelsPerSecond: pixelsPerSecond.toFixed(4),
                      dt: dt.toFixed(4),
                      scrollSpeed: presenterConfig.scrollSpeed
                    });
                  }
                }
              } else {
                // Se pixelsPerSecond é 0, tenta usar um mínimo absoluto muito pequeno
                // Isso pode acontecer temporariamente durante o carregamento
                delta = 0.05;
                console.warn('⚠️ Auto-scroll: pixelsPerSecond é 0, usando mínimo absoluto', {
                  totalHeight,
                  effectiveDuration,
                  scrollSpeed: presenterConfig.scrollSpeed
                });
              }
              
              // Acumula o delta no acumulador
              accumulatedScroll.current += delta;
              
              // Calcula novo scrollTop baseado no acumulador
              const newScrollTop = Math.min(totalHeight, accumulatedScroll.current);
              
              // Tenta atualizar o scroll usando múltiplas estratégias
              // Estratégia 1: scrollBy incremental (mais confiável)
              if (delta > 0) {
                container.scrollBy({ top: delta, behavior: 'auto' });
              }
              
              // Estratégia 2: scrollTo para posição absoluta (fallback)
              const actualAfterScrollBy = container.scrollTop;
              if (Math.abs(actualAfterScrollBy - newScrollTop) > 1) {
                container.scrollTo({ top: newScrollTop, behavior: 'auto' });
              }
              
              // Estratégia 3: scrollTop direto (último recurso)
              const actualAfterScrollTo = container.scrollTop;
              if (Math.abs(actualAfterScrollTo - newScrollTop) > 1) {
                container.scrollTop = newScrollTop;
              }
              
              // Sincroniza o acumulador com o scrollTop real
              const finalScrollTop = container.scrollTop;
              if (Math.abs(finalScrollTop - accumulatedScroll.current) > 1) {
                // Se o scrollTop real está diferente do acumulador, sincroniza
                accumulatedScroll.current = finalScrollTop;
              }
              
              // Calcula progresso baseado no scrollTop real (mais preciso)
              const progress = totalHeight > 0 ? (finalScrollTop / totalHeight) * 100 : 0;
              const clampedProgress = Math.min(Math.max(progress, 0), 100);
              setScrollProgress(clampedProgress);
              
              // Log apenas a cada 5% para não poluir o console
              const progressInt = Math.floor(clampedProgress);
              if (progressInt % 5 === 0 && progressInt > 0 && progressInt < 100) {
                const prevProgress = Math.floor((currentScrollTop / totalHeight) * 100);
                if (progressInt !== prevProgress) {
                  console.log('📊 Auto-scroll: Progresso', { 
                    scrollTop: finalScrollTop.toFixed(2), 
                    totalHeight, 
                    progress: clampedProgress.toFixed(1) + '%',
                    delta: delta.toFixed(2),
                    pixelsPerSecond: pixelsPerSecond.toFixed(2)
                  });
                }
              }
            } else {
              // Já chegou ao final
              setScrollProgress(100);
              if (container.scrollTop < totalHeight) {
                container.scrollTop = totalHeight;
                accumulatedScroll.current = totalHeight;
              }
              
              // Se loop está ativado, volta ao início
              if (presenterConfig.scrollLoop) {
                console.log('🔄 Auto-scroll: Loop ativado, voltando ao início');
                container.scrollTop = 0;
                accumulatedScroll.current = 0;
                savedScrollPosition.current = 0;
                lastTsRef.current = ts; // Reseta timestamp para reiniciar cálculo
                setScrollProgress(0);
              } else {
                // Para a animação quando chega no final (sem loop)
                console.log('🏁 Auto-scroll: Concluído (100%) - Parando no final');
                if (rafRef.current) {
                  cancelAnimationFrame(rafRef.current);
                  rafRef.current = null;
                }
                // Salva a posição final
                savedScrollPosition.current = totalHeight;
              }
            }
          } else {
            // Container ainda não tem altura suficiente ou não há conteúdo para scrollar
            console.log('⚠️ Auto-scroll: Sem altura para scrollar', { 
              scrollHeight: container.scrollHeight, 
              clientHeight: container.clientHeight,
              totalHeight 
            });
            setScrollProgress(0);
          }
        } else {
          // Primeira execução: inicializa timestamp
          console.log('🚀 Auto-scroll: Primeira execução');
          lastTsRef.current = ts;
          container.scrollTop = 0;
          setScrollProgress(0);
        }
      } else {
        // Está em pausa manual, mas continua o loop
        // Não atualiza lastTsRef para manter o dt correto quando voltar
      }
      
      lastTsRef.current = ts;
      rafRef.current = requestAnimationFrame(step);
    };

            const start = () => {
              console.log('▶️ Auto-scroll: Iniciando animação');
              if (rafRef.current) cancelAnimationFrame(rafRef.current);
              
              // Aguarda um pouco para garantir que o container foi renderizado e está visível
              // Se o script estava oculto, pode precisar de mais tempo para renderizar
              const waitTime = presenterConfig.showScript ? 100 : 300;
              
              setTimeout(() => {
                // Verifica novamente se o container ainda existe e está visível
                if (!container || !presenterConfig.showScript) {
                  console.log('⚠️ Auto-scroll: Container não disponível ou script oculto após delay');
                  return;
                }
                
                const totalHeight = getTotalHeight();
                console.log('📏 Auto-scroll: Dimensões iniciais', { 
                  scrollHeight: container.scrollHeight, 
                  clientHeight: container.clientHeight, 
                  totalHeight,
                  scrollTop: container.scrollTop,
                  savedPosition: savedScrollPosition.current,
                  hasChildren: container.children.length > 0,
                  firstChildHeight: container.children[0]?.offsetHeight || 0,
                  containerVisible: container.offsetHeight > 0,
                  containerDisplay: window.getComputedStyle(container).display,
                  containerOverflow: window.getComputedStyle(container).overflowY,
                  showScript: presenterConfig.showScript
                });
                
                if (totalHeight > 0) {
                  // Calcula posição inicial baseada na configuração ou posição salva
                  let restorePosition = savedScrollPosition.current;
                  
                  // Se não tem posição salva, usa a posição inicial configurada pelo operador
                  if (restorePosition === 0 && presenterConfig.scrollStartPosition > 0) {
                    restorePosition = (presenterConfig.scrollStartPosition / 100) * totalHeight;
                    console.log('📍 Auto-scroll: Usando posição inicial configurada', {
                      scrollStartPosition: presenterConfig.scrollStartPosition + '%',
                      calculatedPosition: restorePosition.toFixed(2),
                      totalHeight
                    });
                  }
                  
                  container.scrollTop = restorePosition;
                  accumulatedScroll.current = restorePosition;
                  
                  // Calcula progresso baseado na posição restaurada
                  const progress = totalHeight > 0 ? (restorePosition / totalHeight) * 100 : 0;
                  setScrollProgress(Math.min(Math.max(progress, 0), 100));
                  
                  // Se estava no topo ou não tinha posição salva, reseta timestamp para começar do zero
                  // Se tinha posição salva, mantém o timestamp atual para continuar de onde parou
                  if (restorePosition === 0) {
                    lastTsRef.current = 0;
                  }
                  
                  console.log('✅ Auto-scroll: Iniciando scroll com', { 
                    totalHeight, 
                    effectiveDuration, 
                    scrollSpeed: presenterConfig.scrollSpeed,
                    restoredPosition: restorePosition.toFixed(2),
                    progress: progress.toFixed(1) + '%',
                    scrollLoop: presenterConfig.scrollLoop,
                    scrollStartPosition: presenterConfig.scrollStartPosition + '%'
                  });
                  rafRef.current = requestAnimationFrame(step);
                } else {
                  console.warn('⚠️ Auto-scroll: Container sem altura, tentando novamente em 500ms', {
                    scrollHeight: container.scrollHeight,
                    clientHeight: container.clientHeight,
                    hasContent: container.children.length > 0,
                    containerVisible: container.offsetHeight > 0,
                    hasScript: !!(currentScript?.script),
                    showScript: presenterConfig.showScript
                  });
                  // Aguarda mais tempo e tenta novamente (o script pode estar carregando)
                  setTimeout(() => {
                    // Verifica novamente se ainda está visível
                    if (!container || !presenterConfig.showScript) {
                      console.log('⚠️ Auto-scroll: Container não disponível ou script oculto após retry');
                      return;
                    }
                    
                    const retryHeight = getTotalHeight();
                    if (retryHeight > 0) {
                      // Calcula posição inicial baseada na configuração ou posição salva
                      let restorePosition = savedScrollPosition.current;
                      
                      // Se não tem posição salva, usa a posição inicial configurada pelo operador
                      if (restorePosition === 0 && presenterConfig.scrollStartPosition > 0) {
                        restorePosition = (presenterConfig.scrollStartPosition / 100) * retryHeight;
                      }
                      
                      container.scrollTop = restorePosition;
                      accumulatedScroll.current = restorePosition;
                      
                      const progress = retryHeight > 0 ? (restorePosition / retryHeight) * 100 : 0;
                      setScrollProgress(Math.min(Math.max(progress, 0), 100));
                      
                      if (restorePosition === 0) {
                        lastTsRef.current = 0;
                      }
                      
                      console.log('✅ Auto-scroll: Iniciando scroll após retry com', { 
                        retryHeight, 
                        restoredPosition: restorePosition.toFixed(2),
                        scrollLoop: presenterConfig.scrollLoop,
                        scrollStartPosition: presenterConfig.scrollStartPosition + '%'
                      });
                      rafRef.current = requestAnimationFrame(step);
                    } else {
                      console.error('❌ Auto-scroll: Container ainda sem altura após retry', {
                        scrollHeight: container.scrollHeight,
                        clientHeight: container.clientHeight,
                        hasContent: container.children.length > 0,
                        containerVisible: container.offsetHeight > 0,
                        hasScript: !!(currentScript?.script),
                        showScript: presenterConfig.showScript,
                        currentItem: currentItem?.title
                      });
                    }
                  }, 500);
                }
              }, waitTime);
            };
    
    const startTimeout = setTimeout(start, 100);

    const onWheel = () => {
      manualScrollUntil.current = Date.now() + 1200;
      // Atualiza posição salva quando usuário faz scroll manual
      if (container) {
        savedScrollPosition.current = container.scrollTop;
        accumulatedScroll.current = container.scrollTop;
      }
      console.log('🖱️ Auto-scroll: Scroll manual detectado, pausando por 1.2s e salvando posição');
    };
    const onTouch = () => {
      manualScrollUntil.current = Date.now() + 1200;
      // Atualiza posição salva quando usuário faz scroll manual
      if (container) {
        savedScrollPosition.current = container.scrollTop;
        accumulatedScroll.current = container.scrollTop;
      }
      console.log('👆 Auto-scroll: Touch manual detectado, pausando por 1.2s e salvando posição');
    };
    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('touchmove', onTouch, { passive: true });

    // Adiciona listener para redimensionamento e transições (zoom/mudança de layout)
    const handleResize = () => {
      console.log('📐 Auto-scroll: Redimensionamento detectado');
      if (presenterConfig.autoScroll && isRunning) {
        start(); // Reinicia o RAF
      }
    };
    window.addEventListener('resize', handleResize);
    container.addEventListener('transitionend', handleResize); // Para mudanças de layout/zoom

            return () => {
              console.log('🔌 Auto-scroll: Limpando listeners');
              if (rafRef.current) cancelAnimationFrame(rafRef.current);
              clearTimeout(startTimeout);
              container.removeEventListener('wheel', onWheel);
              container.removeEventListener('touchmove', onTouch);
              container.removeEventListener('transitionend', handleResize);
              window.removeEventListener('resize', handleResize);
              lastTsRef.current = 0;
            };
          }, [presenterConfig.autoScroll, presenterConfig.scrollSpeed, presenterConfig.scrollLoop, presenterConfig.scrollStartPosition, presenterConfig.showScript, currentItem, isRunning, currentScript]);

  // Reset scroll ao mudar de item (único momento que realmente reseta)
  useEffect(() => {
    if (scriptContainerRef.current) {
      console.log('🔄 Auto-scroll: Resetando ao mudar de item');
      scriptContainerRef.current.scrollTop = 0;
      accumulatedScroll.current = 0; // Reseta acumulador
      savedScrollPosition.current = 0; // Reseta posição salva
      setScrollProgress(0);
      lastTsRef.current = 0; // Reseta timestamp para reiniciar cálculo
    }
  }, [currentItem]);

  // Pausa breve ao entrar/sair de fullscreen
  useEffect(() => {
    const onFsChange = () => {
      manualScrollUntil.current = Date.now() + 600;
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);


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
        </div>
        <LiveClock />
      </header>


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
                        className="px-4 sm:px-6 pb-4 sm:pb-6 max-h-[60vh] min-h-[200px] overflow-y-auto"
                        style={{
                          WebkitOverflowScrolling: 'touch',
                          overscrollBehavior: 'contain',
                          scrollBehavior: 'auto', // Desabilita smooth scroll para permitir controle programático
                          touchAction: 'pan-y',
                          // Força o scroll a funcionar
                          overflowY: 'scroll',
                          willChange: 'scroll-position'
                        }}
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
