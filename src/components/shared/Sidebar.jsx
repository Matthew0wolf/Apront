import React, { useContext, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  FolderOpen, 
  Settings, 
  FileText, 
  Users, 
  Zap,
  Bell,
  CreditCard,
  BarChart3,
  History
} from 'lucide-react';

import { Button } from '@/components/ui/button';
// import { useTheme } from '@/contexts/ThemeContext.jsx';
import UserMenu from '@/components/shared/UserMenu.jsx';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useNotifications } from '@/contexts/NotificationsContext.jsx';

const Sidebar = ({ currentView, onViewChange }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { notifications, unreadCount, clearNotification, clearAll, markAsRead, markAllAsRead } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  
  // Debug: Log para verificar se notificações estão carregando
  useEffect(() => {
    console.log('🔔 Sidebar: Notificações carregadas:', {
      total: notifications.length,
      unread: unreadCount,
      hasNotifications: notifications.length > 0
    });
  }, [notifications, unreadCount]);

  // Fecha painel ao clicar fora
  useEffect(() => {
    if (!isNotifOpen) return;
    
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    
    // Adiciona um pequeno delay para garantir que o evento de clique no botão seja processado primeiro
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNotifOpen]);
  const { user } = useContext(AuthContext);

  // Define itens do menu baseado no role do usuário - Mapeado conforme Figma
  const getMenuItems = () => {
    const allItems = [
      { id: 'dashboard', label: 'Página Inicial', icon: Home, roles: ['admin', 'operator', 'presenter'] },
      { id: 'projects', label: 'Meus Projetos', icon: FolderOpen, roles: ['admin', 'operator', 'presenter'] },
      { id: 'templates', label: 'Modelos', icon: FileText, roles: ['admin', 'operator'] },
      { id: 'team', label: 'Equipe', icon: Users, roles: ['admin', 'operator', 'presenter'] },
    ];

    // Filtra itens baseado no role do usuário
    if (!user) return [];
    return allItems.filter(item => item.roles.includes(user.role));
  };

  const menuItems = getMenuItems();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="h-[80px] px-6 flex items-center justify-between relative z-50 overflow-visible"
        style={{
          backgroundColor: isLight ? '#fffcfc' : '#080808'
        }}
      >
        {/* Pattern overlay - textura de fundo */}
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: isLight 
              ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(8,8,8,0.05) 10px, rgba(8,8,8,0.05) 20px)'
              : 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'
          }}
        />
        
        {/* Backdrop blur */}
        <div className="absolute inset-0 backdrop-blur-sm" />

        <div className="flex items-center gap-8 relative z-10">
          <div className="flex items-center gap-3 select-none relative">
            <div className="relative inline-block">
              <img
                src={isLight ? "/apront-logo-dark.svg" : "/apront-logo-light.svg"}
                alt="Apront"
                className="h-[38px] w-auto"
              />
              {/* Badge Beta - canto superior direito do logo */}
              <span
                className="absolute top-0 right-0 text-[7px] font-extrabold px-1 py-0.5 rounded leading-none"
                style={{
                  backgroundColor: '#e71d36',
                  color: '#ffffff',
                  transform: 'translate(30%, -30%)',
                  letterSpacing: '0.5px'
                }}
              >
                BETA
              </span>
            </div>
          </div>

          {/* Desktop Navigation - Estilo Figma */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                // Normaliza currentView para lidar com '/' ou vazio
                const normalizedView = currentView === '' || currentView === '/' ? 'dashboard' : currentView;
                const isActive = normalizedView === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      className="relative h-[38px] px-3 transition-all font-medium overflow-hidden cursor-pointer group"
                      style={{
                        backgroundColor: isActive ? '#e71d36' : (isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C'),
                        color: isLight ? '#080808' : '#ffffff'
                      }}
                      onClick={() => onViewChange(item.id)}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.7)' : '#171717';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C';
                        }
                      }}
                    >
                      {/* Borda principal com 20% de opacidade */}
                      <div 
                        className="absolute inset-0 border pointer-events-none transition-colors" 
                        style={{ 
                          borderColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.4)' : 'rgba(255, 255, 255, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)';
                          }
                        }}
                      />
                      
                      {/* Cantos decorativos - 100% de opacidade (listras nas pontas) */}
                      {/* Canto superior esquerdo */}
                      <div 
                        className="absolute top-0 left-0 w-[9.822px] h-[8.929px] border-t border-l pointer-events-none" 
                        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
                      />
                      
                      {/* Canto inferior esquerdo */}
                      <div 
                        className="absolute bottom-0 left-0 w-[8.929px] h-[9.822px] border-b border-l pointer-events-none" 
                        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
                      />
                      
                      {/* Canto superior direito */}
                      <div 
                        className="absolute top-0 right-0 w-[8.929px] h-[9.822px] border-t border-r pointer-events-none" 
                        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
                      />
                      
                      {/* Canto inferior direito */}
                      <div 
                        className="absolute bottom-0 right-0 w-[9.822px] h-[8.929px] border-b border-r pointer-events-none" 
                        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
                      />
                      
                      {/* Conteúdo do botão */}
                      <div className="relative z-10 flex items-center gap-2 h-full">
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? '#ffffff' : (isLight ? '#080808' : '#ffffff') }} />
                        <span className="text-sm font-medium leading-none whitespace-nowrap" style={{ color: isActive ? '#ffffff' : (isLight ? '#080808' : '#ffffff') }}>{item.label}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden relative z-10"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </Button>

        <div className="flex items-center gap-6 relative z-10" style={{ zIndex: 1001 }}>
          {/* Notificações - Estilo com listras */}
          {(user?.role === 'admin' || user?.role === 'operator' || user?.role === 'presenter') && (
          <div className="relative" ref={notifRef} style={{ zIndex: 1001 }}>
            <button
              className="relative h-[44px] w-[44px] flex items-center justify-center transition cursor-pointer overflow-hidden"
              style={{
                backgroundColor: isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C',
                color: isLight ? '#080808' : '#ffffff'
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsNotifOpen((v) => !v);
              }}
              aria-label="Notificações"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.7)' : '#171717';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C';
              }}
            >
              {/* Borda principal com 20% de opacidade */}
              <div 
                className="absolute inset-0 border pointer-events-none transition-colors" 
                style={{ 
                  borderColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.4)' : 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)';
                }}
              />
              
              {/* Cantos decorativos - 100% de opacidade */}
              {/* Canto superior esquerdo */}
              <div 
                className="absolute top-0 left-0 w-[9.822px] h-[8.929px] border-t border-l pointer-events-none" 
                style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
              />
              
              {/* Canto inferior esquerdo */}
              <div 
                className="absolute bottom-0 left-0 w-[8.929px] h-[9.822px] border-b border-l pointer-events-none" 
                style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
              />
              
              {/* Canto superior direito */}
              <div 
                className="absolute top-0 right-0 w-[8.929px] h-[9.822px] border-t border-r pointer-events-none" 
                style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
              />
              
              {/* Canto inferior direito */}
              <div 
                className="absolute bottom-0 right-0 w-[9.822px] h-[8.929px] border-b border-r pointer-events-none" 
                style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
              />
              
              {/* Ícone de sino */}
              <Bell className="w-5 h-5 relative z-10" style={{ color: isLight ? '#080808' : '#ffffff' }} />
              
              {/* Badge de notificações não lidas */}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#e71d36] text-white text-[10px] font-bold rounded-full min-w-[12px] h-[12px] flex items-center justify-center z-20 px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {/* Painel de notificações */}
            {isNotifOpen && (
            <div 
              className="absolute right-0 mt-2 w-72 sm:w-80 bg-card text-card-foreground border border-border shadow-lg rounded-lg"
              style={{ zIndex: 1000 }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                      Marcar lidas
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">Limpar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsNotifOpen(false)} className="text-xs">×</Button>
                </div>
              </div>
              <div className="max-h-64 sm:max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <Bell className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground opacity-30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Nenhuma notificação</p>
                    <p className="text-xs text-muted-foreground mt-1">Você não possui notificações no momento</p>
                  </div>
                ) : notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-2 sm:p-3 border-b border-border cursor-pointer transition-colors ${
                      n.read ? 'bg-background' : 'bg-primary/5 hover:bg-primary/10'
                    }`}
                    onClick={() => {
                      // Marcar como lida ao clicar na notificação (se ainda não estiver lida)
                      if (!n.read) {
                        markAsRead(n.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {/* Indicador de não lida */}
                      {!n.read && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                          {n.title}
                          {!n.read && <span className="text-xs bg-red-500 text-white px-1 sm:px-1.5 py-0.5 rounded">Novo</span>}
                        </div>
                        {(n.message || n.description) && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {n.message || n.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1 sm:mt-2">
                          {new Date(n.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(n.id);
                        }}
                        className="flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
          )}
          <UserMenu />
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isMobileMenuOpen ? 0 : '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed top-[117px] right-0 w-64 h-[calc(100vh-117px)] bg-background border-l border-border z-40 lg:hidden"
      >
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-4">Menu</h3>
          <nav>
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 h-12 rounded-lg px-4 transition-all ${
                        isActive 
                          ? 'bg-primary text-primary-foreground font-medium' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                      onClick={() => {
                        onViewChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;