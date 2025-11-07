import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/contexts/AuthContext.jsx';
import { ChevronDown, CreditCard, Settings, Users, BarChart3 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';

const UserMenu = () => {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (!user) return null;

  return (
    <div className="relative flex items-center gap-2 select-none" onBlur={(e) => {
      // Fecha menu ao perder foco (clique fora)
      if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
    }}>
      <img
        src={user.avatar ? `http://localhost:5001/api/user/avatar/${user.avatar}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&rounded=true`}
        alt="avatar"
        className="w-9 h-9 rounded-full object-cover border border-white/20 shadow"
        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&rounded=true`; }}
      />
      <button
        className="flex items-center gap-1 font-medium text-foreground hover:bg-white/10 px-3 py-1.5 rounded transition"
        onClick={() => setOpen((v) => !v)}
      >
        {user.name}
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>
      {open && (
        <div ref={menuRef} className={`absolute right-0 top-full mt-2 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} text-foreground rounded shadow-lg min-w-[220px] z-50 overflow-hidden`}>
          {/* Top group */}
          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-primary/10"
            onClick={() => { navigate('/analytics'); setOpen(false); }}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          {user?.role === 'admin' && (
            <button
              className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-primary/10"
              onClick={() => { navigate('/team'); setOpen(false); }}
            >
              <Users className="w-4 h-4" />
              Equipe
            </button>
          )}
          <div className={`h-px ${isDark ? 'bg-gray-600' : 'bg-gray-200'} my-1`} />
          {/* Settings group */}
          {/* Theme switch */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm">Tema</span>
            <div className="flex items-center gap-1 border border-border">
              <button
                className={`px-2 py-1 text-sm ${!isDark ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => { if (isDark) toggleTheme(); setOpen(false); }}
              >
                Claro
              </button>
              <button
                className={`px-2 py-1 text-sm ${isDark ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => { if (!isDark) toggleTheme(); setOpen(false); }}
              >
                Escuro
              </button>
            </div>
          </div>
          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-primary/10"
            onClick={() => { navigate('/settings'); setOpen(false); }}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>
          <button
            className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-primary/10"
            onClick={() => { navigate('/plans'); setOpen(false); }}
          >
            <CreditCard className="w-4 h-4" />
            Planos
          </button>
          <div className={`h-px ${isDark ? 'bg-gray-600' : 'bg-gray-200'} my-1`} />
          {/* Session */}
          <button
            className="block w-full text-left px-4 py-2 hover:bg-primary/10"
            onClick={() => { logout(); setOpen(false); }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
