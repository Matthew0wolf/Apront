import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { usePresenterConfig } from '@/contexts/PresenterConfigContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import FormattedScript from '@/components/shared/FormattedScript';

const PresenterConfigDialog = ({ open, onClose }) => {
  const { presenterConfig, updatePresenterConfig } = usePresenterConfig();
  const { toast } = useToast();

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
                min="0.5"
                max="2.0"
                step="0.1"
                value={presenterConfig.scrollSpeed}
                onChange={(e) => updatePresenterConfig({ scrollSpeed: parseFloat(e.target.value) })}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5x (Lento)</span>
                <span>2.0x (Rápido)</span>
              </div>
            </div>
          )}

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
                  scrollSpeed: 1.0
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

