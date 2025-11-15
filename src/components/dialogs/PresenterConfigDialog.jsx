import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Eye, EyeOff, Lightbulb, Sparkles } from 'lucide-react';
import { usePresenterConfig } from '@/contexts/PresenterConfigContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import FormattedScript from '@/components/shared/FormattedScript';

// Função para formatar duração em texto legível
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) {
    return `${mins}min ${secs}s`;
  } else if (mins > 0) {
    return `${mins}min`;
  } else {
    return `${secs}s`;
  }
};

// Função para calcular velocidade sugerida baseada na duração do evento
// A velocidade é calculada de forma que eventos mais longos tenham scroll mais lento
// para permitir leitura confortável do script completo durante a duração do evento
const calculateSuggestedSpeed = (duration) => {
  if (!duration || duration <= 0) return null;
  
  // Velocidades sugeridas baseadas na duração (em segundos):
  // - Eventos muito curtos (< 30s): velocidade rápida (1.0x - 1.3x)
  //   Para eventos rápidos, precisa scroll mais rápido para acompanhar
  // - Eventos curtos (30s - 1min): velocidade normal (0.7x - 1.0x)
  // - Eventos médios (1min - 3min): velocidade moderada (0.4x - 0.7x)
  // - Eventos longos (3min - 5min): velocidade lenta (0.25x - 0.4x)
  // - Eventos muito longos (5min - 10min): velocidade muito lenta (0.15x - 0.25x)
  // - Eventos extremamente longos (> 10min): velocidade extremamente lenta (0.1x - 0.15x)
  
  // Fórmula: velocidade diminui exponencialmente com a duração
  // Base: 1.0x para 30s, diminuindo para 0.1x em eventos muito longos
  if (duration < 30) {
    // Eventos muito curtos: 1.0x - 1.3x
    return Math.max(0.1, Math.min(1.3, 1.0 + (30 - duration) * 0.01));
  } else if (duration < 60) {
    // Eventos curtos (30s - 1min): 0.7x - 1.0x
    return Math.max(0.1, Math.min(1.0, 1.0 - (duration - 30) * 0.01));
  } else if (duration < 180) {
    // Eventos médios (1min - 3min): 0.4x - 0.7x
    return Math.max(0.1, Math.min(0.7, 0.7 - (duration - 60) * 0.0025));
  } else if (duration < 300) {
    // Eventos longos (3min - 5min): 0.25x - 0.4x
    return Math.max(0.1, Math.min(0.4, 0.4 - (duration - 180) * 0.00125));
  } else if (duration < 600) {
    // Eventos muito longos (5min - 10min): 0.15x - 0.25x
    return Math.max(0.1, Math.min(0.25, 0.25 - (duration - 300) * 0.00033));
  } else {
    // Eventos extremamente longos (> 10min): 0.1x - 0.15x
    return Math.max(0.1, Math.min(0.15, 0.15 - (duration - 600) * 0.00008));
  }
};

