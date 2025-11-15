import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  FolderOpen, 
  Settings, 
  FileText, 
  Users, 
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const Sidebar = ({ currentView, onViewChange }) => {
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Meus Projetos', icon: FolderOpen },
    { id: 'templates', label: 'Modelos', icon: FileText },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-secondary border-b border-border p-4 flex items-center justify-between shadow-sm"
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Run It Down</h1>
          </div>
        </div>

        <nav>
          <ul className="flex items-center gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <li key={item.id}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`justify-start gap-2 h-10 ${
                      isActive 
                        ? 'font-semibold' 
                        : 'text-muted-foreground hover:text-foreground'
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

      <div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>
    </motion.header>
  );
};

export default Sidebar;