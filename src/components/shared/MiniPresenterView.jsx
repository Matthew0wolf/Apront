import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Radio } from 'lucide-react';
import { useRundown } from '@/contexts/RundownContext.jsx';
import { useTimer } from '@/contexts/TimerContext.jsx';
import { cn } from '@/lib/utils';

const formatTimeShort = (seconds) => {
  // Verifica se seconds é um número válido
  if (isNaN(seconds) || !isFinite(seconds)) {
    console.warn('formatTimeShort: seconds inválido:', seconds);
    return '00:00';
  }
  
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const MiniProgressBar = ({ progress, remainingTime }) => {
  let colorClass = 'bg-green-500';
  if (remainingTime <= 30) colorClass = 'bg-yellow-500';
  if (remainingTime <= 10) colorClass = 'bg-red-500';

  return (
    <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
      <motion.div
        className={cn("h-2.5 rounded-full", colorClass)}
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.2, ease: 'linear' }}
      />
    </div>
  );
};

const MiniPresenterView = ({ onClose }) => {
  const { activeRundown: rundown, currentItemIndex, isRunning, calculateElapsedTimeForIndex } = useRundown();
  const { timeElapsed } = useTimer();

  const currentItem = useMemo(() => rundown?.items[currentItemIndex.folderIndex]?.children[currentItemIndex.itemIndex], [rundown, currentItemIndex]);

  const itemStartTime = useMemo(() => {
    if (!rundown || !currentItem) return 0;
    return calculateElapsedTimeForIndex(currentItemIndex.folderIndex, currentItemIndex.itemIndex, rundown.items);
  }, [rundown, currentItem, currentItemIndex, calculateElapsedTimeForIndex]);

  const itemElapsedTime = useMemo(() => {
    if (!isRunning) return 0;
    return timeElapsed - itemStartTime;
  }, [timeElapsed, itemStartTime, isRunning]);

  const remainingTime = useMemo(() => {
    if (!currentItem) return 0;
    
    // Converte duration para número se for string
    const duration = typeof currentItem.duration === 'string' 
      ? parseInt(currentItem.duration) || 0 
      : currentItem.duration || 0;
    
    // Verifica se itemElapsedTime é válido
    const elapsed = isNaN(itemElapsedTime) ? 0 : itemElapsedTime;
    
    const time = duration - elapsed;
    const result = Math.max(0, time);
    
    // Debug log para identificar problemas
    if (isNaN(result)) {
      console.warn('MiniPresenterView: remainingTime NaN', {
        currentItem: currentItem.title,
        duration: currentItem.duration,
        durationType: typeof currentItem.duration,
        itemElapsedTime,
        elapsed,
        time
      });
    }
    
    return result;
  }, [itemElapsedTime, currentItem]);

  const progress = useMemo(() => {
    if (!currentItem) return 0;
    
    // Converte duration para número se for string
    const duration = typeof currentItem.duration === 'string' 
      ? parseInt(currentItem.duration) || 0 
      : currentItem.duration || 0;
    
    if (duration <= 0) return 0;
    
    // Verifica se itemElapsedTime é válido
    const elapsed = isNaN(itemElapsedTime) ? 0 : itemElapsedTime;
    
    const prog = (elapsed / duration) * 100;
    return Math.min(100, Math.max(0, prog));
  }, [itemElapsedTime, currentItem]);

  if (!currentItem) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-6 right-6 w-80 bg-black/50 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl z-50 p-4 cursor-grab active:cursor-grabbing"
      style={{
        '--item-color': currentItem.color || '#8B5CF6',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          <h3 className="font-bold text-sm text-white">Apresentador</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white truncate" title={currentItem.title}>
          {currentItem.title}
        </h4>
        <div className="flex items-center justify-between text-sm font-mono">
          <span className="text-gray-300">Restante</span>
          <span className="font-bold text-white">{formatTimeShort(remainingTime)}</span>
        </div>
        <MiniProgressBar progress={progress} remainingTime={remainingTime} />
      </div>
      <div 
        className="absolute top-0 left-0 h-1 w-full rounded-t-2xl"
        style={{ background: 'var(--item-color)' }}
      />
    </motion.div>
  );
};

export default MiniPresenterView;