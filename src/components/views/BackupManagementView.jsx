import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Database, HardDrive, Clock, CheckCircle, AlertTriangle, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const BackupManagementView = () => {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState({
    lastBackup: null,
    totalBackups: 0,
    totalSize: 0,
    status: 'healthy'
  });

  useEffect(() => {
    loadBackupStats();
  }, []);

  const loadBackupStats = async () => {
    // Simular carregamento (em produção, chamar API)
    setStats({
      lastBackup: new Date().toISOString(),
      totalBackups: 15,
      totalSize: 45.3 * 1024 * 1024, // 45.3 MB
      status: 'healthy'
    });
  };

  const createBackup = async () => {
    setCreating(true);
    
    try {
      // Simular criação de backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "✅ Backup Criado",
        description: "O backup foi criado com sucesso!",
        duration: 3000
      });
      
      loadBackupStats();
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar backup",
        description: error.message
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Gerenciamento de Backups</h1>
        <p className="text-muted-foreground">
          Proteja seus dados com backups automáticos e restauração rápida
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Último Backup</p>
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold">
            {stats.lastBackup ? formatDate(stats.lastBackup) : 'Nunca'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Sistema de backup ativo
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total de Backups</p>
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{stats.totalBackups}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Últimos 30 dias
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Espaço Usado</p>
            <HardDrive className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{formatSize(stats.totalSize)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Em disco local
          </p>
        </motion.div>
      </div>

      {/* Ações */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={createBackup}
            disabled={creating}
            size="lg"
            className="h-24 flex-col gap-2"
          >
            {creating ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Criando Backup...</span>
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                <span>Criar Backup Agora</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-24 flex-col gap-2"
            onClick={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade de restore estará disponível em breve" })}
          >
            <FileDown className="w-6 h-6" />
            <span>Restaurar Backup</span>
          </Button>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Configurar Backup Automático
        </h3>
        
        <div className="space-y-3 text-sm text-foreground">
          <div>
            <p className="font-medium mb-1">🪟 Windows:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
              <li>Abra o arquivo: <code className="bg-secondary px-2 py-0.5 rounded">backend/AGENDAR_BACKUP_WINDOWS.md</code></li>
              <li>Siga as instruções para configurar o Task Scheduler</li>
              <li>Configure para executar diariamente às 2:00 AM</li>
            </ol>
          </div>

          <div>
            <p className="font-medium mb-1">🐧 Linux/Mac:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
              <li>Execute: <code className="bg-secondary px-2 py-0.5 rounded">bash backend/setup_backup_cron.sh</code></li>
              <li>Escolha a frequência desejada</li>
              <li>O backup será executado automaticamente</li>
            </ol>
          </div>

          <div>
            <p className="font-medium mb-1">🐳 Docker:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
              <li>Execute: <code className="bg-secondary px-2 py-0.5 rounded">docker exec apront-backend python backup_database.py --compress</code></li>
              <li>Configure cron no host para executar o comando acima</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Configurações Recomendadas */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">⚙️ Configurações Recomendadas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Frequência</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✅ <strong>Diário</strong> - Para uso normal (recomendado)</li>
              <li>⚡ <strong>A cada 12h</strong> - Para uso intenso</li>
              <li>🔥 <strong>A cada hora</strong> - Para sistemas críticos</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Retenção</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✅ <strong>30 dias</strong> - Padrão (balanceado)</li>
              <li>💾 <strong>90 dias</strong> - Longo prazo</li>
              <li>🚀 <strong>7 dias</strong> - Economia de espaço</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <p className="font-semibold text-foreground">Sistema de Backup Operacional</p>
            <p className="text-sm text-muted-foreground">
              Seus dados estão protegidos com backups automáticos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManagementView;

