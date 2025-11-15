import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, User, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRundown } from '@/contexts/RundownContext.jsx';

const MouseGlowEffect = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition duration-300"
      style={{
        background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(132, 94, 247, 0.1), transparent 80%)`,
      }}
    />
  );
};

const Card = ({ title, description, icon: Icon, onClick, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ scale: 1.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={cn(
        "relative w-96 h-80 p-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer group",
        "transition-all duration-300 hover:border-primary/50 hover:bg-white/10",
        className
      )}
    >
      <motion.div
        className="absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(132, 94, 247, 0.15), transparent 80%)`,
        }}
      />
      <div className="relative z-10 flex flex-col items-center text-center h-full">
        <motion.div
          animate={{ scale: isHovered ? 1.1 : 1, y: isHovered ? -10 : 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon className="w-20 h-20 text-primary mb-6" />
        </motion.div>
        <h2 className="text-3xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground flex-grow">{description}</p>
      </div>
    </motion.div>
  );
};

const RoleSelectionView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { rundowns, loadRundownState } = useRundown();

  const project = rundowns.find(p => p.id === projectId);

  const handleSelectRole = (role) => {
    loadRundownState(projectId);
    if (role === 'operator') {
      navigate(`/project/${projectId}/operator`);
    } else {
      navigate(`/project/${projectId}/presenter`);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex text-foreground items-center justify-center">
        <div className="flex flex-col items-center justify-center h-full w-full text-center p-8">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Nenhum projeto selecionado</h2>
          <p className="text-muted-foreground mb-4">Por favor, volte e selecione um projeto.</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Projetos
          </Button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center p-4 overflow-hidden">
      <MouseGlowEffect />
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center"
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <p className="text-lg text-muted-foreground">Projeto</p>
          <h1 className="text-5xl font-bold text-foreground tracking-tight">{project.name}</h1>
          <p className="text-2xl text-muted-foreground mt-2">Como você quer entrar?</p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="flex flex-col md:flex-row gap-8"
        >
          <Card
            title="Operador"
            description="Controle total da transmissão, timeline e alertas."
            icon={Monitor}
            onClick={() => handleSelectRole('operator')}
          />
          <Card
            title="Apresentador"
            description="Visão simplificada com o item atual e próximos eventos."
            icon={User}
            onClick={() => handleSelectRole('presenter')}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="mt-16">
          <Button onClick={() => navigate('/projects')} variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Projetos
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RoleSelectionView;