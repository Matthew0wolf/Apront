import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  useEffect(() => {
    // Carregar script do item
    const loadScript = async () => {
      try {
        // Verifica se o item tem ID temporário (string) ou real (número)
        const isTemporaryId = isNaN(Number(item.id));
        
        if (isTemporaryId) {
          // Item ainda não foi salvo no backend: não tenta carregar da API
          console.log('📝 Item temporário, pulando carregamento da API:', item.id);
          return;
        }
        
        const response = await apiCall(`/api/items/${item.id}/script`);
        
        if (response.ok) {
          const data = await response.json();
          // Só carrega do servidor se o usuário ainda não começou a editar
          if (!isDirty) {
            setScriptData({
              script: data.script || '',
              talkingPoints: data.talking_points || [],
              pronunciationGuide: data.pronunciation_guide || '',
              presenterNotes: data.presenter_notes || ''
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar script:', error);
      }
    };

    if (item?.id && lastLoadedItemIdRef.current !== item.id) {
      // Apenas quando o ID mudar de fato
      lastLoadedItemIdRef.current = item.id;
      setIsDirty(false);
      loadScript();
    }
  }, [item, apiCall]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Verifica se o item tem ID temporário (string) ou real (número)
      const isTemporaryId = isNaN(Number(item.id));
      
      if (isTemporaryId) {
        // Item ainda não foi salvo no backend: salva apenas no estado local
        console.log('📝 Salvando script localmente para item temporário:', item.id);
        
        // Dispara evento para sincronizar script no rundown local
        if (onSave) {
          onSave(scriptData);
        }
        
        toast({
          title: "✅ Script salvo",
          description: "O script foi atualizado com sucesso!"
        });
        onClose();
      } else {
        // Item existe no backend: salva via API
        const response = await apiCall(`/api/items/${item.id}/script`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script: scriptData.script,
            talking_points: scriptData.talkingPoints,
            pronunciation_guide: scriptData.pronunciationGuide,
            presenter_notes: scriptData.presenterNotes
          })
        });

        if (response.ok) {
          toast({
            title: "✅ Script salvo",
            description: "O script foi atualizado com sucesso!"
          });
          if (onSave) {
            onSave(scriptData);
          }
          onClose();
        } else {
          throw new Error('Erro ao salvar script');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message
      });
    } finally {
      setIsSaving(false);
    }
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
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Editor de Script
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{item?.title}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
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
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
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

