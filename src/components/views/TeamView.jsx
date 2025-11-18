import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mail, UserCheck, UserX, Settings, Crown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useApi } from '@/hooks/useApi';
import { API_BASE_URL } from '@/config/api';

const TeamView = ({ currentProject }) => {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const { token, login, user, refreshUserData } = useContext(AuthContext);
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
    // Atualiza localmente para resposta rápida
    setTeamMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, [permission]: value } : member
      )
    );
    
    try {
      // Persiste no back-end
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
      
      // Se for o próprio usuário, atualiza os dados no contexto imediatamente
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
      // Reverte a mudança local em caso de erro
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
    // Descobre o membro pelo nome ou id
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Equipe</h1>
          <p className="text-gray-400">
            Gerencie membros e permissões
            {currentProject && (
              <span className="text-purple-300"> • Projeto: {currentProject.name}</span>
            )}
          </p>
        </div>
      </div>

      {!currentProject && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-300">
            ⚠️ Selecione um projeto para gerenciar a equipe específica
          </p>
        </div>
      )}

      {/* Invite Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Convidar Novo Membro</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Digite o email do membro..."
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500/50 focus:outline-none"
            />
          </div>
          <select
            className="px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
          >
            <option value="presenter">Apresentador</option>
            <option value="operator">Operador</option>
          </select>
          <Button 
            onClick={handleInvite}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Mail className="w-4 h-4 mr-2" />
            Convidar
          </Button>
        </div>
      </motion.div>

      {/* Team Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Membros da Equipe</h2>
        {loading ? (
          <div className="text-gray-300">Carregando membros...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <div className="text-gray-400">Nenhum membro encontrado.</div>
            ) : (
              teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-black/30 border border-white/10 rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <img
                        src={member.avatar ? `${API_BASE_URL}/api/user/avatar/${member.avatar}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&rounded=true`}
                        alt={`Avatar de ${member.name}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                      />
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-white">{member.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            member.role === 'operator' 
                              ? 'bg-blue-500/20 text-blue-300' 
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {member.role === 'operator' ? <Settings className="w-3 h-3 inline mr-1" /> : <Eye className="w-3 h-3 inline mr-1" />}
                            {roleLabels[member.role]}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            member.status === 'active' ? 'bg-green-500/20 text-green-300' :
                            member.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {statusLabels[member.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{member.email}</p>
                        <p className="text-xs text-gray-500">
                          Entrou em {new Date(member.joinedAt).toLocaleDateString('pt-BR')} • 
                          Último acesso: {member.lastActive}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Não permite alterar permissões do próprio admin */}
                      {member.id !== user?.id && (
                        <>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400">Operador:</label>
                            <input
                              type="checkbox"
                              checked={member.can_operate || false}
                              onChange={(e) => handlePermissionChange(member.id, 'can_operate', e.target.checked)}
                              className="w-4 h-4 text-purple-500 bg-black/20 border-white/10 rounded focus:ring-purple-500"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-400">Apresentador:</label>
                            <input
                              type="checkbox"
                              checked={member.can_present || false}
                              onChange={(e) => handlePermissionChange(member.id, 'can_present', e.target.checked)}
                              className="w-4 h-4 text-purple-500 bg-black/20 border-white/10 rounded focus:ring-purple-500"
                            />
                          </div>
                        </>
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
                </motion.div>
              ))
            )}
          </div>
        )}
      </motion.div>

      {/* Role Descriptions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 gap-6"
      >
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Operador</h3>
          </div>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Controla o rundown e cronômetro</li>
            <li>• Pode avançar itens manualmente</li>
            <li>• Acesso completo aos controles</li>
            <li>• Gerencia alertas e notificações</li>
            <li>• Pode editar o projeto</li>
          </ul>
        </div>
        
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Apresentador</h3>
          </div>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Visualiza alertas em tempo real</li>
            <li>• Recebe notificações de timing</li>
            <li>• Interface simplificada</li>
            <li>• Foco na apresentação</li>
            <li>• Somente leitura</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default TeamView;