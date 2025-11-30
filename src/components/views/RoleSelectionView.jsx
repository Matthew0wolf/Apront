import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Sliders, Monitor, ArrowLeft, AlertTriangle, Theater } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRundown } from '@/contexts/RundownContext.jsx';
import AuthContext from '@/contexts/AuthContext.jsx';

// Componente para padrão decorativo nos cantos (conforme Figma)
const PatternDecorator = () => {
  return (
    <div className="absolute -inset-[10px] pointer-events-none z-0">
      {/* Cantos decorativos conforme design do Figma */}
      <div className="absolute top-0 left-0 w-[77px] h-[77px] border-t border-l border-white/10" />
      <div className="absolute top-0 right-0 w-[77px] h-[77px] border-t border-r border-white/10" />
      <div className="absolute bottom-0 left-0 w-[77px] h-[77px] border-b border-l border-white/10" />
      <div className="absolute bottom-0 right-0 w-[77px] h-[77px] border-b border-r border-white/10" />
    </div>
  );
};

// Ícone do Operador - Carregado do projeto (sem dependência do Figma)
// Ícone salvo localmente em /public/icons/operador-icon.png
// Dimensões exatas do Figma: 149.367px x 149.367px
const OperadorIcon = ({ className }) => {
  return (
    <img 
      src="/icons/operador-icon.png" 
      alt="Operador"
      className={className}
      style={{ width: '149.367px', height: '149.367px' }}
      onError={(e) => {
        // Fallback caso a imagem não carregue
        console.error('Erro ao carregar ícone do Operador');
      }}
    />
  );
};

// Ícone do Apresentador - SVG exato do Figma
const ApresentadorIcon = ({ className }) => {
  return (
    <svg 
      width="150" 
      height="150" 
      viewBox="0 0 150 150" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M149.367 0H0V76.3069H149.367V0Z" fill="#FFFCFD"/>
      <path d="M0 86.0484V106.803H63.6641V123.39H87.6719V106.803H149.367V86.0484H0Z" fill="#FFFCFD"/>
      <path d="M111.967 133.131H40.1505V149.367H111.967V133.131Z" fill="#FFFCFD"/>
    </svg>
  );
};

// Ícone de seta do botão Voltar - SVG exato do Figma (Vector - node-id: 8:2651)
// Triângulo preenchido apontando para a esquerda conforme design do Figma
const VoltarArrowIcon = ({ className, style }) => {
  return (
    <svg 
      width="19" 
      height="22" 
      viewBox="0 0 19 22" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path 
        d="M18.7623 0V21.6022L0 10.8208L18.7623 0Z" 
        fill="#FFFCFC"
      />
    </svg>
  );
};

// Ícone do relógio do botão Modo Ensaio - SVG exato do Figma (Vector - node-id: 268:13)
// Path extraído do SVG fornecido pelo usuário
const PreJogoClockIcon = ({ className }) => {
  return (
    <svg 
      width="22" 
      height="28" 
      viewBox="16 21 22 28" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ícone de relógio - Path exato do SVG fornecido pelo usuário */}
      <path 
        d="M37.4 42.9L30.5 33.5C30.1 33 29.9 32.4 29.9 31.7V27C31 27 31.9 26.1 31.9 25V23C31.9 21.9 31 21 29.9 21H23.9C22.8 21 21.9 21.9 21.9 23V25C21.9 26.1 22.8 27 23.9 27V31.7C23.9 32.3 23.7 32.9 23.3 33.5L16.4 42.9C16.2 43.4 16 44 16 44.7V46C16 47.7 17.3 49 19 49H35C36.7 49 38 47.7 38 46V44.7C38 44 37.8 43.4 37.4 42.9ZM25 34.6C25.6 33.7 26 32.7 26 31.7V27C26 25.9 25.1 25 24 25V23H30V25C28.9 25 28 25.9 28 27V31.7C28 32.8 28.3 33.8 29 34.6L33.6 41H20.4L25 34.6Z" 
        fill="#FFFCFC"
      />
    </svg>
  );
};

