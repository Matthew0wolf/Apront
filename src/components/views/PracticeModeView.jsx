import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Square, Clock, CheckCircle, AlertTriangle, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import FormattedScript from '@/components/shared/FormattedScript';
import * as Icons from 'lucide-react';
import { useApi } from '@/hooks/useApi';

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getIcon = (item) => {
  if (item.iconType === 'image' && item.iconData) {
    return <img src={item.iconData} alt={item.title} className="w-16 h-16 object-contain" />;
  }
  const Icon = Icons[item.iconData || item.icon];
  return Icon ? <Icon className="w-16 h-16" /> : <Icons.HelpCircle className="w-16 h-16" />;
};

const PracticeModeView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { apiCall } = useApi();
  
  const [rundown, setRundown] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState({ folderIndex: 0, itemIndex: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [itemStartTime, setItemStartTime] = useState(0);
  const [itemTimes, setItemTimes] = useState([]); // Array com tempos de cada item
  const [currentScript, setCurrentScript] = useState(null);
  
  const timerRef = useRef(null);

  // Carregar rundown
  useEffect(() => {
    const loadRundown = async () => {
      try {
        const response = await apiCall('/api/rundowns');
        
        if (response.ok) {
          const data = await response.json();
          const found = data.rundowns.find(r => r.id === projectId);
          if (found) {
            setRundown(found);
            // Inicializar array de tempos
            const times = [];
            found.items.forEach(folder => {
              folder.children.forEach(item => {
                times.push({
                  itemId: item.id,
                  itemTitle: item.title,
                  plannedDuration: item.duration,
                  actualDuration: null,
                  difference: null
                });
              });
            });
            setItemTimes(times);
          } else {
            toast({
              variant: "destructive",
              title: "Erro",
              description: "Rundown não encontrado"
            });
            navigate('/projects');
          }
        } else {
          throw new Error('Falha ao carregar rundown');
        }
      } catch (error) {
        console.error('Erro ao carregar rundown:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar o rundown. Verifique sua conexão."
        });
      }
    };

    loadRundown();
  }, [projectId, toast, apiCall, navigate]);

  // Carregar script do item atual
  useEffect(() => {
    const loadScript = async () => {
      const currentItem = getCurrentItem();
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
  }, [currentItemIndex, rundown, apiCall]);

  // Timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const getCurrentItem = () => {
    if (!rundown) return null;
    return rundown.items[currentItemIndex.folderIndex]?.children[currentItemIndex.itemIndex];
  };

  const getFlatIndex = () => {
    if (!rundown) return -1;
    let index = 0;
    for (let i = 0; i < currentItemIndex.folderIndex; i++) {
      index += rundown.items[i].children.length;
    }
    index += currentItemIndex.itemIndex;
    return index;
  };

  const handlePlayPause = () => {
    if (!isRunning) {
      setItemStartTime(timeElapsed);
    }
    setIsRunning(!isRunning);
  };

  const handleNext = () => {
    // Salvar tempo do item atual
    const currentItem = getCurrentItem();
    const itemDuration = timeElapsed - itemStartTime;
    const flatIndex = getFlatIndex();
    
    if (currentItem && flatIndex >= 0) {
      const newItemTimes = [...itemTimes];
      newItemTimes[flatIndex] = {
        ...newItemTimes[flatIndex],
        actualDuration: itemDuration,
        difference: itemDuration - currentItem.duration
      };
      setItemTimes(newItemTimes);
    }

    // Avançar para próximo item
    const { folderIndex, itemIndex } = currentItemIndex;
    const folder = rundown.items[folderIndex];
    
    if (itemIndex < folder.children.length - 1) {
      setCurrentItemIndex({ folderIndex, itemIndex: itemIndex + 1 });
    } else if (folderIndex < rundown.items.length - 1) {
      setCurrentItemIndex({ folderIndex: folderIndex + 1, itemIndex: 0 });
    } else {
      // Fim do ensaio
      handleFinish();
      return;
    }
    
    setItemStartTime(timeElapsed);
  };

  const handleFinish = () => {
    setIsRunning(false);
    
    toast({
      title: "🎭 Ensaio Finalizado!",
      description: "Veja o relatório de performance abaixo",
      duration: 3000
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeElapsed(0);
    setCurrentItemIndex({ folderIndex: 0, itemIndex: 0 });
    setItemStartTime(0);
    
    // Resetar tempos
    const times = [];
    rundown.items.forEach(folder => {
      folder.children.forEach(item => {
        times.push({
          itemId: item.id,
          itemTitle: item.title,
          plannedDuration: item.duration,
          actualDuration: null,
          difference: null
        });
      });
    });
    setItemTimes(times);
  };

  const saveRehearsal = async (itemTime) => {
    try {
      await apiCall('/api/rehearsals', {
        method: 'POST',
        body: JSON.stringify({
          item_id: itemTime.itemId,
          duration: itemTime.actualDuration,
          planned_duration: itemTime.plannedDuration,
          notes: ''
        })
      });
    } catch (error) {
      console.error('Erro ao salvar ensaio:', error);
    }
  };

  const handleSaveAllRehearsals = async () => {
    const completedItems = itemTimes.filter(it => it.actualDuration !== null);
    
    for (const item of completedItems) {
      await saveRehearsal(item);
    }
    
    toast({
      title: "✅ Ensaios Salvos",
      description: `${completedItems.length} ensaios salvos no histórico`,
      duration: 3000
    });
  };

  const currentItem = getCurrentItem();
  const currentItemElapsed = timeElapsed - itemStartTime;
  const currentItemRemaining = currentItem ? Math.max(0, currentItem.duration - currentItemElapsed) : 0;

  if (!rundown) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => navigate('/projects')}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
            <Icons.Theater className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-amber-400">MODO ENSAIO</span>
          </div>

          <div className="text-sm text-muted-foreground">
            {rundown.name}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Controles e Item Atual */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer e Controles */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tempo Total</p>
                <p className="text-5xl font-mono font-bold">{formatTime(timeElapsed)}</p>
              </div>
              
              {currentItem && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Item Atual</p>
                  <p className="text-3xl font-mono font-bold text-primary">
                    {formatTime(currentItemRemaining)}
                  </p>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={handlePlayPause}
                size="lg"
                className={isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {isRunning ? (
                  <><Pause className="w-5 h-5 mr-2" /> Pausar</>
                ) : (
                  <><Play className="w-5 h-5 mr-2" /> Iniciar</>
                )}
              </Button>

              <Button
                onClick={handleNext}
                disabled={!isRunning}
                size="lg"
                variant="outline"
              >
                Próximo →
              </Button>

              <Button
                onClick={handleStop}
                variant="destructive"
                size="lg"
              >
                <Square className="w-5 h-5 mr-2" /> Parar
              </Button>
            </div>
          </div>

          {/* Item Atual */}
          {currentItem && (
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                {getIcon(currentItem)}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{currentItem.title}</h2>
                  <p className="text-muted-foreground">{currentItem.description}</p>
                </div>
              </div>

              {/* Script */}
              {currentScript && currentScript.script && (
                <div className="mt-6 p-4 bg-black/20 rounded-lg max-h-96 overflow-y-auto">
                  <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    SCRIPT
                  </h3>
                  <FormattedScript
                    text={currentScript.script}
                    className="text-left leading-relaxed"
                    style={{
                      fontSize: '18px',
                      lineHeight: 1.6
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Coluna Direita - Relatório de Performance */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Performance
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {itemTimes.map((itemTime, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    itemTime.actualDuration === null
                      ? 'bg-secondary border-border'
                      : itemTime.difference === 0
                      ? 'bg-green-500/10 border-green-500/30'
                      : Math.abs(itemTime.difference) <= 5
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium flex-1">{itemTime.itemTitle}</p>
                    {itemTime.actualDuration !== null && (
                      <div className="flex items-center gap-1">
                        {itemTime.difference === 0 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : Math.abs(itemTime.difference) <= 5 ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Planejado:</span>
                      <span className="font-mono">{formatTime(itemTime.plannedDuration)}</span>
                    </div>
                    
                    {itemTime.actualDuration !== null && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Real:</span>
                          <span className="font-mono">{formatTime(itemTime.actualDuration)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Diferença:</span>
                          <span className={`font-mono font-bold ${
                            itemTime.difference > 0 ? 'text-red-400' :
                            itemTime.difference < 0 ? 'text-blue-400' :
                            'text-green-400'
                          }`}>
                            {itemTime.difference > 0 && '+'}
                            {formatTime(Math.abs(itemTime.difference))}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botão Salvar */}
            {itemTimes.some(it => it.actualDuration !== null) && (
              <Button
                onClick={handleSaveAllRehearsals}
                className="w-full mt-4"
                variant="outline"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Ensaios
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeModeView;

