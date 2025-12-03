import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '@/contexts/AuthContext.jsx';
import { ChevronDown, CreditCard, Settings, Users, BarChart3 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { API_BASE_URL } from '@/config/api';

const UserMenu = () => {
  const { user, logout, token } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [planName, setPlanName] = useState('Plano Básico');
  const menuRef = useRef();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  // Buscar plano do usuário
  useEffect(() => {
    if (token && user) {
      fetch(`${API_BASE_URL}/api/plans/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.plan && data.plan.name) {
            // Mapear nomes dos planos para o formato do Figma
            const planMapping = {
              'Professional': 'Plano Pro',
              'Starter': 'Plano Starter',
              'Enterprise': 'Plano Enterprise'
            };
            setPlanName(planMapping[data.plan.name] || data.plan.name);
          }
        })
        .catch(err => console.error('Erro ao buscar plano:', err));
    }
  }, [token, user]);

  if (!user) return null;

  return (
    <div className="relative flex items-center select-none" style={{ zIndex: 1001 }} onBlur={(e) => {
      // Fecha menu ao perder foco (clique fora)
      if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
    }}>
      {/* Container do perfil - Estilo com listras */}
      <button
        className="relative h-[44px] px-3 flex items-center gap-2 transition overflow-hidden cursor-pointer"
        style={{
          backgroundColor: isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C'
        }}
        onClick={() => setOpen((v) => !v)}
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
        
        {/* Conteúdo do botão */}
        <div className="relative z-10 flex items-center gap-2">
          <img
            src={user.avatar ? `${API_BASE_URL}/api/user/avatar/${user.avatar}?t=${Date.now()}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&rounded=false`}
            alt="avatar"
            className="w-8 h-8 object-cover"
            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&rounded=false`; }}
          />
          <div className="flex flex-col items-start">
            <span className="font-bold text-lg leading-none" style={{ color: isLight ? '#080808' : '#ffffff' }}>{user.name}</span>
            <span className="font-medium text-xs leading-[1.105]" style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }}>{planName}</span>
          </div>
          <ChevronDown className="w-3 h-3 ml-1" style={{ color: isLight ? '#080808' : '#ffffff' }} />
        </div>
      </button>
      {open && (
        <div 
          ref={menuRef} 
          className={`absolute right-0 top-full mt-2 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} text-foreground rounded shadow-lg min-w-[232px] overflow-hidden`}
          style={{ zIndex: 1000 }}
        >
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