// Componente do Botão Modo Ensaio conforme design do Figma (node-id: 268:2)
// Dimensões exatas do Figma: 193px x 47.327px (altura do retângulo)
const ModoEnsaioButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative bg-[#0C0C0C] hover:bg-[#0C0C0C]/80 transition-all duration-300 cursor-pointer group overflow-hidden"
      style={{
        width: '193px',
        height: '47.327px',
      }}
    >
      {/* Borda principal do retângulo - 20% de opacidade */}
      <div className="absolute inset-0 border border-[rgba(255,252,252,0.2)] pointer-events-none group-hover:border-[rgba(255,252,252,0.4)] transition-colors" />
      
      {/* Cantos decorativos (canteiros) - 100% de opacidade - Conforme Vectors do Figma */}
      {/* Canto superior esquerdo */}
      <div className="absolute top-0 left-0 w-[9.822px] h-[8.929px] border-t border-l border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Canto inferior esquerdo */}
      <div className="absolute bottom-0 left-0 w-[8.929px] h-[9.822px] border-b border-l border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Canto superior direito */}
      <div className="absolute top-0 right-0 w-[8.929px] h-[9.822px] border-t border-r border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Canto inferior direito */}
      <div className="absolute bottom-0 right-0 w-[9.822px] h-[8.929px] border-b border-r border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Conteúdo do botão - Ícone à esquerda e texto à direita */}
      <div className="relative z-10 flex items-center justify-start h-full gap-3" style={{ paddingLeft: '12.5px', paddingRight: '16px' }}>
        {/* Ícone do relógio à esquerda - Vector 268:13 - Dimensões do Figma: 22px x 28px */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: '22px', height: '28px' }}>
          <PreJogoClockIcon className="w-full h-full" />
        </div>
        
        {/* Texto "Modo Ensaio" à direita do ícone */}
        <span 
          className="text-[#fffcfc] font-bold whitespace-nowrap"
          style={{
            fontSize: '26.789px',
            lineHeight: '1',
            fontFamily: "'Darker Grotesque', sans-serif",
          }}
        >
          Modo Ensaio
        </span>
      </div>
    </button>
  );
};

// Componente do Botão Voltar conforme design do Figma (Group 9 - node-id: 212:141)
// Dimensões exatas do Figma: 317px x 47.326px
const VoltarButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative bg-[rgba(23,23,23,0.5)] hover:bg-[rgba(23,23,23,0.7)] transition-all duration-300 cursor-pointer group overflow-hidden"
      style={{
        width: '317px',
        height: '47.326px',
        minWidth: '280px',
      }}
    >
      {/* Borda principal do retângulo (Rectangle 34) - 20% de opacidade */}
      <div className="absolute inset-0 border border-[rgba(255,252,252,0.2)] pointer-events-none group-hover:border-[rgba(255,252,252,0.4)] transition-colors" />
      
      {/* Cantos decorativos (canteiros) - 100% de opacidade - Conforme Vectors do Figma */}
      {/* Vector - Canto superior esquerdo: 9.822px x 8.929px */}
      <div className="absolute top-0 left-0 w-[9.822px] h-[8.929px] border-t border-l border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Vector - Canto inferior esquerdo: 8.929px x 9.822px */}
      <div className="absolute bottom-0 left-0 w-[8.929px] h-[9.822px] border-b border-l border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Vector - Canto superior direito: 8.929px x 9.822px */}
      <div className="absolute top-0 right-0 w-[8.929px] h-[9.822px] border-t border-r border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Vector - Canto inferior direito: 9.822px x 8.929px */}
      <div className="absolute bottom-0 right-0 w-[9.822px] h-[8.929px] border-b border-r border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Conteúdo do botão - Conforme Figma */}
      <div className="relative z-10 flex items-center justify-center h-full" style={{ paddingLeft: '12.5px', gap: '8px' }}>
        {/* Ícone de seta - Imagem exata do Figma (Vector 8:2651) */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: '18.762px', height: '21.602px' }}>
          <VoltarArrowIcon 
            className="w-full h-full object-contain" 
            style={{ width: '18.762px', height: '21.602px' }}
          />
        </div>
        
        {/* Texto - Conforme especificação do Figma - 26.789px, Darker Grotesque */}
        <span 
          className="text-[#fffcfc] font-normal whitespace-nowrap"
          style={{
            fontSize: '26.789px',
            lineHeight: '65.186px',
            fontFamily: "'Darker Grotesque', sans-serif",
          }}
        >
          Voltar para <span className="font-bold">Meus Projetos</span>
        </span>
      </div>
    </button>
  );
};

