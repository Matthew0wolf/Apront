import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mail, UserCheck, UserX, Settings, Crown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const TeamView = ({ currentProject }) => {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');

  const teamMembers = [
    {
      id: 1,
      name: 'João Silva',
      email: 'joao@exemplo.com',
      role: 'operator',
      status: 'active',
      joinedAt: '2024-01-15',
      lastActive: '2 horas atrás',
      avatar: 'JS'
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria@exemplo.com',
      role: 'presenter',
      status: 'active',
      joinedAt: '2024-01-18',
      lastActive: '1 dia atrás',
      avatar: 'MS'
    },
    {
      id: 3,
      name: 'Carlos Oliveira',
      email: 'carlos@exemplo.com',
      role: 'operator',
      status: 'pending',
      joinedAt: '2024-01-20',
      lastActive: 'Nunca',
      avatar: 'CO'
    },
    {
      id: 4,
      name: 'Ana Costa',
      email: 'ana@exemplo.com',
      role: 'presenter',
      status: 'inactive',
      joinedAt: '2024-01-10',
      lastActive: '1 semana atrás',
      avatar: 'AC'
    }
  ];

  const roleLabels = {
    operator: 'Operador',
    presenter: 'Apresentador'
  };

  const statusLabels = {
    active: 'Ativo',
    pending: 'Pendente',
    inactive: 'Inativo'
  };

  const handleInvite = () => {
    if (!inviteEmail) {
      toast({
        title: "Erro",
        description: "Digite um email válido!",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "✅ Convite Enviado",
      description: `Convite enviado para ${inviteEmail}!`,
    });
    setInviteEmail('');
  };

  const handleRoleChange = (memberId, newRole) => {
    toast({
      title: "✅ Função Atualizada",
      description: `Função alterada para ${roleLabels[newRole]}!`,
    });
  };

  const handleRemoveMember = (memberName) => {
    toast({
      title: "🗑️ Membro Removido",
      description: `${memberName} foi removido da equipe.`,
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
          <select className="px-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:border-purple-500/50 focus:outline-none">
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
        
        <div className="space-y-4">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {member.avatar}
                  </div>
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
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    className="px-3 py-1 bg-black/20 border border-white/10 rounded text-white text-sm focus:border-purple-500/50 focus:outline-none"
                  >
                    <option value="presenter">Apresentador</option>
                    <option value="operator">Operador</option>
                  </select>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-red-500/50 text-red-300 hover:bg-red-500/20"
                    onClick={() => handleRemoveMember(member.name)}
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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