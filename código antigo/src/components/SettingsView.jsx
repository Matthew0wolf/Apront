import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Globe, Bell, Monitor, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SettingsView = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    notifications: {
      sound: true,
      visual: true,
      email: false,
    },
    display: {
      fontSize: 'medium',
      animations: true,
    },
    alerts: {
      beforeStart: 30,
      beforeEnd: 10,
      autoAdvance: false,
    }
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('liveControlSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
    { value: 'America/New_York', label: 'Nova York (GMT-5)' },
    { value: 'Europe/London', label: 'Londres (GMT+0)' },
    { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
    { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)' },
  ];

  const handleSave = () => {
    localStorage.setItem('liveControlSettings', JSON.stringify(settings));
    toast({
      title: "✅ Configurações Salvas",
      description: "Suas preferências foram atualizadas com sucesso!",
    });
  };

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">Personalize sua experiência no sistema</p>
      </div>

      <div className="grid gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Fuso Horário e Localização</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Fuso Horário
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => updateSetting('timezone', e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Idioma
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Notificações</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Alertas Sonoros</h3>
                <p className="text-sm text-muted-foreground">Sons de alerta durante a transmissão</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.sound}
                  onChange={(e) => updateSetting('notifications.sound', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Alertas Visuais</h3>
                <p className="text-sm text-muted-foreground">Notificações na tela</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.visual}
                  onChange={(e) => updateSetting('notifications.visual', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Interface</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Tamanho da Fonte
              </label>
              <select
                value={settings.display.fontSize}
                onChange={(e) => updateSetting('display.fontSize', e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
              >
                <option value="small">Pequena</option>
                <option value="medium">Média</option>
                <option value="large">Grande</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Animações</h3>
                <p className="text-sm text-muted-foreground">Efeitos visuais</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.animations}
                  onChange={(e) => updateSetting('display.animations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default SettingsView;