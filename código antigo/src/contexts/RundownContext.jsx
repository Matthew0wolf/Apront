import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTimer } from '@/contexts/TimerContext.jsx';

const RundownContext = createContext();

export const useRundown = () => useContext(RundownContext);

const initialRundowns = [
  {
    id: 'proj-123',
    name: 'Modelo de Jogo de Futebol',
    type: 'Esportes',
    created: '2025-09-22',
    lastModified: '2025-09-22',
    status: 'Modelo',
    duration: '3h 30min',
    teamMembers: 1,
    items: [
        {
            id: 'folder-1',
            title: 'Pré-Jogo',
            type: 'folder',
            children: [
                { id: 'item-1-1', title: 'Abertura e Apresentação', duration: 300, description: 'Início da transmissão.', type: 'generic', status: 'pending', iconType: 'lucide', iconData: 'Play', color: '#3b82f6', urgency: 'normal', reminder: '' },
                { id: 'item-1-2', title: 'Análise Pré-Jogo', duration: 900, description: 'Comentários sobre a partida.', type: 'generic', status: 'pending', iconType: 'lucide', iconData: 'ClipboardList', color: '#3b82f6', urgency: 'normal', reminder: '' },
                { id: 'item-1-3', title: 'Escalações', duration: 600, description: 'Apresentação dos times.', type: 'generic', status: 'pending', iconType: 'lucide', iconData: 'Users', color: '#3b82f6', urgency: 'normal', reminder: '' },
            ]
        },
        {
            id: 'folder-2',
            title: 'Partida',
            type: 'folder',
            children: [
                { id: 'item-2-1', title: 'Transmissão 1º Tempo', duration: 2700, description: 'Narração do primeiro tempo.', type: 'generic', status: 'pending', iconType: 'lucide', iconData: 'Radio', color: '#ef4444', urgency: 'urgent', reminder: '' },
                { id: 'item-2-2', title: 'Intervalo', duration: 900, description: 'Análise e comentários.', type: 'generic', status: 'pending', iconType: 'lucide', iconData: 'Coffee', color: '#f97316', urgency: 'attention', reminder: '' },
                { id: 'item-2-3', title: 'Transmissão 2º Tempo', duration: 2700, description: 'Narração do segundo tempo.', type: 'generic', status: 'pending', iconType: 'lucide', iconData: 'Radio', color: '#ef4444', urgency: 'urgent', reminder: '' },
            ]
        },
        {
            id: 'folder-3',
            title: 'Pós-Jogo',
            type: 'folder',
            children: [
                { id: 'item-3-1', title: 'Análise Pós-Jogo', duration: 1200, description: 'Melhores momentos e comentários.', type: 'generic', status: 'pending', iconType: 'lucide', iconData: 'ClipboardCheck', color: '#10b981', urgency: 'normal', reminder: '' },
            ]
        }
    ]
  }
];

