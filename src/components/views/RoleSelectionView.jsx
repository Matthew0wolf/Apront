import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Sliders, Monitor, ArrowLeft, AlertTriangle, Theater } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRundown } from '@/contexts/RundownContext.jsx';
import AuthContext from '@/contexts/AuthContext.jsx';
import { useTheme } from '@/contexts/ThemeContext.jsx';

// Componente para padrão decorativo nos cantos (conforme Figma)
const PatternDecorator = ({ isLight }) => {
  const borderColor = isLight ? 'rgba(8,8,8,0.05)' : 'rgba(255,255,255,0.1)';
  
  return (
    <div className="absolute -inset-[10px] pointer-events-none z-0">
      {/* Cantos decorativos conforme design do Figma */}
      <div 
        className="absolute top-0 left-0 w-[77px] h-[77px] border-t border-l" 
        style={{ borderColor }}
      />
      <div 
        className="absolute top-0 right-0 w-[77px] h-[77px] border-t border-r" 
        style={{ borderColor }}
      />
      <div 
        className="absolute bottom-0 left-0 w-[77px] h-[77px] border-b border-l" 
        style={{ borderColor }}
      />
      <div 
        className="absolute bottom-0 right-0 w-[77px] h-[77px] border-b border-r" 
        style={{ borderColor }}
      />
    </div>
  );
};

