import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mail, UserCheck, UserX, Settings, Crown, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { useApi } from '@/hooks/useApi';
import { API_BASE_URL } from '@/config/api';

// Componente StyledCard seguindo o padrão do sistema
const StyledCard = ({ children, className = '', onClick, isLight }) => {
  const cardClass = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      className={`relative overflow-hidden transition-all ${cardClass} ${className}`}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.7)' : '#171717';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C';
        }
      }}
      style={{
        backgroundColor: isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C'
      }}
    >
      {/* Borda principal com 20% de opacidade */}
      <div 
        className="absolute inset-0 border pointer-events-none transition-colors" 
        style={{ 
          borderColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)'
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.4)' : 'rgba(255, 255, 255, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.target.style.borderColor = isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)';
          }
        }}
      />
      
      {/* Cantos decorativos - 100% de opacidade */}
      <div 
        className="absolute top-0 left-0 w-[9.822px] h-[8.929px] border-t border-l pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[8.929px] h-[9.822px] border-b border-l pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
      />
      <div 
        className="absolute top-0 right-0 w-[8.929px] h-[9.822px] border-t border-r pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
      />
      <div 
        className="absolute bottom-0 right-0 w-[9.822px] h-[8.929px] border-b border-r pointer-events-none" 
        style={{ borderColor: isLight ? 'rgba(8,8,8,1)' : 'rgba(255, 255, 255, 1)' }}
      />
      
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const TeamView = ({ currentProject }) => {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const { token, login, user, refreshUserData } = useContext(AuthContext);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { apiCall } = useApi();

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      console.log('❌ TeamView: Token não disponível');
      setError('Token não disponível');
      setLoading(false);
      return;
    }
    
    const fetchTeamData = async () => {
      try {
        console.log('🔑 TeamView: Fazendo requisição...');
        const response = await apiCall(`${API_BASE_URL}/api/team`);
        
        console.log('📡 TeamView: Resposta da API:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ TeamView: Erro na resposta:', errorText);
          throw new Error(`Erro ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ TeamView: Dados recebidos:', data);
        setTeamMembers(data.team || []);
        setLoading(false);
      } catch (err) {
        console.error('❌ TeamView: Erro na requisição:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [token, apiCall]);

  const roleLabels = {
    admin: 'Administrador',
    operator: 'Operador',
    presenter: 'Apresentador'
  };

  const statusLabels = {
    active: 'Ativo',
    pending: 'Pendente',
    inactive: 'Inativo'
  };

  const [inviteRole, setInviteRole] = useState('presenter');
  
  const handleInvite = async () => {
    if (!inviteEmail) {
      toast({
        title: "Erro",
        description: "Digite um email válido!",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, company_id: null, invited_by: null })
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "✅ Convite Enviado",
          description: `Convite enviado para ${inviteEmail}! Peça para o usuário acessar a tela de Aceitar Convite e colar o token recebido por e-mail.`,
        });
        setInviteEmail('');
      } else {
        toast({
          title: "Erro ao enviar convite",
          description: data.error || 'Não foi possível enviar o convite.',
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

  const handlePermissionChange = async (memberId, permission, value) => {
    setTeamMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, [permission]: value } : member
      )
    );
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/team/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [permission]: value })
      });
      
      if (!res.ok) throw new Error('Erro ao atualizar permissão');
      
      const data = await res.json();
      
      if (user && user.id === memberId && refreshUserData) {
        console.log('🔄 Atualizando dados do próprio usuário após mudança de permissão');
        await refreshUserData();
      }
      
      toast({
        title: "✅ Permissão Atualizada",
        description: `Permissão ${permission} alterada com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      setTeamMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, [permission]: !value } : member
        )
      );
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a permissão no servidor.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = (memberNameOrId) => {
    const member = teamMembers.find(m => m.name === memberNameOrId || m.id === memberNameOrId);
    if (!member) return;
    fetch(`${API_BASE_URL}/api/team/${member.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao remover membro');
        return res.json();
      })
      .then(() => {
        setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
        toast({
          title: "🗑️ Membro Removido",
          description: `${member.name} foi removido da equipe.`,
        });
      })
      .catch(() => {
        toast({
          title: "Erro",
          description: "Não foi possível remover o membro no servidor.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Darker Grotesque', sans-serif" }}>
      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 
              className="text-3xl sm:text-[48px] font-extrabold mb-2"
              style={{ color: isLight ? '#080808' : '#ffffff' }}
            >
              Equipe
            </h1>
            <p 
              className="text-base sm:text-lg"
              style={{ color: isLight ? '#666666' : '#cccccc' }}
            >
              Gerencie membros e permissões
              {currentProject && (
                <span className="ml-2" style={{ color: '#e71d36' }}>
                  • Projeto: {currentProject.name}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Warning sobre projeto */}
        {!currentProject && (
          <StyledCard isLight={isLight} className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p style={{ color: isLight ? '#856404' : '#ffc107' }}>
                Selecione um projeto para gerenciar a equipe específica
              </p>
            </div>
          </StyledCard>
        )}

        {/* Convite Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StyledCard isLight={isLight} className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-6 h-6" style={{ color: '#e71d36' }} />
              <h2 
                className="text-xl sm:text-2xl font-bold"
                style={{ color: isLight ? '#080808' : '#ffffff' }}
              >
                Convidar Novo Membro
              </h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Digite o email do membro..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                className="px-4 py-2 rounded-lg border bg-background"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{
                  color: isLight ? '#080808' : '#ffffff',
                  borderColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255,255,255,0.2)'
                }}
              >
                <option value="presenter">Apresentador</option>
                <option value="operator">Operador</option>
              </select>
              <Button 
                onClick={handleInvite}
                className="bg-[#e71d36] hover:bg-[#c91c2e] text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Convidar
              </Button>
            </div>
          </StyledCard>
        </motion.div>

        {/* Membros da Equipe */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StyledCard isLight={isLight} className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6" style={{ color: '#e71d36' }} />
              <h2 
                className="text-xl sm:text-2xl font-bold"
                style={{ color: isLight ? '#080808' : '#ffffff' }}
              >
                Membros da Equipe
              </h2>
            </div>
            
            {loading ? (
              <div style={{ color: isLight ? '#666666' : '#cccccc' }}>Carregando membros...</div>
            ) : error ? (
              <div style={{ color: '#e71d36' }}>{error}</div>
            ) : (
              <div className="space-y-4">
                {teamMembers.length === 0 ? (
                  <div style={{ color: isLight ? '#666666' : '#cccccc' }}>
                    Nenhum membro encontrado.
                  </div>
                ) : (
                  teamMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <StyledCard 
                        isLight={isLight} 
                        className="p-4 sm:p-6"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <img
                              src={member.avatar ? `${API_BASE_URL}/api/user/avatar/${member.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&rounded=true`}
                              alt={`Avatar de ${member.name}`}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2"
                              style={{ borderColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255,255,255,0.2)' }}
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&rounded=true`;
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 
                                  className="font-bold text-base sm:text-lg"
                                  style={{ color: isLight ? '#080808' : '#ffffff' }}
                                >
                                  {member.name}
                                </h3>
                                <span 
                                  className="px-2 py-1 text-xs rounded-full"
                                  style={{
                                    backgroundColor: member.role === 'admin' 
                                      ? 'rgba(231, 29, 54, 0.2)' 
                                      : member.role === 'operator'
                                      ? 'rgba(59, 130, 246, 0.2)'
                                      : 'rgba(34, 197, 94, 0.2)',
                                    color: member.role === 'admin'
                                      ? '#e71d36'
                                      : member.role === 'operator'
                                      ? '#3b82f6'
                                      : '#22c55e'
                                  }}
                                >
                                  {member.role === 'admin' && <Crown className="w-3 h-3 inline mr-1" />}
                                  {member.role === 'operator' && <Settings className="w-3 h-3 inline mr-1" />}
                                  {member.role === 'presenter' && <Eye className="w-3 h-3 inline mr-1" />}
                                  {roleLabels[member.role]}
                                </span>
                                <span 
                                  className="px-2 py-1 text-xs rounded-full"
                                  style={{
                                    backgroundColor: member.status === 'active' 
                                      ? 'rgba(34, 197, 94, 0.2)'
                                      : member.status === 'pending'
                                      ? 'rgba(251, 191, 36, 0.2)'
                                      : 'rgba(107, 114, 128, 0.2)',
                                    color: member.status === 'active'
                                      ? '#22c55e'
                                      : member.status === 'pending'
                                      ? '#fbbf24'
                                      : '#6b7280'
                                  }}
                                >
                                  {statusLabels[member.status]}
                                </span>
                              </div>
                              <p 
                                className="text-sm mb-1"
                                style={{ color: isLight ? '#666666' : '#cccccc' }}
                              >
                                {member.email}
                              </p>
                              {member.joinedAt && (
                                <p 
                                  className="text-xs"
                                  style={{ color: isLight ? '#999999' : '#888888' }}
                                >
                                  Entrou em {new Date(member.joinedAt).toLocaleDateString('pt-BR')}
                                  {member.lastActive && ` • Último acesso: ${member.lastActive}`}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Controles */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {member.id !== user?.id && (
                              <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex items-center gap-2">
                                  <label 
                                    className="text-xs"
                                    style={{ color: isLight ? '#666666' : '#cccccc' }}
                                  >
                                    Operador:
                                  </label>
                                  <input
                                    type="checkbox"
                                    checked={member.can_operate || false}
                                    onChange={(e) => handlePermissionChange(member.id, 'can_operate', e.target.checked)}
                                    className="w-4 h-4 rounded"
                                    style={{ accentColor: '#e71d36' }}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label 
                                    className="text-xs"
                                    style={{ color: isLight ? '#666666' : '#cccccc' }}
                                  >
                                    Apresentador:
                                  </label>
                                  <input
                                    type="checkbox"
                                    checked={member.can_present || false}
                                    onChange={(e) => handlePermissionChange(member.id, 'can_present', e.target.checked)}
                                    className="w-4 h-4 rounded"
                                    style={{ accentColor: '#e71d36' }}
                                  />
                                </div>
                              </div>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={member.id === user?.id}
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </StyledCard>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </StyledCard>
        </motion.div>

        {/* Descrições de Roles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <StyledCard isLight={isLight} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6" style={{ color: '#3b82f6' }} />
              <h3 
                className="text-lg font-bold"
                style={{ color: isLight ? '#080808' : '#ffffff' }}
              >
                Operador
              </h3>
            </div>
            <ul 
              className="text-sm space-y-2"
              style={{ color: isLight ? '#666666' : '#cccccc' }}
            >
              <li>• Controla o rundown e cronômetro</li>
              <li>• Pode avançar itens manualmente</li>
              <li>• Acesso completo aos controles</li>
              <li>• Gerencia alertas e notificações</li>
              <li>• Pode editar o projeto</li>
            </ul>
          </StyledCard>
          
          <StyledCard isLight={isLight} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6" style={{ color: '#22c55e' }} />
              <h3 
                className="text-lg font-bold"
                style={{ color: isLight ? '#080808' : '#ffffff' }}
              >
                Apresentador
              </h3>
            </div>
            <ul 
              className="text-sm space-y-2"
              style={{ color: isLight ? '#666666' : '#cccccc' }}
            >
              <li>• Visualiza alertas em tempo real</li>
              <li>• Recebe notificações de timing</li>
              <li>• Interface simplificada</li>
              <li>• Foco na apresentação</li>
              <li>• Somente leitura</li>
            </ul>
          </StyledCard>
        </motion.div>
      </div>
    </div>
  );
};

export default TeamView;
