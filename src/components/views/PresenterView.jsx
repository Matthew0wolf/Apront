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
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/useApi';
import { websocketManager } from '@/lib/websocket';

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

const ProgressBar = ({ progress, remainingTime, isLightTheme = false }) => {
  let colorClass = 'bg-green-500';
  if (remainingTime <= 30) colorClass = 'bg-yellow-500';
  if (remainingTime <= 10) colorClass = 'bg-red-500';

  const trackColor = isLightTheme ? 'bg-black/10' : 'bg-white/10';

  return (
    <div className={cn("w-full rounded-full h-4 overflow-hidden", trackColor)}>
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
  
  // Tema global da aplicação
  const { theme } = useTheme();
  const globalThemeIsLight = theme === 'light';
  
  // Calcula o tema baseado na configuração do operador ou tema global
  const { bgColor, isLightTheme, themeColors } = useMemo(() => {
    // Se o operador especificou uma cor de fundo, usa ela
    const operatorBg = presenterConfig?.backgroundColor;
    
    // Detecta se a cor especificada pelo operador é clara ou escura
    let detectedLight = globalThemeIsLight;
    
    if (operatorBg && operatorBg !== '#000000' && operatorBg !== '#FFFFFF') {
      // Se operador especificou uma cor, detecta se é clara
      const bgLower = String(operatorBg).toLowerCase().trim();
      let brightness = 0;
      
      if (bgLower.startsWith('#')) {
        const hex = bgLower.slice(1);
        if (hex.length === 6) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          brightness = (r * 299 + g * 587 + b * 114) / 1000;
        }
      }
      
      detectedLight = brightness > 180;
    } else if (operatorBg === '#FFFFFF' || operatorBg === 'white') {
      detectedLight = true;
    } else if (operatorBg === '#000000' || operatorBg === 'black' || !operatorBg) {
      // Se não especificado ou preto, usa tema global
      detectedLight = globalThemeIsLight;
    }
    
    // Determina a cor de fundo final
    const finalBgColor = operatorBg && operatorBg !== '#000000' && operatorBg !== '#FFFFFF' 
      ? operatorBg 
      : (detectedLight ? '#FFFFFF' : '#000000');
    
    // Cores baseadas no tema detectado
    const colors = {
      bg: finalBgColor,
      text: detectedLight ? '#000000' : '#FFFFFF',
      textSecondary: detectedLight ? '#666666' : '#CCCCCC',
      textTertiary: detectedLight ? '#999999' : '#888888',
      border: detectedLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
      borderStrong: detectedLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
      card: detectedLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)',
      cardHover: detectedLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
      cardStrong: detectedLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)',
    };
    
    return { 
      bgColor: finalBgColor, 
      isLightTheme: detectedLight, 
      themeColors: colors 
    };
  }, [presenterConfig?.backgroundColor, globalThemeIsLight]);

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
      console.log('🔗 PresenterView: Conectando ao rundown via WebSocket:', projectId);
      setActiveRundownId(projectId);
      
      // CRÍTICO: Aguarda um pouco e verifica se está conectado e na sala correta
      const verifyConnection = setTimeout(() => {
        if (websocketManager.isConnected) {
          console.log('✅ PresenterView: WebSocket conectado, verificado entrada no rundown:', projectId);
        } else {
          console.warn('⚠️ PresenterView: WebSocket não está conectado!');
        }
      }, 1000);
      
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
        clearTimeout(verifyConnection);
        clearTimeout(requestTimerState1);
        clearTimeout(requestTimerState2);
        clearTimeout(requestTimerState3);
        console.log('🔗 PresenterView: Desconectando do rundown:', projectId);
        setActiveRundownId(null);
      };
    }
  }, [projectId, setActiveRundownId]);

  // CRÍTICO: Garante que sempre retorna um item válido, mesmo durante reset
  // Se não encontrar o item atual, tenta o primeiro item (0,0) como fallback
  const currentItem = useMemo(() => {
    if (!rundown?.items || !Array.isArray(rundown.items) || rundown.items.length === 0) {
      return null;
    }
    
    // CRÍTICO: Normaliza currentItemIndex para prevenir erros de estrutura aninhada incorreta
    let folderIdx = 0;
    let itemIdx = 0;
    
    if (currentItemIndex && typeof currentItemIndex === 'object') {
      // Verifica se está no formato correto
      if (typeof currentItemIndex.folderIndex === 'number' && 
          typeof currentItemIndex.itemIndex === 'number') {
        folderIdx = Math.max(0, Math.floor(currentItemIndex.folderIndex));
        itemIdx = Math.max(0, Math.floor(currentItemIndex.itemIndex));
      }
      // Verifica se está aninhado incorretamente
      else if (currentItemIndex.folderIndex && 
               typeof currentItemIndex.folderIndex === 'object') {
        const nested = currentItemIndex.folderIndex;
        if (typeof nested.folderIndex === 'number' && typeof nested.itemIndex === 'number') {
          console.warn('⚠️ PresenterView: currentItemIndex estava aninhado incorretamente, normalizando...', currentItemIndex);
          folderIdx = Math.max(0, Math.floor(nested.folderIndex));
          itemIdx = Math.max(0, Math.floor(nested.itemIndex));
        }
      }
    }
    
    // Tenta encontrar o item no índice especificado (usando índices normalizados)
    const folder = rundown.items[folderIdx];
    const item = folder?.children?.[itemIdx];
    
    if (item) {
      return item;
    }
    
    // Se não encontrou o item, tenta o primeiro item como fallback
    // Isso previne tela em branco durante reset ou mudanças de estrutura
    const firstFolder = rundown.items[0];
    const firstItem = firstFolder?.children?.[0];
    
    if (firstItem) {
      console.log('⚠️ PresenterView: Item não encontrado no índice atual, usando primeiro item como fallback', {
        requestedIndex: currentItemIndex,
        normalizedIndex: { folderIndex: folderIdx, itemIndex: itemIdx },
        firstItemTitle: firstItem.title,
        foldersCount: rundown.items.length,
        folderExists: !!rundown.items[folderIdx]
      });
      return firstItem;
    }
    
    // Se não há nenhum item, retorna null
    return null;
  }, [rundown, currentItemIndex]);
  
  const flatItems = useMemo(() => {
    if (!rundown?.items || !Array.isArray(rundown.items)) return [];
    return rundown.items.flatMap(f => f.children || []);
  }, [rundown]);
  
  // CRÍTICO: Normaliza currentItemIndex para cálculos seguros
  const normalizedIndex = useMemo(() => {
    if (!currentItemIndex || typeof currentItemIndex !== 'object') {
      return { folderIndex: 0, itemIndex: 0 };
    }
    
    if (typeof currentItemIndex.folderIndex === 'number' && 
        typeof currentItemIndex.itemIndex === 'number') {
      return {
        folderIndex: Math.max(0, Math.floor(currentItemIndex.folderIndex)),
        itemIndex: Math.max(0, Math.floor(currentItemIndex.itemIndex))
      };
    }
    
    if (currentItemIndex.folderIndex && typeof currentItemIndex.folderIndex === 'object') {
      const nested = currentItemIndex.folderIndex;
      if (typeof nested.folderIndex === 'number' && typeof nested.itemIndex === 'number') {
        return {
          folderIndex: Math.max(0, Math.floor(nested.folderIndex)),
          itemIndex: Math.max(0, Math.floor(nested.itemIndex))
        };
      }
    }
    
    return { folderIndex: 0, itemIndex: 0 };
  }, [currentItemIndex]);
  
  const globalCurrentIndex = useMemo(() => {
    if (!rundown) return -1;
    const folder = rundown.items[normalizedIndex.folderIndex];
    if (!folder || !folder.children) return -1;
    return rundown.items.slice(0, normalizedIndex.folderIndex).reduce((acc, f) => acc + (f.children?.length || 0), 0) + normalizedIndex.itemIndex;
  }, [rundown, normalizedIndex]);

  const itemElapsedTime = useMemo(() => {
    if (!currentItem || !isRunning || !rundown || !rundown.items) return 0;
    
    const folder = rundown.items[normalizedIndex.folderIndex];
    if (!folder || !folder.children) return 0;
    
    const previousFoldersDuration = rundown.items.slice(0, normalizedIndex.folderIndex).reduce((acc, f) => {
      if (!f.children) return acc;
      return acc + f.children.reduce((a, i) => a + (Number(i.duration) || 0), 0);
    }, 0);
    
    const currentFolderPreviousItemsDuration = folder.children.slice(0, normalizedIndex.itemIndex).reduce((a, i) => a + (Number(i.duration) || 0), 0);
    
    return timeElapsed - previousFoldersDuration - currentFolderPreviousItemsDuration;
  }, [timeElapsed, currentItem, normalizedIndex, rundown, isRunning]);

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
      // PRIMEIRO: Tenta carregar do rundown local (sincronização instantânea)
      if (rundown?.items) {
        for (const folder of rundown.items) {
          if (folder.children) {
            const localItem = folder.children.find(item => String(item.id) === String(itemId));
            if (localItem && (localItem.script || localItem.talking_points || localItem.pronunciation_guide || localItem.presenter_notes)) {
              console.log('✅ Script carregado do rundown local (instantâneo):', itemId);
              const localScript = {
                id: localItem.id,
                script: localItem.script || '',
                talking_points: Array.isArray(localItem.talking_points) ? localItem.talking_points : 
                               (typeof localItem.talking_points === 'string' ? JSON.parse(localItem.talking_points || '[]') : []),
                pronunciation_guide: localItem.pronunciation_guide || '',
                presenter_notes: localItem.presenter_notes || ''
              };
              setCurrentScript(localScript);
              // Continua tentando carregar do banco para pegar versão mais atualizada (se existir)
            }
          }
        }
      }
      
      // Verifica se o item tem ID temporário (string) ou real (número)
      const isTemporaryId = isNaN(Number(itemId));
      
      if (isTemporaryId) {
        // Item ainda não foi salvo no backend: já carregou do rundown local acima
        console.log('📝 Item temporário, usando script do rundown local:', itemId);
        return;
      }
      
      // Tenta carregar do banco para pegar versão mais atualizada (se existir)
      const response = await apiCall(`/api/items/${itemId}/script`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Script carregado do banco para item:', itemId, data);
        setCurrentScript(data);
      } else if (response.status === 404) {
        // Item não existe no banco: mantém o script do rundown local (se existir)
        console.log('⚠️ Item não encontrado no banco, usando script do rundown local:', itemId);
        // O script já foi carregado do rundown local acima, então não precisa fazer nada
      } else {
        console.warn('⚠️ Erro ao carregar script do banco:', response.status);
        // Mantém o script do rundown local (se existir)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar script:', error);
      // Mantém o script do rundown local (se existir)
    }
  }, [apiCall, rundown]);

  // Carregar script do item atual quando o item muda
  useEffect(() => {
    if (currentItem?.id) {
      loadScript(currentItem.id);
    } else {
      setCurrentScript(null);
    }
  }, [currentItem?.id, loadScript]);

  // CRÍTICO: Monitora mudanças no rundown para atualizar script em tempo real
  // Isso garante que quando o operador salva um script, o apresentador vê imediatamente
  // IMPORTANTE: Só atualiza se o script do item ATUAL realmente mudou
  // Não atualiza quando outros itens são modificados (reordenação, scripts de outros itens, etc.)
  const previousScriptRef = useRef(null); // Ref para rastrear o script anterior do item atual
  useEffect(() => {
    if (!rundown?.items || !currentItem?.id) return;
    
    // Busca o item atual no rundown
    let updatedItem = null;
    for (const folder of rundown.items) {
      if (folder.children) {
        updatedItem = folder.children.find(item => String(item.id) === String(currentItem.id));
        if (updatedItem) break;
      }
    }
    
    // CRÍTICO: Só processa se encontrou o item atual
    if (!updatedItem) {
      // Item atual não encontrado no rundown - pode ser temporário ou foi removido
      // Não faz nada para evitar resetar o script incorretamente
      return;
    }
    
    // CRÍTICO: Só atualiza se o script do item atual realmente mudou
    // Compara com o script anterior do item atual (não com o script atual do estado)
    const newScriptText = updatedItem.script || '';
    const newTalkingPoints = Array.isArray(updatedItem.talking_points) ? updatedItem.talking_points : 
                            (typeof updatedItem.talking_points === 'string' ? JSON.parse(updatedItem.talking_points || '[]') : []);
    const newPronunciationGuide = updatedItem.pronunciation_guide || '';
    const newPresenterNotes = updatedItem.presenter_notes || '';
    
    // Cria uma representação do script atual do item no rundown
    const currentItemScript = {
      id: updatedItem.id,
      script: newScriptText,
      talking_points: newTalkingPoints,
      pronunciation_guide: newPronunciationGuide,
      presenter_notes: newPresenterNotes
    };
    
    // Compara com o script anterior do item atual
    const previousScript = previousScriptRef.current;
    const scriptChanged = !previousScript || 
                         previousScript.id !== currentItemScript.id ||
                         previousScript.script !== currentItemScript.script ||
                         JSON.stringify(previousScript.talking_points || []) !== JSON.stringify(currentItemScript.talking_points || []) ||
                         previousScript.pronunciation_guide !== currentItemScript.pronunciation_guide ||
                         previousScript.presenter_notes !== currentItemScript.presenter_notes;
    
    // CRÍTICO: Só atualiza se o script do item atual realmente mudou
    if (scriptChanged) {
      const localScript = {
        id: currentItemScript.id,
        script: currentItemScript.script,
        talking_points: currentItemScript.talking_points,
        pronunciation_guide: currentItemScript.pronunciation_guide,
        presenter_notes: currentItemScript.presenter_notes
      };
      setCurrentScript(localScript);
      previousScriptRef.current = { ...currentItemScript }; // Atualiza referência
      console.log('✅ PresenterView: Script atualizado automaticamente do rundown (tempo real)', {
        itemId: currentItem.id,
        scriptLength: currentItemScript.script.length
      });
      // CRÍTICO: NÃO reseta o scroll quando apenas o script é atualizado
      // O scroll só deve ser resetado quando o item muda (feito no useEffect acima)
    }
  }, [rundown?.items, currentItem?.id]);
  
  // CRÍTICO: Reseta a referência do script anterior quando o item muda
  useEffect(() => {
    if (currentItem?.id) {
      // Reseta a referência quando o item muda
      previousScriptRef.current = null;
    }
  }, [currentItem?.id]);

  // Listener para detectar quando o script foi atualizado via sincronização
  useEffect(() => {
    const handleRundownSync = (event) => {
      const { rundownId, changes } = event.detail;
      
      // Verifica se é o rundown atual
      if (!currentItem?.id || !rundown?.id || String(rundown.id) !== String(rundownId)) {
        return;
      }
      
      // Verifica se há mudanças nos items
      if (changes?.items && Array.isArray(changes.items)) {
        console.log('📡 PresenterView: Detectada atualização de items, verificando script do item atual...', {
          currentItemId: currentItem.id,
          changes: changes.items
        });
        
        // Busca o item atualizado na nova estrutura
        let updatedItem = null;
        for (const folder of changes.items) {
          if (folder.children) {
            updatedItem = folder.children.find(item => String(item.id) === String(currentItem.id));
            if (updatedItem) break;
          }
        }
        
        // CRÍTICO: Só atualiza se o item encontrado é realmente o item atual
        // Isso evita atualizar o script quando outros itens são modificados
        if (updatedItem && String(updatedItem.id) === String(currentItem.id)) {
          console.log('✅ PresenterView: Item atual foi atualizado, verificando se script mudou...');
          
          // Compara com o script atual para evitar atualizações desnecessárias
          const currentScriptText = currentScript?.script || '';
          const newScriptText = updatedItem.script || '';
          const currentTalkingPoints = JSON.stringify(currentScript?.talking_points || []);
          const newTalkingPoints = JSON.stringify(
            Array.isArray(updatedItem.talking_points) ? updatedItem.talking_points : 
            (typeof updatedItem.talking_points === 'string' ? JSON.parse(updatedItem.talking_points || '[]') : [])
          );
          
          // Só atualiza se o script realmente mudou
          if (currentScriptText !== newScriptText || 
              currentTalkingPoints !== newTalkingPoints ||
              (currentScript?.pronunciation_guide || '') !== (updatedItem.pronunciation_guide || '') ||
              (currentScript?.presenter_notes || '') !== (updatedItem.presenter_notes || '')) {
            const localScript = {
              id: updatedItem.id,
              script: updatedItem.script || '',
              talking_points: Array.isArray(updatedItem.talking_points) ? updatedItem.talking_points : 
                             (typeof updatedItem.talking_points === 'string' ? JSON.parse(updatedItem.talking_points || '[]') : []),
              pronunciation_guide: updatedItem.pronunciation_guide || '',
              presenter_notes: updatedItem.presenter_notes || ''
            };
            setCurrentScript(localScript);
            console.log('✅ PresenterView: Script atualizado localmente (instantâneo via WebSocket)', {
              itemId: currentItem.id,
              scriptLength: newScriptText.length
            });
            // CRÍTICO: NÃO reseta o scroll quando apenas o script é atualizado
            // O scroll só deve ser resetado quando o item muda
          } else {
            console.log('📝 PresenterView: Script do item atual não mudou, mantendo script atual');
          }
          
          // Não recarrega do banco aqui porque já temos os dados atualizados do WebSocket
          // O recarregamento do banco só é necessário se o script não foi encontrado no WebSocket
        } else {
          console.log('📝 PresenterView: Mudança detectada, mas não é do item atual', {
            currentItemId: currentItem?.id,
            updatedItemId: updatedItem?.id
          });
        }
      }
      
      // CRÍTICO: Não verifica o rundown inteiro aqui porque isso pode causar resets incorretos
      // quando outros itens são modificados. O useEffect acima já monitora mudanças no rundown
      // e só atualiza quando o script do item atual realmente mudou.
    };

    // Listener para evento de atualização de script específico
    const handleScriptUpdated = (event) => {
      const { itemId } = event.detail;
      if (itemId && currentItem?.id && String(itemId) === String(currentItem.id)) {
        console.log('📡 PresenterView: Script atualizado detectado, recarregando imediatamente...', itemId);
        // Recarrega imediatamente, sem delay
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
  // CRÍTICO: Usa currentItem?.id para garantir que só reseta quando o item realmente muda
  // Não reseta quando apenas o script é atualizado (currentScript muda)
  const previousItemIdRef = useRef(null);
  useEffect(() => {
    const currentItemId = currentItem?.id;
    const previousItemId = previousItemIdRef.current;
    
    // Só reseta se o item realmente mudou (não apenas se o script foi atualizado)
    if (currentItemId && currentItemId !== previousItemId && scriptContainerRef.current) {
      console.log('🔄 Auto-scroll: Resetando ao mudar de item', { 
        previousItemId, 
        currentItemId,
        currentItemTitle: currentItem?.title 
      });
      scriptContainerRef.current.scrollTop = 0;
      accumulatedScroll.current = 0; // Reseta acumulador
      savedScrollPosition.current = 0; // Reseta posição salva
      setScrollProgress(0);
      lastTsRef.current = 0; // Reseta timestamp para reiniciar cálculo
      previousItemIdRef.current = currentItemId; // Atualiza referência
    } else if (currentItemId && currentItemId === previousItemId) {
      // Item não mudou, apenas o script pode ter sido atualizado
      // NÃO reseta o scroll - mantém a posição atual
      console.log('📝 Auto-scroll: Item não mudou, mantendo posição do scroll', { 
        currentItemId,
        scrollTop: scriptContainerRef.current?.scrollTop,
        scrollProgress 
      });
    }
  }, [currentItem?.id, currentItem?.title]);

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
      className="min-h-screen p-3 sm:p-6 flex flex-col font-sans relative transition-colors duration-300"
      style={{ 
        backgroundColor: bgColor,
        color: themeColors.text
      }}
    >
      {/* Overlay com gradiente baseado no tema */}
      {isMounted && (
        <div 
          className="absolute inset-0 z-0 opacity-20" 
          style={{ 
            backgroundImage: isLightTheme 
              ? 'radial-gradient(circle at center, rgba(0,0,0,0.1) 0, rgba(0,0,0,0.05) 70%)' 
              : 'radial-gradient(circle at center, #1a202c 0, #000 70%)' 
          }} 
        />
      )}
      {/* Padrão de fundo baseado no tema */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' 
        }} 
      />
      
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

      <header 
        className="relative z-10 flex items-center justify-between mb-3 sm:mb-6 flex-shrink-0"
        style={{ borderBottomColor: themeColors.border }}
      >
        <Button 
          onClick={() => navigate('/projects')}
          variant="ghost"
          className="transition-colors"
          style={{ 
            color: themeColors.text,
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.cardHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Sair
        </Button>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <motion.div 
            className="w-4 h-4 rounded-full"
            animate={{
              backgroundColor: isRunning ? ['#ff0000', '#ff4d4d', '#ff0000'] : (isLightTheme ? '#9CA3AF' : '#4a5568'),
              boxShadow: isRunning ? '0 0 12px rgba(255, 0, 0, 0.8)' : '0 0 0px rgba(0, 0, 0, 0)'
            }}
            transition={isRunning ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
          />
          <h1 
            className="text-lg sm:text-2xl font-bold tracking-widest"
            style={{ color: themeColors.text }}
          >
            {isRunning ? 'AO VIVO' : 'STANDBY'}
          </h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-500">
                <Wifi className="w-4 h-4" />
                <span className="text-sm" style={{ color: themeColors.textSecondary }}>Sincronizado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm" style={{ color: themeColors.textSecondary }}>Desconectado</span>
              </div>
            )}
          </div>
        </div>
        <LiveClock style={{ color: themeColors.textSecondary }} />
      </header>


      <main className="relative z-10 flex-1 flex flex-col items-center justify-center overflow-y-auto">
        {!rundown ? (
          <div className="text-center">
            <AlertTriangle 
              className="w-24 h-24 mx-auto mb-6" 
              style={{ color: '#FBBF24' }}
            />
            <h2 
              className="text-4xl font-bold mb-4"
              style={{ color: themeColors.text }}
            >
              Aguardando Rundown
            </h2>
            <p 
              className="text-xl"
              style={{ color: themeColors.textSecondary }}
            >
              O operador ainda não iniciou um projeto
            </p>
          </div>
        ) : (
          <div className="w-full max-w-6xl space-y-8 py-4">
            <AnimatePresence mode="wait">
              {currentItem ? (
                <motion.div
                  key={currentItem.id || `item-${currentItemIndex.folderIndex}-${currentItemIndex.itemIndex}`}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="backdrop-blur-md rounded-3xl p-8 text-center relative overflow-hidden"
                  style={{
                    '--item-color': currentItem.color || '#8B5CF6',
                    backgroundColor: themeColors.cardStrong,
                    borderColor: themeColors.border,
                    borderWidth: '1px',
                    borderStyle: 'solid',
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
                  <h2 
                    className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4"
                    style={{ color: themeColors.text }}
                  >
                    {currentItem.title}
                  </h2>
                  {currentItem.description && (
                    <p 
                      className="text-lg sm:text-xl lg:text-2xl mb-6 max-w-3xl mx-auto"
                      style={{ color: themeColors.textSecondary }}
                    >
                      {currentItem.description}
                    </p>
                  )}
                  
                  {currentItem.reminder && (
                    <div className="mb-6 inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg">
                      <Info className="w-5 h-5" />
                      <span className="font-semibold">{currentItem.reminder}</span>
                    </div>
                  )}

                  {/* Script do Apresentador */}
                  {presenterConfig.showScript && currentScript && currentScript.script && (
                    <div 
                      className="mb-6 rounded-xl"
                      style={{
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.border,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                      }}
                    >
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
                          <div 
                            className="w-full rounded-full h-2 overflow-hidden mb-4"
                            style={{ backgroundColor: isLightTheme ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }}
                          >
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
                          <div 
                            className="mt-6 pt-4"
                            style={{ 
                              borderTopColor: themeColors.border, 
                              borderTopWidth: '1px', 
                              borderTopStyle: 'solid' 
                            }}
                          >
                            <h4 
                              className="text-sm font-bold mb-2 flex items-center gap-2"
                              style={{ color: '#FBBF24' }}
                            >
                              <Icons.StickyNote className="w-4 h-4" />
                              Notas Privadas
                            </h4>
                            <div 
                              className="text-sm whitespace-pre-wrap leading-relaxed"
                              style={{ color: themeColors.textSecondary }}
                            >
                              {currentScript.presenter_notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-lg font-mono">
                      <span style={{ color: themeColors.textSecondary }}>Progresso</span>
                      <span className="font-bold" style={{ color: themeColors.text }}>
                        {formatTimeShort(remainingTime)}
                      </span>
                    </div>
                    <ProgressBar progress={progress} remainingTime={remainingTime} isLightTheme={isLightTheme} />
                  </div>
                </motion.div>
              ) : (
                /* Tela mostrada quando não há item atual ou quando está parado aguardando operador */
                <motion.div
                  key="waiting-operator"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="backdrop-blur-md rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
                  style={{
                    backgroundColor: themeColors.cardStrong,
                    borderColor: themeColors.border,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColors.card }}>
                      <Info className="w-12 h-12" style={{ color: themeColors.textSecondary }} />
                    </div>
                    <div>
                      <h2 
                        className="text-3xl sm:text-4xl font-bold mb-2"
                        style={{ color: themeColors.text }}
                      >
                        Aguardando Operador
                      </h2>
                      <p 
                        className="text-lg sm:text-xl"
                        style={{ color: themeColors.textSecondary }}
                      >
                        O operador ainda não iniciou a transmissão
                      </p>
                    </div>
                    {!isRunning && (
                      <div 
                        className="px-4 py-2 rounded-lg"
                        style={{ 
                          backgroundColor: themeColors.card,
                          color: themeColors.textSecondary 
                        }}
                      >
                        <span className="text-sm font-medium">Pronto para iniciar</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div 
              className="backdrop-blur-sm rounded-xl p-4 sm:p-6"
              style={{
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <h3 
                className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4"
                style={{ color: themeColors.text }}
              >
                Próximos Eventos
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {flatItems.slice(globalCurrentIndex + 1, globalCurrentIndex + 4).map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg transition-colors"
                    style={{ 
                      borderLeft: `4px solid ${item.color || 'transparent'}`,
                      backgroundColor: themeColors.cardHover,
                    }}
                  >
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0"
                      style={{ color: themeColors.textSecondary }}
                    >
                      {getIcon(item, "w-4 h-4 sm:w-6 sm:h-6")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="font-medium text-sm sm:text-base truncate"
                        style={{ color: themeColors.text }}
                      >
                        {item.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <UrgencyIndicator urgency={item.urgency} />
                      <div 
                        className="text-xs sm:text-sm font-mono"
                        style={{ color: themeColors.textSecondary }}
                      >
                        {formatTimeShort(item.duration)}
                      </div>
                    </div>
                  </div>
                ))}
                {flatItems.length <= globalCurrentIndex + 1 && (
                  <div 
                    className="text-center p-4"
                    style={{ color: themeColors.textTertiary }}
                  >
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
