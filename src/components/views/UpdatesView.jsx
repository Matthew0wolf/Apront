import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const UpdatesView = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-6 py-6 sm:py-12 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="bg-[#e71d36] rounded-xl p-6 sm:p-8 text-white mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Versão 1.0 Lançada!
            </h1>
            <p className="text-lg sm:text-xl opacity-90">
              Confira todas as atualizações e melhorias da Apront 1.0
            </p>
          </div>
        </motion.div>

        {/* Conteúdo Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6 sm:p-8"
        >
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">
              Página de Atualizações
            </h2>
            <p className="text-muted-foreground mb-6">
              Esta página será desenvolvida em breve com todas as informações sobre as atualizações da versão 1.0.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar para o Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UpdatesView;

