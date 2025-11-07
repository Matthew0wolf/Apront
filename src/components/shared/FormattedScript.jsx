import React from 'react';

/**
 * Componente para renderizar script com formatação especial
 * Suporta:
 * - **texto** → Negrito
 * - __texto__ → Ênfase/Sublinhado
 * - [PAUSA] → Indicador de pausa
 * - [ÊNFASE] → Indicador de ênfase
 */
const FormattedScript = ({ text, className = '', style = {} }) => {
  if (!text) return null;

  const parseScript = (content) => {
    const parts = [];
    let currentIndex = 0;
    let key = 0;

    // Regex para encontrar padrões de formatação
    const patterns = [
      { regex: /\*\*(.*?)\*\*/g, type: 'bold' },           // **negrito**
      { regex: /__(.*?)__/g, type: 'emphasis' },           // __ênfase__
      { regex: /\[PAUSA\]/gi, type: 'pause' },             // [PAUSA]
      { regex: /\[ÊNFASE\]/gi, type: 'emphasis-marker' },  // [ÊNFASE]
      { regex: /\[IMPORTANTE\]/gi, type: 'important' },    // [IMPORTANTE]
    ];

    // Encontrar todas as ocorrências de formatação
    const matches = [];
    patterns.forEach(({ regex, type }) => {
      const re = new RegExp(regex);
      let match;
      while ((match = re.exec(content)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          innerText: match[1] || match[0],
          type
        });
      }
    });

    // Ordenar por posição
    matches.sort((a, b) => a.start - b.start);

    // Processar texto
    matches.forEach((match) => {
      // Adicionar texto antes do match
      if (currentIndex < match.start) {
        const textBefore = content.substring(currentIndex, match.start);
        parts.push(
          <span key={`text-${key++}`}>{textBefore}</span>
        );
      }

      // Adicionar match formatado
      switch (match.type) {
        case 'bold':
          parts.push(
            <strong key={`bold-${key++}`} className="font-bold text-white">
              {match.innerText}
            </strong>
          );
          break;
        
        case 'emphasis':
          parts.push(
            <span key={`emphasis-${key++}`} className="font-semibold text-yellow-300 underline decoration-2">
              {match.innerText}
            </span>
          );
          break;
        
        case 'pause':
          parts.push(
            <span key={`pause-${key++}`} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-400/30 whitespace-nowrap">
              ⏸ PAUSA
            </span>
          );
          break;
        
        case 'emphasis-marker':
          parts.push(
            <span key={`emphasis-marker-${key++}`} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-bold border border-yellow-400/30 whitespace-nowrap">
              ⚡ ÊNFASE
            </span>
          );
          break;
        
        case 'important':
          parts.push(
            <span key={`important-${key++}`} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold border border-red-400/30 whitespace-nowrap">
              ⚠️ IMPORTANTE
            </span>
          );
          break;
        
        default:
          parts.push(<span key={`default-${key++}`}>{match.text}</span>);
      }

      currentIndex = match.end;
    });

    // Adicionar texto restante
    if (currentIndex < content.length) {
      parts.push(
        <span key={`text-final-${key++}`}>{content.substring(currentIndex)}</span>
      );
    }

    return parts;
  };

  return (
    <div className={className} style={{ ...style, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
      {parseScript(text)}
    </div>
  );
};

export default FormattedScript;

