import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  FolderOpen, 
  Activity, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AuthContext from '@/contexts/AuthContext.jsx';

const AnalyticsView = () => {
  const { token, user } = useContext(AuthContext);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endpoint = getAnalyticsEndpoint();
      const response = await fetch(`http://localhost:5001/api/analytics${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        throw new Error('Erro ao carregar analytics');
      }
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os dados de analytics.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAnalyticsEndpoint = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'operator':
        return '/operator/dashboard';
      case 'presenter':
        return '/presenter/dashboard';
      default:
        return '/admin/dashboard';
    }
  };

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'admin':
        return 'Dashboard Administrativo';
      case 'operator':
        return 'Dashboard do Operador';
      case 'presenter':
        return 'Dashboard do Apresentador';
      default:
        return 'Dashboard';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum dado de analytics disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{getRoleTitle()}</h1>
              <p className="text-muted-foreground mt-2">
                Bem-vindo, {analyticsData.user_info?.name || user?.name}
              </p>
            </div>
            <Button onClick={fetchAnalytics} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trends'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tendências
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Performance
            </button>
          </div>
        </motion.div>

        {/* Content based on role */}
        {user?.role === 'admin' && <AdminDashboard data={analyticsData} activeTab={activeTab} />}
        {user?.role === 'operator' && <OperatorDashboard data={analyticsData} activeTab={activeTab} />}
        {user?.role === 'presenter' && <PresenterDashboard data={analyticsData} activeTab={activeTab} />}
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ data, activeTab }) => {
  if (activeTab === 'overview') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Usuários"
          value={data.overview.total_users}
          icon={Users}
          color="blue"
          subtitle={`${data.overview.plan_limits.current_users}/${data.overview.plan_limits.max_users} do plano`}
        />
        <MetricCard
          title="Rundowns Ativos"
          value={data.overview.active_rundowns}
          icon={FolderOpen}
          color="green"
          subtitle={`${data.overview.total_rundowns} total`}
        />
        <MetricCard
          title="Uso Recente"
          value={data.overview.recent_usage}
          icon={Activity}
          color="purple"
          subtitle="Últimos 30 dias"
        />
        <MetricCard
          title="Status do Plano"
          value={data.company_info.plan}
          icon={Award}
          color="orange"
          subtitle={data.company_info.status}
        />
      </div>
    );
  }

  if (activeTab === 'trends') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={data.usage_trend} title="Uso por Dia" />
        <TopUsers data={data.top_users} title="Usuários Mais Ativos" />
      </div>
    );
  }

  if (activeTab === 'performance') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Limites do Plano</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Usuários</span>
                  <span>{data.overview.plan_limits.current_users}/{data.overview.plan_limits.max_users}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(data.overview.plan_limits.current_users / data.overview.plan_limits.max_users) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Rundowns</span>
                  <span>{data.overview.plan_limits.current_rundowns}/{data.overview.plan_limits.max_rundowns}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(data.overview.plan_limits.current_rundowns / data.overview.plan_limits.max_rundowns) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Operator Dashboard Component
const OperatorDashboard = ({ data, activeTab }) => {
  if (activeTab === 'overview') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Operações"
          value={data.overview.total_operations}
          icon={Activity}
          color="blue"
          subtitle="Últimos 30 dias"
        />
        <MetricCard
          title="Rundowns Operados"
          value={data.overview.operated_rundowns}
          icon={FolderOpen}
          color="green"
          subtitle="Este mês"
        />
        <MetricCard
          title="Tempo Médio"
          value={`${Math.round(data.overview.avg_operation_time)}min`}
          icon={Clock}
          color="purple"
          subtitle="Por operação"
        />
        <MetricCard
          title="Score de Eficiência"
          value={`${Math.round(data.overview.efficiency_score)}%`}
          icon={Target}
          color="orange"
          subtitle="Baseado em atividade"
        />
      </div>
    );
  }

  if (activeTab === 'trends') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={data.efficiency_trend} title="Eficiência por Dia" />
        <TopRundowns data={data.top_rundowns} title="Rundowns Mais Operados" />
      </div>
    );
  }

  return null;
};

// Presenter Dashboard Component
const PresenterDashboard = ({ data, activeTab }) => {
  if (activeTab === 'overview') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Sessões de Apresentação"
          value={data.overview.total_sessions}
          icon={Activity}
          color="blue"
          subtitle="Últimos 30 dias"
        />
        <MetricCard
          title="Tempo Total"
          value={`${Math.round(data.overview.total_time)}h`}
          icon={Clock}
          color="green"
          subtitle="Tempo de apresentação"
        />
        <MetricCard
          title="Rundowns Apresentados"
          value={data.overview.presented_rundowns}
          icon={FolderOpen}
          color="purple"
          subtitle="Este mês"
        />
        <MetricCard
          title="Score de Consistência"
          value={`${Math.round(data.overview.consistency_score)}%`}
          icon={CheckCircle}
          color="orange"
          subtitle="Baseado em frequência"
        />
      </div>
    );
  }

  if (activeTab === 'trends') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={data.activity_trend} title="Atividade por Dia" />
        <TopRundowns data={data.top_rundowns} title="Rundowns Mais Apresentados" />
      </div>
    );
  }

  if (activeTab === 'performance') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Metas Pessoais</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Sessões</span>
                  <span>{data.personal_goals.current_sessions}/{data.personal_goals.target_sessions}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(data.personal_goals.current_sessions / data.personal_goals.target_sessions) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Tempo (horas)</span>
                  <span>{Math.round(data.personal_goals.current_time)}/{data.personal_goals.target_time}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(data.personal_goals.current_time / data.personal_goals.target_time) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Reusable Components
const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-500/10',
    green: 'text-green-500 bg-green-500/10',
    purple: 'text-purple-500 bg-purple-500/10',
    orange: 'text-orange-500 bg-orange-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

const TrendChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.count || d.operations || d.presentations));
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-end justify-between h-32 space-x-2">
        {data.map((item, index) => {
          const value = item.count || item.operations || item.presentations || 0;
          const height = (value / maxValue) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="bg-primary rounded-t w-full transition-all duration-300 hover:bg-primary/80"
                style={{ height: `${height}%` }}
              ></div>
              <span className="text-xs text-muted-foreground mt-2">
                {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const TopUsers = ({ data, title }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-xl border border-border p-6"
  >
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map((user, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{index + 1}</span>
            </div>
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          <span className="text-sm text-muted-foreground">{user.activity} ações</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const TopRundowns = ({ data, title }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-xl border border-border p-6"
  >
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map((rundown, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">{index + 1}</span>
            </div>
            <span className="text-sm font-medium">{rundown.name}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {rundown.operations || rundown.presentations} vezes
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

export default AnalyticsView;

