import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Clock, Globe, Bell, Monitor, Save, User, Camera, Lock, Mail, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from '@/contexts/AuthContext.jsx';
import { API_BASE_URL } from '@/config/api';

const SettingsView = () => {
  const { toast } = useToast();
  const { token, user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Dados pessoais
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar: null
  });
  
  // Dados de senha
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Preferências de notificações
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_enabled: true,
    push_enabled: true,
    in_app_enabled: true,
    notify_rundown_started: true,
    notify_rundown_finished: true,
    notify_team_invite: true,
    notify_item_assigned: true,
    notify_trial_ending: true,
    notify_payment_due: true
  });
  
  // Configurações do sistema
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
    
    // Carrega dados do perfil
    if (token) {
      fetchProfile();
      fetchNotificationPreferences();
    }
  }, [token]);

  const fetchNotificationPreferences = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationPrefs(data);
      }
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
    }
  };

  const saveNotificationPreferences = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationPrefs)
      });

      if (res.ok) {
        toast({
          title: "✅ Preferências Salvas",
          description: "Suas preferências de notificação foram atualizadas!"
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as preferências"
      });
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData({
          name: data.name,
          email: data.email,
          avatar: data.avatar
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    }
  };

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

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "✅ Perfil Atualizado",
          description: "Seus dados pessoais foram atualizados com sucesso!",
        });
        // Atualiza o contexto do usuário e localStorage
        const updatedUser = { ...user, name: profileData.name, email: profileData.email };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast({
          title: "Erro",
          description: data.error || 'Não foi possível atualizar o perfil.',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "✅ Senha Alterada",
          description: "Sua senha foi alterada com sucesso!",
        });
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || 'Não foi possível alterar a senha.',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verifica tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    // Verifica tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Converte para base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            avatar: e.target.result
          })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          toast({
            title: "✅ Avatar Atualizado",
            description: "Sua foto de perfil foi atualizada com sucesso!",
          });
          setProfileData(prev => ({ ...prev, avatar: data.avatar }));
          // Atualiza o contexto do usuário e localStorage
          const updatedUser = { ...user, avatar: data.avatar };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          toast({
            title: "Erro",
            description: data.error || 'Não foi possível atualizar o avatar.',
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao servidor.",
          variant: "destructive",
        });
      }
    };
    reader.readAsDataURL(file);
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
        <p className="text-muted-foreground">Gerencie sua conta e personalize sua experiência</p>
      </div>

      {/* Abas */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'profile', label: 'Perfil', icon: User },
            { id: 'password', label: 'Segurança', icon: Lock },
            { id: 'preferences', label: 'Preferências', icon: Monitor },
            { id: 'notifications', label: 'Notificações', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      <div className="grid gap-6">
        {/* Aba Perfil */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Dados Pessoais</h2>
            </div>
            
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={profileData.avatar ? `${API_BASE_URL}/api/user/avatar/${profileData.avatar}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=random&rounded=true`}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                    onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=random&rounded=true`; }}
                  />
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Foto de Perfil</h3>
                  <p className="text-sm text-muted-foreground">Clique na câmera para alterar</p>
                </div>
              </div>

              {/* Nome e Email */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                    placeholder="Seu nome completo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Perfil'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Aba Senha */}
        {activeTab === 'password' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Alterar Senha</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                  placeholder="Digite sua senha atual"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                  placeholder="Digite sua nova senha"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                  placeholder="Confirme sua nova senha"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handlePasswordChange} disabled={loading}>
                  <Lock className="w-4 h-4 mr-2" />
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Aba Preferências */}
        {activeTab === 'preferences' && (
          <>
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

            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </>
        )}

        {/* Aba Notificações */}
        {activeTab === 'notifications' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Preferências de Notificações</h2>
                  <p className="text-sm text-muted-foreground">Escolha como e quando receber notificações</p>
                </div>
              </div>

              {/* Canais de Notificação */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Canais</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">📧 Notificações por Email</p>
                      <p className="text-sm text-muted-foreground">Receba alertas no seu email</p>
                    </div>
                    <label className="relative inline-block w-11 h-6">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.email_enabled}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, email_enabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">🔔 Notificações no Aplicativo</p>
                      <p className="text-sm text-muted-foreground">Alertas dentro do sistema</p>
                    </div>
                    <label className="relative inline-block w-11 h-6">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.in_app_enabled}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, in_app_enabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tipos de Notificação */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Eventos</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-foreground">Rundown iniciado</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.notify_rundown_started}
                      onChange={(e) => setNotificationPrefs(prev => ({ ...prev, notify_rundown_started: e.target.checked }))}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-foreground">Rundown finalizado</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.notify_rundown_finished}
                      onChange={(e) => setNotificationPrefs(prev => ({ ...prev, notify_rundown_finished: e.target.checked }))}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-foreground">Convite para equipe</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.notify_team_invite}
                      onChange={(e) => setNotificationPrefs(prev => ({ ...prev, notify_team_invite: e.target.checked }))}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-foreground">Item atribuído a mim</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.notify_item_assigned}
                      onChange={(e) => setNotificationPrefs(prev => ({ ...prev, notify_item_assigned: e.target.checked }))}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-foreground">Trial expirando</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.notify_trial_ending}
                      onChange={(e) => setNotificationPrefs(prev => ({ ...prev, notify_trial_ending: e.target.checked }))}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-foreground">Pagamento vencendo</label>
                    <input
                      type="checkbox"
                      checked={notificationPrefs.notify_payment_due}
                      onChange={(e) => setNotificationPrefs(prev => ({ ...prev, notify_payment_due: e.target.checked }))}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>

              {/* Botão Salvar */}
              <div className="flex justify-end">
                <Button onClick={saveNotificationPreferences} className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Preferências
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsView;