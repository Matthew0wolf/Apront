/**
 * Calcula a velocidade ideal do auto-scroll baseada na duração do evento e no tamanho do script
 * 
 * @param {number} duration - Duração do evento em segundos
 * @param {string} script - Conteúdo do script (texto)
 * @param {number} currentSpeed - Velocidade atual configurada (para não sobrescrever ajustes manuais)
 * @returns {number|null} - Velocidade sugerida (0.05-2.0) ou null se não for possível calcular
 */
export const calculateOptimalScrollSpeed = (duration, script, currentSpeed = null) => {
  // Se não há duração ou script, não calcula
  if (!duration || duration <= 0 || !script || typeof script !== 'string') {
    return null;
  }

  // Remove espaços extras e marcações do script para calcular tamanho real
  const cleanedScript = script
    .replace(/\*\*|__/g, '') // Remove formatação
    .replace(/\[PAUSA\]/gi, ' ') // Remove pausas
    .replace(/\[\w+\]/g, ' ') // Remove outras marcações
    .trim();

  if (!cleanedScript) {
    return null;
  }

  // Estima o número de palavras no script
  const words = cleanedScript.split(/\s+/).filter(Boolean).length;
  
  // Se o script é muito curto, não precisa ajustar
  if (words < 10) {
    return null;
  }

  // Estima altura do conteúdo baseado em:
  // - Média de caracteres por linha: ~60 caracteres (considerando fonte padrão de 24px e largura típica)
  // - Cada linha tem aproximadamente 43px de altura (24px * 1.8 line-height)
  const characters = cleanedScript.length;
  const estimatedLines = Math.ceil(characters / 60);
  const estimatedHeightPx = estimatedLines * 43; // 43px por linha (24px * 1.8)

  // Altura visível típica do container (aproximadamente 600-700px)
  const visibleHeight = 650;
  
  // Altura total que precisa ser scrollada
  const scrollableHeight = Math.max(0, estimatedHeightPx - visibleHeight);

  // Se não há altura para scrollar, não ajusta
  if (scrollableHeight <= 0) {
    return null;
  }

  // Calcula velocidade base para completar o scroll durante a duração do evento
  // Queremos que o scroll complete em aproximadamente 80-85% da duração (deixando margem para leitura)
  const targetDuration = duration * 0.82; // 82% da duração para completar o scroll
  
  // Pixels por segundo necessários para completar o scroll no tempo alvo
  const requiredPixelsPerSecond = scrollableHeight / targetDuration;
  
  // Pixels por segundo para velocidade 1.0x (base de referência)
  // Assumimos que velocidade 1.0x = 15 pixels/segundo (ajustado para melhor experiência)
  const basePixelsPerSecond = 15;
  
  // Calcula velocidade necessária
  let calculatedSpeed = requiredPixelsPerSecond / basePixelsPerSecond;
  
  // Ajusta para limites razoáveis (0.05x a 2.0x)
  calculatedSpeed = Math.max(0.05, Math.min(2.0, calculatedSpeed));
  
  // Se a velocidade calculada é muito próxima da atual (diferença < 0.1), não altera
  // Isso preserva ajustes manuais do operador
  if (currentSpeed !== null && Math.abs(calculatedSpeed - currentSpeed) < 0.1) {
    return null; // Não altera se a diferença for pequena
  }
  
  // Arredonda para 2 casas decimais
  return Math.round(calculatedSpeed * 100) / 100;
};

/**
 * Calcula velocidade baseada apenas na duração (fallback quando não há script)
 * 
 * @param {number} duration - Duração do evento em segundos
 * @returns {number} - Velocidade sugerida (0.05-2.0)
 */
export const calculateSpeedByDuration = (duration) => {
  if (!duration || duration <= 0) return 0.5; // Padrão
  
  // Velocidades sugeridas baseadas na duração:
  // - Eventos muito curtos (< 30s): velocidade rápida (1.0x - 1.3x)
  // - Eventos curtos (30s - 1min): velocidade normal (0.7x - 1.0x)
  // - Eventos médios (1min - 3min): velocidade moderada (0.4x - 0.7x)
  // - Eventos longos (3min - 5min): velocidade lenta (0.25x - 0.4x)
  // - Eventos muito longos (5min - 10min): velocidade muito lenta (0.15x - 0.25x)
  // - Eventos extremamente longos (> 10min): velocidade extremamente lenta (0.1x - 0.15x)
  
  if (duration < 30) {
    return Math.max(0.1, Math.min(1.3, 1.0 + (30 - duration) * 0.01));
  } else if (duration < 60) {
    return Math.max(0.1, Math.min(1.0, 1.0 - (duration - 30) * 0.01));
  } else if (duration < 180) {
    return Math.max(0.1, Math.min(0.7, 0.7 - (duration - 60) * 0.0025));
  } else if (duration < 300) {
    return Math.max(0.1, Math.min(0.4, 0.4 - (duration - 180) * 0.00125));
  } else if (duration < 600) {
    return Math.max(0.1, Math.min(0.25, 0.25 - (duration - 300) * 0.00033));
  } else {
    return Math.max(0.1, Math.min(0.15, 0.15 - (duration - 600) * 0.00008));
  }
};

