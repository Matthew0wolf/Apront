import React, { useMemo, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LiveClock from '@/components/LiveClock';
import * as Icons from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

  const { toast } = useToast();
  const triggeredAlerts = useRef(new Set());
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!rundown || rundown.id !== projectId) {
      const rundownData = loadRundownState(projectId);
      if (!rundownData) {
        toast({ variant: "destructive", title: "Erro", description: "Rundown não encontrado." });
        navigate('/projects');
      }
    }
  }, [projectId, rundown, loadRundownState, navigate, toast]);

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
      triggerFlash();
      triggeredAlerts.current.add('1min');
    }

    if (remainingSeconds === 30 && !triggeredAlerts.current.has('30s')) {
      if (nextItem) showToast('⏳ 30 Segundos Restantes', `Próximo evento: ${nextItem.title}`);
      triggerFlash();
      triggeredAlerts.current.add('30s');
    }

    if (remainingSeconds <= 10 && remainingSeconds > 0 && !triggeredAlerts.current.has(`countdown-${remainingSeconds}`)) {
      if (nextItem) showToast(`⏳ ${remainingSeconds} segundos...`, `Preparar para: ${nextItem.title}`);
      triggerFlash();
      triggeredAlerts.current.add(`countdown-${remainingSeconds}`);
    }
  }, [remainingTime, currentItem, isRunning, flatItems, globalCurrentIndex, toast]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <div className="min-h-screen bg-black text-gray-100 p-6 flex flex-col font-sans overflow-hidden relative">
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

      <header className="relative z-10 flex items-center justify-between mb-6 flex-shrink-0">
        <Button 
          onClick={() => navigate('/projects')}
          variant="ghost"
          className="hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Sair
        </Button>
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-4 h-4 rounded-full"
            animate={{
              backgroundColor: isRunning ? ['#ff0000', '#ff4d4d', '#ff0000'] : '#4a5568',
              boxShadow: isRunning ? '0 0 12px #ff0000' : 'none'
            }}
            transition={isRunning ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
          />
          <h1 className="text-2xl font-bold tracking-widest">
            {isRunning ? 'AO VIVO' : 'STANDBY'}
          </h1>
        </div>
        <LiveClock />
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {!rundown ? (
          <div className="text-center">
            <AlertTriangle className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Aguardando Rundown</h2>
            <p className="text-xl text-gray-400">O operador ainda não iniciou um projeto</p>
          </div>
        ) : (
          <div className="w-full max-w-6xl space-y-8">
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
                  <h2 className="text-7xl font-bold text-white mb-4">{currentItem.title}</h2>
                  <p className="text-2xl text-gray-300 mb-6 max-w-3xl mx-auto">{currentItem.description}</p>
                  
                  {currentItem.reminder && (
                    <div className="mb-6 inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg">
                      <Info className="w-5 h-5" />
                      <span className="font-semibold">{currentItem.reminder}</span>
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

            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Próximos Eventos</h3>
              <div className="space-y-3">
                {flatItems.slice(globalCurrentIndex + 1, globalCurrentIndex + 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg" style={{ borderLeft: `4px solid ${item.color || 'transparent'}` }}>
                    <div className="w-8 h-8 flex items-center justify-center text-gray-400 flex-shrink-0">
                      {getIcon(item, "w-6 h-6")}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{item.title}</h4>
                    </div>
                    <UrgencyIndicator urgency={item.urgency} />
                    <div className="text-sm font-mono text-gray-400">
                      {formatTimeShort(item.duration)}
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