// Componente para linhas decorativas completas (conforme SVG do Figma)
// Baseado no SVG fornecido: retângulo completo com linhas nos 4 lados e cantos decorativos
// FIXAS - não são afetadas pelo zoom do navegador ou do conteúdo
const FrameLinesDecorator = ({ isLight }) => {
  // Dimensões baseadas no SVG fornecido - ajustadas para caber na tela
  const offset = 50; // Offset do retângulo principal (reduzido de 66.5px para 50px)
  const cornerSize = 15; // Tamanho do "+" no canto
  
  // Detecta e compensa o zoom do navegador
  const [zoomCompensation, setZoomCompensation] = useState(1);
  
  useEffect(() => {
    const detectZoom = () => {
      // Cria elemento de teste para medir zoom real do navegador
      const testElement = document.createElement('div');
      testElement.style.cssText = 'position: fixed; width: 100px; height: 100px; visibility: hidden; pointer-events: none; top: 0; left: 0;';
      document.body.appendChild(testElement);
      
      const rect = testElement.getBoundingClientRect();
      const actualWidth = rect.width;
      const expectedWidth = 100;
      
      // Se o navegador faz zoom 2x, um elemento de 100px aparece como 200px
      // Para compensar e manter o tamanho original, preciso aplicar scale(0.5)
      // Então: compensation = expectedWidth / actualWidth
      const compensation = expectedWidth / actualWidth;
      
      document.body.removeChild(testElement);
      setZoomCompensation(compensation || 1);
    };
    
    detectZoom();
    
    // Verifica quando a página é redimensionada
    const handleResize = () => {
      setTimeout(detectZoom, 50);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Verifica periodicamente para capturar mudanças de zoom
    const interval = setInterval(detectZoom, 150);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, []);
  
  // Cores baseadas no tema
  const lineColor = isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)';
  const cornerLineColor = isLight ? '#080808' : 'white';
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        // Aplica scale inverso para compensar o zoom do navegador
        // Se zoom é 2x (compensation = 0.5), aplica scale(0.5) para voltar ao tamanho original
        transform: `scale(${zoomCompensation})`,
        transformOrigin: '0 0', // Origem no canto superior esquerdo para evitar deslocamento
        willChange: 'auto'
      }}
    >
      {/* Retângulo principal completo - bordas nos 4 lados */}
      {/* Borda superior */}
      <div className="absolute" style={{ top: `${offset}px`, left: `${offset}px`, right: `${offset}px`, height: '1px', backgroundColor: lineColor }} />
      {/* Borda inferior */}
      <div className="absolute" style={{ bottom: `${offset}px`, left: `${offset}px`, right: `${offset}px`, height: '1px', backgroundColor: lineColor }} />
      {/* Borda esquerda */}
      <div className="absolute" style={{ top: `${offset}px`, bottom: `${offset}px`, left: `${offset}px`, width: '1px', backgroundColor: lineColor }} />
      {/* Borda direita */}
      <div className="absolute" style={{ top: `${offset}px`, bottom: `${offset}px`, right: `${offset}px`, width: '1px', backgroundColor: lineColor }} />
      
      {/* CANTO SUPERIOR ESQUERDO - Forma "+" (cruz) */}
      {/* Linha horizontal estendendo para fora (esquerda) */}
      <div className="absolute" style={{ top: `${offset}px`, left: '0', width: `${offset + 1}px`, height: '1px', backgroundColor: lineColor }} />
      {/* Linha vertical estendendo para fora (cima) */}
      <div className="absolute" style={{ top: '0', left: `${offset}px`, width: '1px', height: `${offset + 1}px`, backgroundColor: lineColor }} />
      {/* Linha horizontal do "+" (parte interna) */}
      <div className="absolute" style={{ top: `${offset}px`, left: `${offset - cornerSize/2}px`, width: `${cornerSize}px`, height: '1px', backgroundColor: cornerLineColor }} />
      {/* Linha vertical do "+" (parte interna) */}
      <div className="absolute" style={{ top: `${offset - cornerSize/2}px`, left: `${offset}px`, width: '1px', height: `${cornerSize}px`, backgroundColor: cornerLineColor }} />
      
      {/* CANTO SUPERIOR DIREITO - Forma "+" (cruz) */}
      {/* Linha horizontal estendendo para fora (direita) */}
      <div className="absolute" style={{ top: `${offset}px`, right: '0', width: `${offset + 1}px`, height: '1px', backgroundColor: lineColor }} />
      {/* Linha vertical estendendo para fora (cima) */}
      <div className="absolute" style={{ top: '0', right: `${offset}px`, width: '1px', height: `${offset + 1}px`, backgroundColor: lineColor }} />
      {/* Linha horizontal do "+" (parte interna) */}
      <div className="absolute" style={{ top: `${offset}px`, right: `${offset - cornerSize/2}px`, width: `${cornerSize}px`, height: '1px', backgroundColor: cornerLineColor }} />
      {/* Linha vertical do "+" (parte interna) */}
      <div className="absolute" style={{ top: `${offset - cornerSize/2}px`, right: `${offset}px`, width: '1px', height: `${cornerSize}px`, backgroundColor: cornerLineColor }} />
      
      {/* CANTO INFERIOR ESQUERDO - Forma "+" (cruz) */}
      {/* Linha horizontal estendendo para fora (esquerda) */}
      <div className="absolute" style={{ bottom: `${offset}px`, left: '0', width: `${offset + 1}px`, height: '1px', backgroundColor: lineColor }} />
      {/* Linha vertical estendendo para fora (baixo) */}
      <div className="absolute" style={{ bottom: '0', left: `${offset}px`, width: '1px', height: `${offset + 1}px`, backgroundColor: lineColor }} />
      {/* Linha horizontal do "+" (parte interna) */}
      <div className="absolute" style={{ bottom: `${offset}px`, left: `${offset - cornerSize/2}px`, width: `${cornerSize}px`, height: '1px', backgroundColor: cornerLineColor }} />
      {/* Linha vertical do "+" (parte interna) */}
      <div className="absolute" style={{ bottom: `${offset - cornerSize/2}px`, left: `${offset}px`, width: '1px', height: `${cornerSize}px`, backgroundColor: cornerLineColor }} />
      
      {/* CANTO INFERIOR DIREITO - Forma "+" (cruz) */}
      {/* Linha horizontal estendendo para fora (direita) */}
      <div className="absolute" style={{ bottom: `${offset}px`, right: '0', width: `${offset + 1}px`, height: '1px', backgroundColor: lineColor }} />
      {/* Linha vertical estendendo para fora (baixo) */}
      <div className="absolute" style={{ bottom: '0', right: `${offset}px`, width: '1px', height: `${offset + 1}px`, backgroundColor: lineColor }} />
      {/* Linha horizontal do "+" (parte interna) */}
      <div className="absolute" style={{ bottom: `${offset}px`, right: `${offset - cornerSize/2}px`, width: `${cornerSize}px`, height: '1px', backgroundColor: cornerLineColor }} />
      {/* Linha vertical do "+" (parte interna) */}
      <div className="absolute" style={{ bottom: `${offset - cornerSize/2}px`, right: `${offset}px`, width: '1px', height: `${cornerSize}px`, backgroundColor: cornerLineColor }} />
    </div>
  );
};