const PresenterConfigDialog = ({ open, onClose, currentItem }) => {
  const { presenterConfig, updatePresenterConfig } = usePresenterConfig();
  const { toast } = useToast();
  
  // Calcula velocidade sugerida baseada na duração do evento atual
  const suggestedSpeed = useMemo(() => {
    if (!currentItem) return null;
    const duration = typeof currentItem.duration === 'number' 
      ? currentItem.duration 
      : parseInt(currentItem.duration) || 0;
    return calculateSuggestedSpeed(duration);
  }, [currentItem]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Apresentador
          </DialogTitle>
          <DialogDescription>
            Configure a aparência e comportamento da tela do apresentador
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Visibilidade do Script */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              Exibir Script
              <span className={`text-xs px-2 py-1 rounded-full ${presenterConfig.showScript ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {presenterConfig.showScript ? 'Visível' : 'Oculto'}
              </span>
            </label>
            <Button
              onClick={() => {
                const newValue = !presenterConfig.showScript;
                updatePresenterConfig({ showScript: newValue });
                toast({ 
                  title: newValue ? "📖 Script Visível" : "👁️ Script Oculto",
                  description: newValue ? "Apresentador pode ver os scripts" : "Apresentador vê apenas títulos"
                });
              }}
              variant={presenterConfig.showScript ? "default" : "outline"}
              className="w-full"
              size="sm"
            >
              {presenterConfig.showScript ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              {presenterConfig.showScript ? 'Ocultar Script' : 'Mostrar Script'}
            </Button>
          </div>

          {/* Tamanho da Fonte */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
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
            <label className="text-sm font-medium flex items-center justify-between">
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
            <label className="text-sm font-medium">
              Fonte
            </label>
            <select
              value={presenterConfig.fontFamily}
              onChange={(e) => updatePresenterConfig({ fontFamily: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="sans-serif">Sans-serif (Moderna)</option>
              <option value="serif">Serif (Clássica)</option>
              <option value="mono">Monospace (Código)</option>
            </select>
          </div>

          {/* Auto-scroll */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              Auto-scroll
              <span className={`text-xs px-2 py-1 rounded-full ${presenterConfig.autoScroll ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {presenterConfig.autoScroll ? 'Ativo' : 'Inativo'}
              </span>
            </label>
            <Button
              onClick={() => {
                const newValue = !presenterConfig.autoScroll;
                updatePresenterConfig({ autoScroll: newValue });
                toast({ 
                  title: newValue ? "▶️ Auto-scroll Ativado" : "⏸️ Auto-scroll Desativado",
                  description: newValue ? "Script rola automaticamente" : "Scroll manual" 
                });
              }}
              variant={presenterConfig.autoScroll ? "default" : "outline"}
              className="w-full"
              size="sm"
            >
              {presenterConfig.autoScroll ? '⏸️ Desativar' : '▶️ Ativar'} Auto-scroll
            </Button>
          </div>

          {/* Velocidade do Scroll */}
          {presenterConfig.autoScroll && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                Velocidade do Scroll
                <span className="text-xs text-muted-foreground">{presenterConfig.scrollSpeed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={presenterConfig.scrollSpeed}
                onChange={(e) => updatePresenterConfig({ scrollSpeed: parseFloat(e.target.value) })}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.1x (Muito Lento)</span>
                <span>2.0x (Rápido)</span>
              </div>
              
              {/* Sugestão de Velocidade */}
              {suggestedSpeed && currentItem && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">Sugestão Automática</span>
                    </div>
                    <span className="text-xs font-mono text-blue-300">{suggestedSpeed.toFixed(1)}x</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Para um evento de <strong>{formatDuration(typeof currentItem.duration === 'number' ? currentItem.duration : parseInt(currentItem.duration) || 0)}</strong>, 
                    sugerimos uma velocidade de <strong>{suggestedSpeed.toFixed(1)}x</strong> para uma leitura confortável.
                  </p>
                  <Button
                    onClick={() => {
                      updatePresenterConfig({ scrollSpeed: parseFloat(suggestedSpeed.toFixed(1)) });
                      toast({
                        title: "⚡ Velocidade Aplicada",
                        description: `Velocidade ajustada para ${suggestedSpeed.toFixed(1)}x conforme sugestão`,
                        duration: 2000
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    Aplicar Sugestão
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Loop do Auto-scroll */}
          {presenterConfig.autoScroll && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                Loop do Auto-scroll
                <span className={`text-xs px-2 py-1 rounded-full ${presenterConfig.scrollLoop ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {presenterConfig.scrollLoop ? 'Ativo' : 'Inativo'}
                </span>
              </label>
              <Button
                onClick={() => {
                  const newValue = !presenterConfig.scrollLoop;
                  updatePresenterConfig({ scrollLoop: newValue });
                  toast({ 
                    title: newValue ? "🔄 Loop Ativado" : "⏹️ Loop Desativado",
                    description: newValue ? 'Auto-scroll volta ao início quando chega no final' : 'Auto-scroll para no final do script'
                  });
                }}
                variant={presenterConfig.scrollLoop ? "default" : "outline"}
                className="w-full"
                size="sm"
              >
                {presenterConfig.scrollLoop ? '🔄 Desativar' : '🔄 Ativar'} Loop
              </Button>
              <p className="text-xs text-muted-foreground">
                {presenterConfig.scrollLoop 
                  ? 'Quando o script chegar no final, volta automaticamente ao início'
                  : 'Quando o script chegar no final, para e permanece no final'}
              </p>
            </div>
          )}

          {/* Posição Inicial do Scroll */}
          {presenterConfig.autoScroll && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                Posição Inicial do Scroll
                <span className="text-xs text-muted-foreground">{presenterConfig.scrollStartPosition}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={presenterConfig.scrollStartPosition}
                onChange={(e) => {
                  const newPosition = parseInt(e.target.value);
                  updatePresenterConfig({ scrollStartPosition: newPosition });
                  toast({
                    title: "📍 Posição Inicial Atualizada",
                    description: `Scroll começará em ${newPosition}% do script`,
                    duration: 2000
                  });
                }}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Topo (0%)</span>
                <span>Meio (50%)</span>
                <span>Final (100%)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Define de onde o auto-scroll deve começar quando iniciar um novo item
              </p>
            </div>
          )}

          {/* Alertas Sonoros */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center justify-between">
              Alertas Sonoros
              <span className="text-xs text-muted-foreground">
                {presenterConfig.audioAlerts === 'both' ? 'Ambos' : 
                 presenterConfig.audioAlerts === 'operator' ? 'Apenas Operador' :
                 presenterConfig.audioAlerts === 'presenter' ? 'Apenas Apresentador' : 'Desativado'}
              </span>
            </label>
            <select
              value={presenterConfig.audioAlerts}
              onChange={(e) => {
                updatePresenterConfig({ audioAlerts: e.target.value });
                toast({ 
                  title: "🔔 Alertas Sonoros Atualizados",
                  description: e.target.value === 'both' ? 'Alertas tocam para ambos' :
                               e.target.value === 'operator' ? 'Alertas tocam apenas para o operador' :
                               e.target.value === 'presenter' ? 'Alertas tocam apenas para o apresentador' :
                               'Alertas sonoros desativados'
                });
              }}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="both">Ambos (Operador e Apresentador)</option>
              <option value="operator">Apenas Operador</option>
              <option value="presenter">Apenas Apresentador</option>
              <option value="none">Desativado</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Escolha onde os alertas sonoros (30s, 10s, countdown) devem tocar
            </p>
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/10">
            <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">Preview</h4>
            <div className="text-sm">
              <FormattedScript
                text="Este é um **texto em negrito**, com __ênfase__, [PAUSA] e texto normal."
                className="text-left"
                style={{
                  fontSize: `${Math.max(12, presenterConfig.fontSize * 0.6)}px`,
                  lineHeight: presenterConfig.lineHeight,
                  fontFamily: presenterConfig.fontFamily === 'serif' ? 'Georgia, serif' : 
                             presenterConfig.fontFamily === 'mono' ? 'monospace' : 
                             'Inter, system-ui, sans-serif',
                  color: presenterConfig.textColor
                }}
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                updatePresenterConfig({
                  fontSize: 24,
                  lineHeight: 1.8,
                  fontFamily: 'sans-serif',
                  backgroundColor: '#000000',
                  textColor: '#FFFFFF',
                  showScript: true,
                  autoScroll: false,
                  scrollSpeed: 0.5,
                  scrollLoop: false,
                  scrollStartPosition: 0,
                  audioAlerts: 'both'
                });
                toast({ title: "🔄 Configurações Resetadas", description: "Voltou aos padrões" });
              }}
            >
              Resetar Padrões
            </Button>
            <Button
              className="flex-1"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PresenterConfigDialog;