const Card = ({ title, description, iconSrc, iconComponent: IconComponent, onClick, className }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "relative w-full max-w-[488px] h-auto min-h-[320px] sm:min-h-[400px] md:h-[488px] md:w-[488px] overflow-hidden cursor-pointer group",
        "bg-[rgba(23,23,23,0.5)]",
        "transition-all duration-300 hover:bg-[rgba(23,23,23,0.7)]",
        className
      )}
    >
      {/* Borda principal do retângulo - 20% de opacidade */}
      <div className="absolute inset-0 border border-[rgba(255,252,252,0.2)] pointer-events-none" />
      
      {/* Cantos decorativos (canteiros) - 100% de opacidade */}
      {/* Canto superior esquerdo */}
      <div className="absolute top-0 left-0 w-[15px] h-[15px] border-t border-l border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Canto inferior esquerdo (rotacionado 270deg) */}
      <div className="absolute bottom-0 left-0 w-[15px] h-[15px] border-b border-l border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Canto inferior direito (rotacionado 180deg) */}
      <div className="absolute bottom-0 right-0 w-[15px] h-[15px] border-b border-r border-[rgba(255,252,252,1)] pointer-events-none" />
      
      {/* Canto superior direito (rotacionado 90deg) */}
      <div className="absolute top-0 right-0 w-[15px] h-[15px] border-t border-r border-[rgba(255,252,252,1)] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center justify-center text-center h-full p-6 sm:p-8 py-4 sm:py-0">
        <motion.div
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="mb-4 sm:mb-8"
        >
          {IconComponent ? (
            <IconComponent className="w-20 h-20 sm:w-[120px] sm:h-[120px] md:w-[149px] md:h-[149px]" />
          ) : (
            <img 
              src={iconSrc} 
              alt={title}
              className="w-20 h-20 sm:w-[120px] sm:h-[120px] md:w-[149px] md:h-[149px] object-contain"
            />
          )}
        </motion.div>
        <h2 className="text-3xl sm:text-5xl md:text-[66.5px] font-extrabold text-white mb-2 sm:mb-4 leading-tight md:leading-[56.9px]">
          {title}
        </h2>
        <p className="text-base sm:text-xl md:text-[32.7px] font-normal text-white leading-normal md:leading-[35.8px] max-w-full md:max-w-[355px] px-2">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

const RoleSelectionView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { rundowns, loadRundownState } = useRundown();
  const { user } = useContext(AuthContext);

  const project = rundowns.find(p => p.id === projectId);

  // Auto-redirect based on single permission
  useEffect(() => {
    if (!user || !projectId) return;
    const canOperate = user?.role === 'admin' || user?.can_operate;
    const canPresent = user?.role === 'admin' || user?.can_present;
    if (canOperate && !canPresent) {
      loadRundownState(projectId);
      navigate(`/project/${projectId}/operator`, { replace: true });
    } else if (!canOperate && canPresent) {
      loadRundownState(projectId);
      navigate(`/project/${projectId}/presenter`, { replace: true });
    }
  }, [user, projectId, loadRundownState, navigate]);

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
    <div className="min-h-screen w-full bg-[#080808] text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <PatternDecorator />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center relative z-10"
      >
        {/* Header - Conforme Figma */}
        <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12 md:mb-[64px] px-4">
          <p className="text-lg sm:text-2xl md:text-[34.8px] font-medium text-white mb-2 sm:mb-4 leading-tight md:leading-[63.5px]">
            Projeto
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[77.5px] font-bold text-white mb-2 sm:mb-4 leading-tight md:leading-[48.4px] tracking-tight">
            {project.name}
          </h1>
          <p className="text-xl sm:text-3xl md:text-4xl lg:text-[55.7px] font-light text-white leading-tight md:leading-[63.5px]">
            Como você quer entrar?
          </p>
        </motion.div>

        {/* Cards de Seleção - Conforme Figma */}
        <motion.div
          variants={containerVariants}
          className="flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-[56px] mb-8 sm:mb-12 md:mb-[64px] w-full max-w-7xl px-4"
        >
          {/* Mostra opção de Operador apenas se tiver permissão */}
          {(user?.role === 'admin' || user?.can_operate) && (
            <Card
              title="Operador"
              description="Controle total da transmissão, timeline e alertas."
              iconComponent={OperadorIcon}
              onClick={() => handleSelectRole('operator')}
            />
          )}
          
          {/* Mostra opção de Apresentador apenas se tiver permissão */}
          {(user?.role === 'admin' || user?.can_present) && (
            <Card
              title="Apresentador"
              description="Visão simplificada com o evento atual e próximos eventos"
              iconComponent={ApresentadorIcon}
              onClick={() => handleSelectRole('presenter')}
            />
          )}

        </motion.div>

        {/* Botões Voltar e Modo Ensaio - Conforme Figma */}
        <motion.div variants={itemVariants} className="px-4">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <VoltarButton onClick={() => navigate('/projects')} />
            {/* Modo Ensaio disponível para apresentadores */}
            {(user?.role === 'admin' || user?.can_present) && (
              <ModoEnsaioButton onClick={() => {
                loadRundownState(projectId);
                navigate(`/project/${projectId}/practice`);
              }} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RoleSelectionView;