// Ícone do Operador - Carregado do projeto (sem dependência do Figma)
// Ícone salvo localmente em /public/icons/operador-icon.png
const OperadorIcon = ({ className, isLight }) => {
  return (
    <img 
      src="/icons/operador-icon.png" 
      alt="Operador"
      className={className}
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain',
        // No modo claro, aplica filtro para garantir que o ícone fique preto
        filter: isLight ? 'brightness(0) saturate(100%)' : 'none'
      }}
      onError={(e) => {
        // Fallback caso a imagem não carregue
        console.error('Erro ao carregar ícone do Operador');
      }}
    />
  );
};

// Ícone do Apresentador - SVG exato do Figma
const ApresentadorIcon = ({ className, isLight }) => {
  const fillColor = isLight ? '#080808' : '#FFFCFD';
  
  return (
    <svg 
      viewBox="0 0 150 150" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: '100%', height: '100%' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M149.367 0H0V76.3069H149.367V0Z" fill={fillColor}/>
      <path d="M0 86.0484V106.803H63.6641V123.39H87.6719V106.803H149.367V86.0484H0Z" fill={fillColor}/>
      <path d="M111.967 133.131H40.1505V149.367H111.967V133.131Z" fill={fillColor}/>
    </svg>
  );
};

// Ícone de seta do botão Voltar - SVG exato do Figma (Vector - node-id: 8:2651)
// Triângulo preenchido apontando para a esquerda conforme design do Figma
const VoltarArrowIcon = ({ className, style, isLight }) => {
  const fillColor = isLight ? '#080808' : '#FFFCFC';
  
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
        fill={fillColor}
      />
    </svg>
  );
};

// Ícone do relógio do botão Modo Ensaio - SVG exato do Figma (Vector - node-id: 268:13)
// Path extraído do SVG fornecido pelo usuário
const PreJogoClockIcon = ({ className, isLight }) => {
  const fillColor = isLight ? '#080808' : '#FFFCFC';
  
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
        fill={fillColor}
      />
    </svg>
  );
};

