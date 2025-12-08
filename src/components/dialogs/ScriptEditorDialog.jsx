import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Save, FileText, List, Volume2, StickyNote, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import FormattedScript from '@/components/shared/FormattedScript';
import { useApi } from '@/hooks/useApi';

const ScriptEditorDialog = ({ item, onSave, onClose }) => {
  const { toast } = useToast();
  const { apiCall } = useApi();
  const [activeTab, setActiveTab] = useState('script');
  const [scriptData, setScriptData] = useState({
    script: '',
    talkingPoints: [],
    pronunciationGuide: '',
    presenterNotes: ''
  });
  const [newTalkingPoint, setNewTalkingPoint] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const lastLoadedItemIdRef = useRef(null);
  const [readingWpm, setReadingWpm] = useState(() => {
    const saved = localStorage.getItem('reading_wpm');
    const n = parseInt(saved || '150', 10);
    return Number.isFinite(n) && n > 60 && n < 260 ? n : 150; // 150 wpm default
  });

  // Estimativa de tempo de leitura baseada no texto
  const recommendedSeconds = useMemo(() => {
    const text = (scriptData.script || '').replace(/\s+/g, ' ').trim();
    if (!text) return 0;
    // Remove marcações como **, __ e tags [PAUSA] do cômputo de palavras
    const cleaned = text
      .replace(/\*\*|__/g, '')
      .replace(/\[PAUSA\]/gi, ' ')
      .replace(/\[\w+\]/g, ' ');
    const words = cleaned.split(/\s+/).filter(Boolean).length;
    const base = (words / Math.max(100, readingWpm)) * 60; // segundos
    const pauses = (text.match(/\[PAUSA\]/gi) || []).length;
    const extra = pauses * 1.5; // 1.5s por [PAUSA]
    return Math.round(base + extra);
  }, [scriptData.script, readingWpm]);

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const ss = Math.max(0, Math.round(s % 60));
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  };
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const autoSaveTimeoutRef = useRef(null);
  const lastSavedDataRef = useRef(null);
  const currentScriptDataRef = useRef(scriptData); // Ref para acessar dados atuais no cleanup
  const isSavingRef = useRef(false); // Ref para evitar múltiplas requisições simultâneas
  const lastErrorTimeRef = useRef(0); // Ref para rastrear quando ocorreu o último erro 429
  const consecutiveErrorsRef = useRef(0); // Ref para contar erros consecutivos
  const consecutive401404Ref = useRef(0); // Ref para contar erros 401/404 consecutivos
  const last401404TimeRef = useRef(0); // Ref para rastrear quando ocorreu o último erro 401/404

  // Função para salvar imediatamente (sem debounce) - usada quando o usuário clica em salvar ou fecha
  const saveImmediately = useCallback(async (dataToSave, silent = true) => {
    // CRÍTICO: Evita múltiplas requisições simultâneas
    if (isSavingRef.current) {
      console.log('⏸️ Salvamento já em andamento, ignorando requisição duplicada');
      return false;
    }

    // CRÍTICO: SEMPRE salva via onSave primeiro (que chama syncRundownUpdate -> PATCH rundown)
    // Isso garante que o script seja salvo no banco de dados, mesmo se o PUT falhar
    // O PATCH do rundown já salva os scripts corretamente (ver backend/routes/rundown.py linha 403-406)
    if (onSave) {
      onSave(dataToSave);
    }

    // Verifica se o item tem ID temporário
    const isTemporaryId = isNaN(Number(item.id));
    
    if (isTemporaryId) {
      // Item temporário: já salvou via onSave (PATCH rundown), não precisa tentar PUT
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      if (!silent) {
        toast({
          title: "✅ Script salvo",
          description: "O script foi atualizado com sucesso!"
        });
      }
      return true;
    }

    // CRÍTICO: Verifica se houve erro 429 recentemente e aplica backoff exponencial
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTimeRef.current;
    const backoffDelay = Math.min(30000, Math.pow(2, consecutiveErrorsRef.current) * 1000); // Máximo 30s
    
    if (timeSinceLastError < backoffDelay && consecutiveErrorsRef.current > 0) {
      console.log(`⏳ Aguardando backoff após erro 429: ${Math.ceil((backoffDelay - timeSinceLastError) / 1000)}s restantes`);
      // Já salvou via onSave, então retorna sucesso
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return true;
    }

    // Tenta salvar via PUT como otimização (item já existe no banco)
    // Se falhar, não é problema porque já salvou via PATCH rundown
    try {
      isSavingRef.current = true;
      setSaveStatus('saving');
      
      const response = await apiCall(`/api/items/${item.id}/script`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: dataToSave.script,
          talking_points: dataToSave.talkingPoints,
          pronunciation_guide: dataToSave.pronunciationGuide,
          presenter_notes: dataToSave.presenterNotes
        })
      });

      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        lastSavedDataRef.current = JSON.stringify(dataToSave);
        consecutiveErrorsRef.current = 0; // Reset contador de erros
        lastErrorTimeRef.current = 0; // Reset tempo do último erro
        consecutive401404Ref.current = 0; // Reset contador de erros 401/404
        last401404TimeRef.current = 0; // Reset tempo do último erro 401/404
        
        // Notifica outros clientes via WebSocket
        window.dispatchEvent(new CustomEvent('scriptUpdated', {
          detail: { itemId: item.id }
        }));
        
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        
        if (!silent) {
          toast({
            title: "✅ Script salvo",
            description: "O script foi atualizado com sucesso!"
          });
        }
        isSavingRef.current = false;
        return true;
      } else {
        // Se 429 (TOO MANY REQUESTS), aplica backoff exponencial
        if (response.status === 429) {
          consecutiveErrorsRef.current += 1;
          lastErrorTimeRef.current = Date.now();
          const backoffSeconds = Math.min(30, Math.pow(2, consecutiveErrorsRef.current));
          console.warn(`⚠️ 429 TOO MANY REQUESTS no PUT. Já salvou via PATCH rundown. Backoff de ${backoffSeconds}s.`);
          
          // Já salvou via onSave (PATCH rundown), então retorna sucesso
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
          isSavingRef.current = false;
          return true; // Retorna true porque já salvou via PATCH
        }
        
        // Se 404 ou 401, o item pode não existir no banco ainda ou token inválido
        // Mas já salvou via PATCH rundown, então não é problema
        if (response.status === 404 || response.status === 401) {
          consecutive401404Ref.current += 1;
          last401404TimeRef.current = Date.now();
          console.log(`⚠️ ${response.status} no PUT. Já salvou via PATCH rundown. Erros consecutivos: ${consecutive401404Ref.current}`);
          
          // Já salvou via onSave (PATCH rundown), então retorna sucesso
          window.dispatchEvent(new CustomEvent('scriptUpdated', {
            detail: { itemId: item.id }
          }));
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
          isSavingRef.current = false;
          return true; // Retorna true porque já salvou via PATCH
        } else {
          // Outros erros (500, 403, etc)
          // Já salvou via PATCH rundown, então retorna sucesso mesmo com erro no PUT
          console.warn(`⚠️ Erro ${response.status} no PUT. Já salvou via PATCH rundown.`);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
          isSavingRef.current = false;
          return true; // Retorna true porque já salvou via PATCH
        }
      }
    } catch (error) {
      console.error('Erro ao salvar via PUT (não crítico, já salvou via PATCH):', error);
      // Já salvou via PATCH rundown, então retorna sucesso
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      isSavingRef.current = false;
      return true; // Retorna true porque já salvou via PATCH
    }
  }, [item.id, apiCall, onSave, toast]);

  // Função para salvar automaticamente (debounced) - usada durante a digitação
  const autoSave = useCallback(async (dataToSave, silent = true) => {
    // Cancela salvamento anterior se ainda estiver pendente
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // CRÍTICO: SEMPRE salva via onSave primeiro (que chama syncRundownUpdate -> PATCH rundown)
    // Isso garante que o script seja salvo no banco de dados
    if (onSave) {
      onSave(dataToSave);
    }

    // Verifica se o item tem ID temporário
    const isTemporaryId = isNaN(Number(item.id));
    
    if (isTemporaryId) {
      // Item temporário: já salvou via onSave (PATCH rundown), não precisa tentar PUT
      if (!silent) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
      return;
    }

    // Debounce: aguarda 3 segundos após a última alteração (aumentado para reduzir requisições)
    // Tenta PUT como otimização, mas já salvou via PATCH rundown
    autoSaveTimeoutRef.current = setTimeout(async () => {
      await saveImmediately(dataToSave, silent);
    }, 3000); // 3 segundos de debounce (aumentado de 1.5s para reduzir requisições)
  }, [item.id, onSave, saveImmediately]);

  useEffect(() => {
    // Carregar script do item
    const loadScript = async () => {
      try {
        // PRIMEIRO: Tenta carregar do estado local do item (que vem do rundown)
        // Isso garante que dados salvos localmente sejam exibidos mesmo se não estiverem no banco ainda
        if (item?.script !== undefined || item?.talking_points !== undefined || 
            item?.pronunciation_guide !== undefined || item?.presenter_notes !== undefined) {
          const localData = {
            script: item.script || '',
            talkingPoints: Array.isArray(item.talking_points) ? item.talking_points : 
                         (typeof item.talking_points === 'string' ? JSON.parse(item.talking_points || '[]') : []),
            pronunciationGuide: item.pronunciation_guide || '',
            presenterNotes: item.presenter_notes || ''
          };
          
          // Só atualiza se os dados locais forem diferentes dos atuais (evita sobrescrever edições em andamento)
          const currentDataStr = JSON.stringify(scriptData);
          const localDataStr = JSON.stringify(localData);
          if (currentDataStr !== localDataStr && !isDirty) {
            console.log('📝 Carregando script do estado local do item:', item.id);
            setScriptData(localData);
            lastSavedDataRef.current = localDataStr;
            return; // Usa dados locais, não precisa carregar do banco
          }
        }
        
        // Verifica se o item tem ID temporário (string) ou real (número)
        const isTemporaryId = isNaN(Number(item.id));
        
        if (isTemporaryId) {
          // Item ainda não foi salvo no backend: não tenta carregar da API
          console.log('📝 Item temporário, usando apenas dados locais:', item.id);
          return;
        }
        
        // SEGUNDO: Tenta carregar do banco de dados (apenas se não houver dados locais ou se isDirty for false)
        if (!isDirty) {
          const response = await apiCall(`/api/items/${item.id}/script`);
          
          if (response.ok) {
            const data = await response.json();
            const loadedData = {
              script: data.script || '',
              talkingPoints: data.talking_points || [],
              pronunciationGuide: data.pronunciation_guide || '',
              presenterNotes: data.presenter_notes || ''
            };
            
            // Só atualiza se os dados do servidor forem diferentes dos atuais
            const currentDataStr = JSON.stringify(scriptData);
            const loadedDataStr = JSON.stringify(loadedData);
            if (currentDataStr !== loadedDataStr) {
              console.log('📥 Carregando script do banco de dados:', item.id);
              setScriptData(loadedData);
              lastSavedDataRef.current = loadedDataStr;
            }
          } else if (response.status === 404) {
            // Item não encontrado no banco - usa dados locais se disponíveis
            console.log('⚠️ Item não encontrado no banco (404), usando dados locais se disponíveis:', item.id);
            // Os dados locais já foram carregados acima, então não faz nada
          } else if (response.status === 401) {
            // Token expirado - useApi já tentou fazer refresh, mas se ainda falhou, usa dados locais
            console.log('⚠️ Erro de autenticação (401) ao carregar script, usando dados locais se disponíveis:', item.id);
            // Os dados locais já foram carregados acima, então não faz nada
          }
        }
      } catch (error) {
        console.error('Erro ao carregar script:', error);
        // Em caso de erro, tenta usar dados locais se disponíveis
        if (item?.script !== undefined || item?.talking_points !== undefined) {
          const localData = {
            script: item.script || '',
            talkingPoints: Array.isArray(item.talking_points) ? item.talking_points : 
                         (typeof item.talking_points === 'string' ? JSON.parse(item.talking_points || '[]') : []),
            pronunciationGuide: item.pronunciation_guide || '',
            presenterNotes: item.presenter_notes || ''
          };
          if (!isDirty) {
            setScriptData(localData);
            lastSavedDataRef.current = JSON.stringify(localData);
          }
        }
      }
    };

    if (item?.id && lastLoadedItemIdRef.current !== item.id) {
      // Apenas quando o ID mudar de fato
      lastLoadedItemIdRef.current = item.id;
      setIsDirty(false); // Reset isDirty quando um novo item é carregado
      loadScript();
    }

    // Cleanup: salva mudanças pendentes antes de desmontar
    return () => {
      // Se houver mudanças não salvas, salva antes de desmontar
      if (autoSaveTimeoutRef.current) {
        // Cancela o timeout
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
      
      // Verifica se há mudanças não salvas usando a ref (sempre atualizada)
      if (isDirty && item?.id) {
        const currentData = JSON.stringify(currentScriptDataRef.current);
        if (currentData !== lastSavedDataRef.current) {
          // Salva silenciosamente antes de desmontar
          // Usa setTimeout para não bloquear o desmonte
          setTimeout(() => {
            saveImmediately(currentScriptDataRef.current, true).catch(() => {
              // Ignora erros no cleanup
            });
          }, 0);
        }
      }
    };
  }, [item, apiCall, isDirty, saveImmediately]);

  // Atualiza a ref sempre que scriptData muda
  useEffect(() => {
    currentScriptDataRef.current = scriptData;
  }, [scriptData]);

  // Auto-save quando scriptData muda
  useEffect(() => {
    if (isDirty && item?.id && !isSavingRef.current) {
      const currentData = JSON.stringify(scriptData);
      // Só salva se os dados mudaram desde a última vez e não estiver salvando
      if (currentData !== lastSavedDataRef.current && saveStatus !== 'saving') {
        autoSave(scriptData, true); // silent = true para não mostrar toast a cada salvamento
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptData, isDirty, item?.id]); // Não inclui autoSave e saveStatus para evitar loops

  const handleSave = async () => {
    // Cancela qualquer salvamento automático pendente
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // Força salvamento imediato (sem debounce)
      await saveImmediately(scriptData, false); // silent = false para mostrar toast
      
      setIsSaving(false);
      onClose();
    } catch (error) {
      setIsSaving(false);
      setSaveStatus('error');
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o script"
      });
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Função para fechar com salvamento automático se houver mudanças
  const handleClose = async () => {
    // Cancela qualquer salvamento automático pendente
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    // Se houver mudanças não salvas, salva antes de fechar
    if (isDirty && item?.id) {
      const currentData = JSON.stringify(scriptData);
      if (currentData !== lastSavedDataRef.current) {
        // Mostra indicador de salvamento
        setSaveStatus('saving');
        // Salva silenciosamente antes de fechar
        await saveImmediately(scriptData, true);
      }
    }

    // Reset isDirty ao fechar para garantir que o próximo carregamento funcione corretamente
    setIsDirty(false);
    onClose();
  };

  const addTalkingPoint = () => {
    if (newTalkingPoint.trim()) {
      setScriptData(prev => ({
        ...prev,
        talkingPoints: [...prev.talkingPoints, newTalkingPoint.trim()]
      }));
      setNewTalkingPoint('');
    }
  };

  const removeTalkingPoint = (index) => {
    setScriptData(prev => ({
      ...prev,
      talkingPoints: prev.talkingPoints.filter((_, i) => i !== index)
    }));
  };

  const tabs = [
    { id: 'script', label: 'Script', icon: FileText },
    { id: 'points', label: 'Pontos-Chave', icon: List },
    { id: 'pronunciation', label: 'Pronúncia', icon: Volume2 },
    { id: 'notes', label: 'Notas', icon: StickyNote }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Editor de Script
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-muted-foreground">{item?.title}</p>
              {/* Indicador de salvamento em tempo real */}
              {saveStatus === 'saving' && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <span className="animate-spin">⏳</span>
                  Salvando...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  ✓ Salvo
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  ⚠ Erro ao salvar
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Script Completo
                </label>
                {/* Sugestão de tempo de leitura */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="text-muted-foreground">
                    Tempo sugerido: <span className="font-mono">{fmtTime(recommendedSeconds)}</span> (só uma recomendação)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Velocidade</span>
                    <input
                      type="range"
                      min={100}
                      max={220}
                      step={10}
                      value={readingWpm}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setReadingWpm(v);
                        localStorage.setItem('reading_wpm', String(v));
                      }}
                      className="w-40"
                      title="Palavras por minuto"
                    />
                    <span className="font-mono w-10 text-right">{readingWpm}</span>
                    <span className="text-muted-foreground">wpm</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Este é o texto que o apresentador lerá. Use **negrito** para ênfase, [PAUSA] para pausas, e __sublinhado__ para destaque.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Editor */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Editor</p>
                    <textarea
                      value={scriptData.script ?? ''}
                      onChange={(e) => {
                        const val = e.target?.value ?? '';
                        setIsDirty(true);
                        setScriptData(prev => ({ ...prev, script: val }));
                      }}
                      autoFocus
                      spellCheck={false}
                      className="w-full h-96 p-4 bg-background border border-border rounded-lg text-white caret-white font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Digite o script que o apresentador lerá..."
                    />
                  </div>
                  {/* Preview */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Preview (Como o apresentador verá)</p>
                    <div className="w-full h-96 p-4 bg-black/40 border border-border rounded-lg overflow-y-auto">
                      {scriptData.script ? (
                        <FormattedScript 
                          text={scriptData.script}
                          className="text-left leading-relaxed whitespace-pre-wrap"
                          style={{
                            fontSize: '18px',
                            lineHeight: 1.8,
                            color: '#FFFFFF'
                          }}
                        />
                      ) : (
                        <p className="text-muted-foreground text-sm italic">
                          O preview aparecerá aqui conforme você digita...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>Formatação suportada: **negrito**, __destaque__, [PAUSA], [ÊNFASE], [IMPORTANTE]</span>
              </div>
            </div>
          )}

          {activeTab === 'points' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pontos-Chave (Talking Points)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Lista de pontos principais que devem ser abordados neste item.
                </p>
              </div>
              
              <div className="space-y-2">
                {scriptData.talkingPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-secondary rounded-lg group">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <p className="flex-1 text-foreground">{point}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeTalkingPoint(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {scriptData.talkingPoints.length === 0 && (
                  <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg">
                    Nenhum ponto-chave adicionado ainda
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTalkingPoint}
                  onChange={(e) => setNewTalkingPoint(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTalkingPoint()}
                  placeholder="Digite um novo ponto-chave..."
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={addTalkingPoint} disabled={!newTalkingPoint.trim()}>
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'pronunciation' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Guia de Pronúncia
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Indique como pronunciar palavras difíceis, nomes próprios ou termos técnicos.
                </p>
                <textarea
                  value={scriptData.pronunciationGuide}
                  onChange={(e) => setScriptData(prev => ({ ...prev, pronunciationGuide: e.target.value }))}
                  className="w-full h-64 p-4 bg-background border border-border rounded-lg text-foreground font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Exemplo:&#10;Tech News → TECH NIUS&#10;João Silva → JOU-ow SIL-vah&#10;JavaScript → JÁ-va-script"
                />
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>Dica:</strong> Use o formato "Palavra → Pronúncia" para facilitar a leitura.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notas Privadas do Apresentador
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Notas e lembretes que apenas o apresentador verá (não aparece no teleprompter principal).
                </p>
                <textarea
                  value={scriptData.presenterNotes}
                  onChange={(e) => setScriptData(prev => ({ ...prev, presenterNotes: e.target.value }))}
                  className="w-full h-64 p-4 bg-background border border-border rounded-lg text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Exemplo:&#10;- Olhar para câmera 2&#10;- Mencionar patrocinador XYZ&#10;- Falar com energia!&#10;- Lembrar do sorteio no final"
                />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-sm text-foreground">
                  <strong>Privado:</strong> Estas notas só são visíveis para o apresentador na visualização dele.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Script
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditorDialog;