export const RundownProvider = ({ children }) => {
  const [rundowns, setRundowns] = useState(() => {
    try {
      const savedRundowns = localStorage.getItem('rundownProjects');
      if (savedRundowns) {
        const parsedRundowns = JSON.parse(savedRundowns);
        return parsedRundowns.length > 0 ? parsedRundowns : initialRundowns;
      }
    } catch (error) {
      console.error("Failed to parse rundowns from localStorage", error);
    }
    return initialRundowns;
  });

  const [activeRundown, setActiveRundown] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState({ folderIndex: 0, itemIndex: 0 });
  const { timeElapsed, setTimeElapsed, isTimerRunning, setIsTimerRunning } = useTimer();
  const { toast } = useToast();
  
  const rundownRef = useRef(activeRundown);
  const indexRef = useRef(currentItemIndex);

  useEffect(() => {
    rundownRef.current = activeRundown;
  }, [activeRundown]);

  useEffect(() => {
    indexRef.current = currentItemIndex;
  }, [currentItemIndex]);

  useEffect(() => {
    try {
      localStorage.setItem('rundownProjects', JSON.stringify(rundowns));
    } catch (error) {
      console.error("Failed to save rundowns to localStorage", error);
    }
  }, [rundowns]);

  useEffect(() => {
    if (activeRundown) {
      try {
        localStorage.setItem(`rundownState_${activeRundown.id}`, JSON.stringify(activeRundown));
        localStorage.setItem(`currentItemIndex_${activeRundown.id}`, JSON.stringify(currentItemIndex));
        localStorage.setItem(`isRunning_${activeRundown.id}`, JSON.stringify(isTimerRunning));
        localStorage.setItem(`timeElapsed_${activeRundown.id}`, JSON.stringify(timeElapsed));
      } catch (error) {
        console.error("Failed to save rundown state to localStorage", error);
      }
    }
  }, [activeRundown, currentItemIndex, isTimerRunning, timeElapsed]);

  const calculateElapsedTimeForIndex = useCallback((targetFolderIndex, targetItemIndex, items) => {
    let elapsed = 0;
    if (!items) return 0;
    for (let f = 0; f < items.length; f++) {
      for (let i = 0; i < items[f].children.length; i++) {
        if (f < targetFolderIndex || (f === targetFolderIndex && i < targetItemIndex)) {
          elapsed += items[f].children[i].duration;
        } else {
          return elapsed;
        }
      }
    }
    return elapsed;
  }, []);

  const handleSetCurrentItem = useCallback((folderIndex, itemIndex) => {
    const rundown = rundownRef.current;
    if (!rundown) return;
    const newElapsedTime = calculateElapsedTimeForIndex(folderIndex, itemIndex, rundown.items);
    setTimeElapsed(newElapsedTime);
    setCurrentItemIndex({ folderIndex, itemIndex });
  }, [calculateElapsedTimeForIndex, setTimeElapsed]);

  const handleNextItem = useCallback(() => {
    const rundown = rundownRef.current;
    const { folderIndex, itemIndex } = indexRef.current;
    if (!rundown) return;
    
    const currentFolder = rundown.items[folderIndex];
    if (!currentFolder) return;

    let nextFolderIndex = folderIndex;
    let nextItemIndex = itemIndex + 1;

    if (nextItemIndex >= currentFolder.children.length) {
      nextFolderIndex++;
      nextItemIndex = 0;
    }

    if (nextFolderIndex < rundown.items.length && rundown.items[nextFolderIndex]?.children.length > 0) {
      handleSetCurrentItem(nextFolderIndex, nextItemIndex);
    } else {
      toast({ title: "🏁 Fim do Rundown" });
      setIsTimerRunning(false);
    }
  }, [handleSetCurrentItem, toast, setIsTimerRunning]);

  useEffect(() => {
    const checkTime = () => {
      if (!isTimerRunning) return;
      
      const rundown = rundownRef.current;
      const { folderIndex, itemIndex } = indexRef.current;
      
      if (!rundown) return;
      
      const currentItem = rundown.items[folderIndex]?.children[itemIndex];
      if (!currentItem) return;

      const itemStartTime = calculateElapsedTimeForIndex(folderIndex, itemIndex, rundown.items);
      const itemEndTime = itemStartTime + currentItem.duration;

      if (timeElapsed >= itemEndTime) {
        handleNextItem();
      }
    };
    
    checkTime();
  }, [timeElapsed, isTimerRunning, calculateElapsedTimeForIndex, handleNextItem]);

  const loadRundownState = useCallback((rundownId) => {
    const rundownData = rundowns.find(p => p.id === rundownId);
    if (!rundownData) {
      return null;
    }

    try {
      const savedRundown = localStorage.getItem(`rundownState_${rundownId}`);
      const savedIndex = localStorage.getItem(`currentItemIndex_${rundownId}`);
      const savedIsRunning = localStorage.getItem(`isRunning_${rundownId}`);
      const savedTime = localStorage.getItem(`timeElapsed_${rundownId}`);

      setActiveRundown(savedRundown ? JSON.parse(savedRundown) : rundownData);
      setCurrentItemIndex(savedIndex ? JSON.parse(savedIndex) : { folderIndex: 0, itemIndex: 0 });
      const running = savedIsRunning ? JSON.parse(savedIsRunning) : false;
      setIsTimerRunning(running);
      setTimeElapsed(savedTime ? JSON.parse(savedTime) : 0);
    } catch (error) {
      console.error("Failed to load rundown state from localStorage", error);
      setActiveRundown(rundownData);
      setCurrentItemIndex({ folderIndex: 0, itemIndex: 0 });
      setIsTimerRunning(false);
      setTimeElapsed(0);
    }
    return rundownData;
  }, [rundowns, setTimeElapsed, setIsTimerRunning]);

  const handleCreateRundown = (newRundownData) => {
    const newRundown = {
      id: `proj-${Date.now()}`,
      ...newRundownData,
      created: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      status: 'Novo',
      duration: '0h 00min',
      teamMembers: 1,
      items: [],
    };
    setRundowns(prevRundowns => [...prevRundowns, newRundown]);
    toast({
      title: "🎉 Rundown Criado!",
      description: `O rundown "${newRundown.name}" foi adicionado com sucesso.`,
    });
  };

  const handleUpdateRundown = (rundownId, updatedData) => {
    setRundowns(prevRundowns =>
      prevRundowns.map(r =>
        r.id === rundownId
          ? { ...r, ...updatedData, lastModified: new Date().toISOString().split('T')[0] }
          : r
      )
    );
    toast({
      title: "💾 Rundown Atualizado!",
      description: `O rundown "${updatedData.name}" foi salvo.`,
    });
  };

  const handleDeleteRundown = (rundownId) => {
    const rundownToDelete = rundowns.find(r => r.id === rundownId);
    if (!rundownToDelete) return;

    setRundowns(prevRundowns => prevRundowns.filter(r => r.id !== rundownId));
    
    localStorage.removeItem(`rundownState_${rundownId}`);
    localStorage.removeItem(`currentItemIndex_${rundownId}`);
    localStorage.removeItem(`isRunning_${rundownId}`);
    localStorage.removeItem(`timeElapsed_${rundownId}`);

    if (activeRundown?.id === rundownId) {
      setActiveRundown(null);
      setIsTimerRunning(false);
      setTimeElapsed(0);
    }

    toast({
      variant: "destructive",
      title: "🗑️ Rundown Deletado!",
      description: `O rundown "${rundownToDelete.name}" foi removido.`,
    });
  };

  const handleDownloadTemplate = (template) => {
    const newRundown = {
      id: `proj-${Date.now()}`,
      name: template.name,
      type: template.category,
      created: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      status: 'Novo',
      duration: template.duration,
      teamMembers: 1,
      items: template.structure || [],
    };
    setRundowns(prevRundowns => [...prevRundowns, newRundown]);
    toast({
      title: "✅ Template Baixado",
      description: `${template.name} foi adicionado aos seus rundowns!`,
    });
  };

  const value = {
    rundowns,
    setRundowns,
    activeRundown,
    setActiveRundown,
    currentItemIndex,
    setCurrentItemIndex: handleSetCurrentItem,
    isRunning: isTimerRunning,
    setIsRunning: setIsTimerRunning,
    handleNextItem,
    loadRundownState,
    handleCreateRundown,
    handleUpdateRundown,
    handleDeleteRundown,
    handleDownloadTemplate,
    calculateElapsedTimeForIndex,
  };

  return (
    <RundownContext.Provider value={value}>
      {children}
    </RundownContext.Provider>
  );
};