// Componente do Botão Modo Ensaio conforme design do Figma (node-id: 268:2)
// Dimensões exatas do Figma: 193px x 47.327px (altura do retângulo)
const ModoEnsaioButton = ({ onClick, isLight }) => {
  const bgColor = isLight ? 'rgba(229,229,229,0.5)' : '#0C0C0C';
  const bgHover = isLight ? 'rgba(229,229,229,0.7)' : '#0C0C0C';
  const borderColor = isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255,252,252,0.2)';
  const borderHover = isLight ? 'rgba(8,8,8,0.4)' : 'rgba(255,252,252,0.4)';
  const cornerColor = isLight ? 'rgba(8,8,8,1)' : 'rgba(255,252,252,1)';
  const textColor = isLight ? '#080808' : '#fffcfc';
  
  return (
    <button
      onClick={onClick}
      className="relative hover:opacity-80 transition-all duration-300 cursor-pointer group overflow-hidden"
      style={{
        width: '193px',
        height: '47.327px',
        backgroundColor: bgColor
      }}
    >
      {/* Borda principal do retângulo - 20% de opacidade */}
      <div 
        className="absolute inset-0 border pointer-events-none transition-colors" 
        style={{ borderColor }}
        onMouseEnter={(e) => e.target.style.borderColor = borderHover}
        onMouseLeave={(e) => e.target.style.borderColor = borderColor}
      />
      
      {/* Cantos decorativos (canteiros) - 100% de opacidade - Conforme Vectors do Figma */}
      {/* Canto superior esquerdo */}
      <div 
        className="absolute top-0 left-0 w-[9.822px] h-[8.929px] border-t border-l pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Canto inferior esquerdo */}
      <div 
        className="absolute bottom-0 left-0 w-[8.929px] h-[9.822px] border-b border-l pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Canto superior direito */}
      <div 
        className="absolute top-0 right-0 w-[8.929px] h-[9.822px] border-t border-r pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Canto inferior direito */}
      <div 
        className="absolute bottom-0 right-0 w-[9.822px] h-[8.929px] border-b border-r pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Conteúdo do botão - Ícone à esquerda e texto à direita */}
      <div className="relative z-10 flex items-center justify-start h-full gap-3" style={{ paddingLeft: '12.5px', paddingRight: '16px' }}>
        {/* Ícone do relógio à esquerda - Vector 268:13 - Dimensões do Figma: 22px x 28px */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: '22px', height: '28px' }}>
          <PreJogoClockIcon className="w-full h-full" isLight={isLight} />
        </div>
        
        {/* Texto "Modo Ensaio" à direita do ícone */}
        <span 
          className="font-bold whitespace-nowrap"
          style={{
            fontSize: '26.789px',
            lineHeight: '1',
            fontFamily: "'Darker Grotesque', sans-serif",
            color: textColor
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
const VoltarButton = ({ onClick, isLight }) => {
  const bgColor = isLight ? 'rgba(229,229,229,0.5)' : 'rgba(23,23,23,0.5)';
  const bgHover = isLight ? 'rgba(229,229,229,0.7)' : 'rgba(23,23,23,0.7)';
  const borderColor = isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255,252,252,0.2)';
  const borderHover = isLight ? 'rgba(8,8,8,0.4)' : 'rgba(255,252,252,0.4)';
  const cornerColor = isLight ? 'rgba(8,8,8,1)' : 'rgba(255,252,252,1)';
  const textColor = isLight ? '#080808' : '#fffcfc';
  
  return (
    <button
      onClick={onClick}
      className="relative hover:opacity-80 transition-all duration-300 cursor-pointer group overflow-hidden"
      style={{
        width: '317px',
        height: '47.326px',
        minWidth: '280px',
        backgroundColor: bgColor
      }}
    >
      {/* Borda principal do retângulo (Rectangle 34) - 20% de opacidade */}
      <div 
        className="absolute inset-0 border pointer-events-none transition-colors" 
        style={{ borderColor: borderColor }}
        onMouseEnter={(e) => e.target.style.borderColor = borderHover}
        onMouseLeave={(e) => e.target.style.borderColor = borderColor}
      />
      
      {/* Cantos decorativos (canteiros) - 100% de opacidade - Conforme Vectors do Figma */}
      {/* Vector - Canto superior esquerdo: 9.822px x 8.929px */}
      <div 
        className="absolute top-0 left-0 w-[9.822px] h-[8.929px] border-t border-l pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Vector - Canto inferior esquerdo: 8.929px x 9.822px */}
      <div 
        className="absolute bottom-0 left-0 w-[8.929px] h-[9.822px] border-b border-l pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Vector - Canto superior direito: 8.929px x 9.822px */}
      <div 
        className="absolute top-0 right-0 w-[8.929px] h-[9.822px] border-t border-r pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Vector - Canto inferior direito: 9.822px x 8.929px */}
      <div 
        className="absolute bottom-0 right-0 w-[9.822px] h-[8.929px] border-b border-r pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Conteúdo do botão - Conforme Figma */}
      <div className="relative z-10 flex items-center justify-center h-full" style={{ paddingLeft: '12.5px', gap: '8px' }}>
        {/* Ícone de seta - Imagem exata do Figma (Vector 8:2651) */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: '18.762px', height: '21.602px' }}>
          <VoltarArrowIcon 
            className="w-full h-full object-contain" 
            style={{ width: '18.762px', height: '21.602px' }}
            isLight={isLight}
          />
        </div>
        
        {/* Texto - Conforme especificação do Figma - 26.789px, Darker Grotesque */}
        <span 
          className="font-normal whitespace-nowrap"
          style={{
            fontSize: '26.789px',
            lineHeight: '65.186px',
            fontFamily: "'Darker Grotesque', sans-serif",
            color: textColor
          }}
        >
          Voltar para <span className="font-bold">Meus Projetos</span>
        </span>
      </div>
    </button>
  );
};

