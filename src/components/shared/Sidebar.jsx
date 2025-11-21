import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  FolderOpen, 
  Settings, 
  FileText, 
  Users, 
  Zap,
  CreditCard,
  BarChart3,
  History
} from 'lucide-react';

import { Button } from '@/components/ui/button';
// import { useTheme } from '@/contexts/ThemeContext.jsx';
import UserMenu from '@/components/shared/UserMenu.jsx';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const Sidebar = ({ currentView, onViewChange }) => {
  const { theme } = useTheme();
  // Notificações agora são apenas via Toaster flutuante
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