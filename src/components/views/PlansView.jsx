import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown, CreditCard, Users, FileText, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from '@/contexts/AuthContext.jsx';
import { API_BASE_URL } from '@/config/api';

const PlanCard = ({ plan, isCurrent, isPopular, onSelect, loading }) => {
  const features = plan.features || [];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white/5 backdrop-blur-lg border rounded-2xl p-6 shadow-lg transition-all duration-300 ${
        isCurrent 
          ? 'border-green-500/50 bg-green-500/10' 
          : isPopular 
          ? 'border-primary/50 bg-primary/10' 
          : 'border-white/10 hover:border-primary/50'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Star className="w-4 h-4" />
            Mais Popular
          </div>
        </div>
      )}
      
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
            <Check className="w-4 h-4" />
            Plano Atual
          </div>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          {plan.name === 'Starter' && <Zap className="w-6 h-6 text-blue-400 mr-2" />}
          {plan.name === 'Professional' && <Star className="w-6 h-6 text-purple-400 mr-2" />}
          {plan.name === 'Enterprise' && <Crown className="w-6 h-6 text-yellow-400 mr-2" />}
          <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
        </div>
        <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
        <div className="text-4xl font-bold text-white mb-2">
          R$ {plan.price.toFixed(2).replace('.', ',')}
          <span className="text-lg text-gray-400">/mês</span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-sm">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300">Até {plan.max_members} membros</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <FileText className="w-4 h-4 text-green-400" />
          <span className="text-gray-300">Até {plan.max_rundowns} rundowns</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <HardDrive className="w-4 h-4 text-orange-400" />
          <span className="text-gray-300">{plan.max_storage_gb}GB de armazenamento</span>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-gray-300">{feature}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={() => onSelect(plan)}
        disabled={isCurrent || loading}
        className={`w-full ${
          isCurrent 
            ? 'bg-green-500/20 text-green-300 border-green-500/30' 
            : isPopular 
            ? 'bg-primary hover:bg-primary/90' 
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        {isCurrent ? 'Plano Atual' : loading ? 'Processando...' : 'Escolher Plano'}
      </Button>
    </motion.div>
  );
};

const PlansView = () => {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);
  const { token } = useContext(AuthContext);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchPlans();
      fetchCurrentPlan();
      fetchUsageStats();
    }
  }, [token]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/plans`);
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos.",
        variant: "destructive",
      });
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/plans/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentPlan(data.plan);
      }
    } catch (err) {
      console.error('Erro ao buscar plano atual:', err);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/plans/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Usage stats recebidas:', data);
        setUsageStats(data);
      } else {
        console.error('Erro na resposta:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (plan) => {
    setChangingPlan(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/plans/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: plan.id })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: "✅ Plano Alterado",
          description: `Você agora está no plano ${plan.name}!`,
        });
        fetchCurrentPlan();
        fetchUsageStats();
      } else {
        toast({
          title: "Erro",
          description: data.error || 'Não foi possível alterar o plano.',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro de conexão.",
        variant: "destructive",
      });
    } finally {
      setChangingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Escolha seu Plano</h1>
        <p className="text-gray-300 text-lg">
          Selecione o plano ideal para sua equipe e comece a crescer
        </p>
      </div>

      {/* Estatísticas de Uso */}
      {usageStats && (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Uso Atual</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{usageStats.members.current || 0}</div>
              <div className="text-sm text-gray-300">de {usageStats.members.limit || 0} membros</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full" 
                  style={{ width: `${Math.min(usageStats.members.percentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{usageStats.rundowns.current || 0}</div>
              <div className="text-sm text-gray-300">de {usageStats.rundowns.limit || 0} rundowns</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-400 h-2 rounded-full" 
                  style={{ width: `${Math.min(usageStats.rundowns.percentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{usageStats.storage.current || 0}GB</div>
              <div className="text-sm text-gray-300">de {usageStats.storage.limit || 0}GB</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-400 h-2 rounded-full" 
                  style={{ width: `${Math.min(usageStats.storage.percentage || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={currentPlan && currentPlan.name === plan.name}
            isPopular={plan.name === 'Professional'}
            onSelect={handlePlanChange}
            loading={changingPlan}
          />
        ))}
      </div>

      {/* Informações Adicionais */}
      <div className="text-center text-gray-400 text-sm">
        <p>💳 Pagamento seguro • 🔄 Cancele a qualquer momento • 🎯 Suporte 24/7</p>
      </div>
    </div>
  );
};

export default PlansView;