const Card = ({ title, description, iconSrc, iconComponent: IconComponent, onClick, className, isLight }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Cores baseadas no tema
  const cardBg = isLight ? 'rgba(229,229,229,0.5)' : 'rgba(23,23,23,0.5)';
  const cardBgHover = isLight ? 'rgba(229,229,229,0.7)' : 'rgba(23,23,23,0.7)';
  const borderColor = isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255,252,252,0.2)';
  const cornerColor = isLight ? 'rgba(8,8,8,1)' : 'rgba(255,252,252,1)';
  const textColor = isLight ? '#080808' : '#ffffff';

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
        "relative w-full aspect-square overflow-hidden cursor-pointer group",
        "transition-all duration-300",
        className
      )}
      style={{
        // 15% maior que o original: 400px * 1.15 = 460px (reduzido 5% de 480px)
        // Responsivo: menor em mobile/tablet
        width: 'clamp(280px, 90vw, 456px)',
        height: 'clamp(280px, 90vw, 456px)',
        maxWidth: '456px',
        maxHeight: '456px',
        backgroundColor: isHovered ? cardBgHover : cardBg
      }}
    >
      {/* Borda principal do retângulo - 20% de opacidade */}
      <div 
        className="absolute inset-0 border pointer-events-none" 
        style={{ borderColor }}
      />
      
      {/* Cantos decorativos (canteiros) - 100% de opacidade */}
      {/* Canto superior esquerdo */}
      <div 
        className="absolute top-0 left-0 w-[15px] h-[15px] border-t border-l pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Canto inferior esquerdo (rotacionado 270deg) */}
      <div 
        className="absolute bottom-0 left-0 w-[15px] h-[15px] border-b border-l pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Canto inferior direito (rotacionado 180deg) */}
      <div 
        className="absolute bottom-0 right-0 w-[15px] h-[15px] border-b border-r pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      {/* Canto superior direito (rotacionado 90deg) */}
      <div 
        className="absolute top-0 right-0 w-[15px] h-[15px] border-t border-r pointer-events-none" 
        style={{ borderColor: cornerColor }}
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center text-center h-full p-4 sm:p-6 py-3 sm:py-0">
        <motion.div
          animate={{ scale: isHovered ? 1.1 : 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="flex items-center justify-center"
          style={{ 
            width: '120px', 
            height: '120px', 
            minHeight: '120px',
            marginBottom: '39px', // Espaçamento aumentado entre ícone e texto (24px + 15px)
            marginTop: '-10px' // Move o ícone um pouco para cima
          }}
        >
          {IconComponent ? (
            <IconComponent className="w-full h-full" isLight={isLight} />
          ) : (
            <img 
              src={iconSrc} 
              alt={title}
              className="w-full h-full object-contain"
            />
          )}
        </motion.div>
        <h2 
          className="text-2xl sm:text-4xl md:text-[52px] font-extrabold mb-1 sm:mb-2 leading-tight"
          style={{ color: textColor }}
        >
          {title}
        </h2>
        <p 
          className="text-sm sm:text-lg md:text-[26px] font-normal leading-normal max-w-full md:max-w-[320px] px-2"
          style={{
            marginTop: '20px', // Espaçamento aumentado entre título e descrição
            color: textColor
          }}
        >
          {description}
        </p>
      </div>
    </motion.div>
  );
};

