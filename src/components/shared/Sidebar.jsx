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
    const handleClickOutside = (e) => {
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);
  const { user } = useContext(AuthContext);

  // Define itens do menu baseado no role do usuário
  const getMenuItems = () => {
    const allItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'operator', 'presenter'] },
      { id: 'projects', label: 'Meus Roteiros', icon: FolderOpen, roles: ['admin', 'operator', 'presenter'] },
      { id: 'templates', label: 'Modelos', icon: FileText, roles: ['admin', 'operator'] },
      { id: 'team', label: 'Equipe', icon: Users, roles: ['admin', 'operator', 'presenter'] },
      { id: 'settings', label: 'Configurações', icon: Settings, roles: ['admin', 'operator', 'presenter'] },
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
        className="h-14 sm:h-16 px-3 sm:px-6 bg-background border-b border-border flex items-center justify-between shadow-sm relative z-50"
      >
        <div className="flex items-center gap-2 sm:gap-8">
          <div className="flex items-center gap-2 sm:gap-3 select-none">
            <img
              src={theme === 'dark' ? '/apront-logo-light.svg' : '/apront-logo-dark.svg'}
              alt="Apront"
              className="h-6 sm:h-8 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      className={`justify-start gap-2 h-9 rounded-lg px-4 transition-all ${
                        isActive 
                          ? 'bg-white text-foreground dark:bg-white dark:text-black font-medium shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                      onClick={() => onViewChange(item.id)}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
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
          className="lg:hidden"
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

        <div className="flex items-center gap-2 sm:gap-4">
          {(user?.role === 'admin' || user?.role === 'operator' || user?.role === 'presenter') && (
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground relative rounded-none h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setIsNotifOpen((v) => !v)}
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            {/* Painel de notificações */}
            <div className={`absolute right-0 mt-2 w-72 sm:w-80 bg-card text-card-foreground border border-border shadow z-50 rounded-lg ${isNotifOpen ? 'block' : 'hidden'}`}>
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
                    <p className="text-xs sm:text-sm text-muted-foreground">Sem notificações</p>
                  </div>
                ) : notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-2 sm:p-3 border-b border-border cursor-pointer transition-colors ${
                      n.read ? 'bg-background' : 'bg-primary/5 hover:bg-primary/10'
                    }`}
                    onClick={() => !n.read && markAsRead(n.id)}
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
        className="fixed top-14 sm:top-16 right-0 w-64 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-background border-l border-border z-40 lg:hidden"
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