const RoleSelectionView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const rundownContext = useRundown();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [scale, setScale] = useState(1);

  // Calcula escala baseada no viewport para manter proporções no zoom out
  useEffect(() => {
    const calculateScale = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      // Base de referência: 1920x1080
      const baseWidth = 1920;
      const baseHeight = 1080;
      
      // Calcula escala baseada na menor dimensão para manter proporção
      const scaleX = viewportWidth / baseWidth;
      const scaleY = viewportHeight / baseHeight;
      const newScale = Math.min(scaleX, scaleY, 1); // Não aumenta além de 1
      
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  // Verificação de segurança: aguarda o contexto estar pronto
  if (!rundownContext) {
    return (
      <div className="h-screen w-full bg-[#080808] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  const { rundowns = [], loadRundownState } = rundownContext;
  const project = rundowns.find(p => p.id === projectId);
  
  // Verifica se o projeto está ao vivo - apenas pelo status do projeto
  // Remove espaços extras e converte para minúsculas para comparação
  const projectStatus = project?.status ? project.status.trim().toLowerCase() : '';
  const isLive = project && (
    projectStatus === 'ao vivo' || 
    projectStatus === 'live'
  );

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

  // Cores baseadas no tema para o container principal
  const bgColor = isLight ? '#fffcfc' : '#080808';
  const textColor = isLight ? '#080808' : '#ffffff';
  const patternBg = isLight ? '#dddddd' : '#080808';
  
  return (
    <div 
      className="h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden relative"
      style={{ 
        backgroundColor: bgColor,
        position: 'relative'
      }}
    >
      {/* Background pattern layer - conforme Figma */}
      {isLight && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: patternBg,
            opacity: 1,
            zIndex: 0
          }}
        />
      )}
      
      {/* Pattern de linhas diagonais em -45 graus (invertido horizontalmente) - apenas no modo escuro */}
      {!isLight && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 
              'repeating-linear-gradient(-45deg, transparent 0px, transparent 8px, rgba(255, 255, 255, 0.04) 8px, rgba(255, 255, 255, 0.04) 10px)',
            backgroundSize: '2299px 2299px',
            zIndex: 0
          }}
        />
      )}
      
      <PatternDecorator isLight={isLight} />
      
      {/* Container isolado para linhas decorativas - FIXAS, não afetadas pelo zoom do navegador */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          isolation: 'isolate',
          // Cria um novo contexto de empilhamento isolado
          transform: 'translateZ(0)', // Força aceleração de hardware e isolamento
        }}
      >
        <FrameLinesDecorator isLight={isLight} />
      </div>
      
      {/* Container principal com escala fixa - mantém posições e reduz proporcionalmente no zoom */}
      {/* Apenas o conteúdo interno é afetado pelo zoom, as linhas ficam fixas */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center relative z-10"
        style={{ 
          width: '1920px',
          height: '1080px',
          padding: '50px',
          overflow: 'hidden',
          transformOrigin: 'center center',
          transform: `translate(-50%, -50%) scale(${scale})`,
          position: 'fixed', // Mudado para fixed para garantir que o scale não afete as linhas
          top: '50%',
          left: '50%',
          isolation: 'isolate' // Cria novo contexto de empilhamento para não afetar as linhas
        }}
      >
        {/* Header - Conforme Figma - Espaçamentos reduzidos */}
        <motion.div 
          variants={itemVariants} 
          className="text-center mb-4 sm:mb-6 md:mb-8 px-4 w-full"
          style={{ 
            position: 'relative',
            width: '100%',
            marginTop: '60px' // Desce um pouco os textos
          }}
        >
          <p 
            className="text-base sm:text-xl md:text-[28px] font-medium mb-1 sm:mb-2 leading-tight"
            style={{ color: textColor }}
          >
            Projeto{isLive && <span className="text-red-500"> (ao vivo)</span>}
          </p>
          <h1 
            className="text-2xl sm:text-4xl md:text-5xl lg:text-[60px] font-bold mb-1 sm:mb-2 leading-tight tracking-tight"
            style={{ color: textColor }}
          >
            {project.name}
          </h1>
          <p 
            className="text-lg sm:text-2xl md:text-3xl lg:text-[42px] font-light leading-tight"
            style={{ color: textColor }}
          >
            Como você quer entrar?
          </p>
        </motion.div>

        {/* Cards de Seleção - Conforme Figma - Centralizados horizontalmente - Espaçamento aumentado */}
        <motion.div
          variants={containerVariants}
          className="flex flex-col md:flex-row mb-4 sm:mb-6 md:mb-8 w-full px-4 justify-center items-center flex-1"
          style={{ 
            position: 'relative',
            width: '100%',
            gap: '48px' // Espaçamento aumentado entre os cards
          }}
        >
          {/* Mostra opção de Operador apenas se tiver permissão */}
          {(user?.role === 'admin' || user?.can_operate) && (
            <Card
              title="Operador"
              description="Controle total da transmissão, timeline e alertas."
              iconComponent={OperadorIcon}
              onClick={() => handleSelectRole('operator')}
              isLight={isLight}
            />
          )}
          
          {/* Mostra opção de Apresentador apenas se tiver permissão */}
          {(user?.role === 'admin' || user?.can_present) && (
            <Card
              title="Apresentador"
              description="Visão simplificada com o evento atual e próximos eventos"
              iconComponent={ApresentadorIcon}
              onClick={() => handleSelectRole('presenter')}
              isLight={isLight}
            />
          )}

        </motion.div>

        {/* Botões Voltar e Modo Ensaio - Conforme Figma */}
        {/* Layout conforme Figma: Voltar centralizado, Modo Ensaio à direita na mesma linha */}
        <motion.div 
          variants={itemVariants} 
          className="w-full mt-auto" 
          style={{ 
            paddingLeft: '50px', 
            paddingRight: '50px',
            position: 'relative',
            width: '100%',
            marginBottom: '80px' // Espaço acima das linhas decorativas (offset 50px + 30px extra)
          }}
        >
          <div 
            className="flex items-center justify-center relative w-full" 
            style={{ 
              minHeight: '47.327px',
              position: 'relative',
              width: '100%'
            }}
          >
            {/* Botão Voltar centralizado (horizontalmente) */}
            <div 
              className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2"
              style={{ 
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <VoltarButton onClick={() => navigate('/projects')} isLight={isLight} />
            </div>
            
            {/* Botão Modo Ensaio posicionado à direita, bem próximo à linha decorativa (na mesma linha do Voltar) */}
            {(user?.role === 'admin' || user?.can_present) && (
              <div 
                className="absolute flex items-center justify-end" 
                style={{ 
                  right: '0',
                  position: 'absolute'
                }}
              >
                <ModoEnsaioButton 
                  onClick={() => {
                    loadRundownState(projectId);
                    navigate(`/project/${projectId}/practice`);
                  }}
                  isLight={isLight}
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RoleSelectionView;