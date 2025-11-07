/**
 * Script para acessar a API do Figma e extrair informações do design
 * Usa o token de acesso pessoal
 */

const FIGMA_TOKEN = 'figd_Taqwe8KdaY8QZ-WYwRIuWDZhACbHEOWxISDa1o-y';
const FIGMA_FILE_ID = 'a4SKzmlfMaRZbN2zkrrByt';
const NODE_ID = '154:2'; // node-id da página inicial (usa : como separador)

async function getFigmaFile() {
  try {
    console.log('🔍 Acessando arquivo Figma...\n');
    
    const response = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Arquivo acessado com sucesso!\n');
    console.log('📄 Nome:', data.name);
    console.log('📊 Versão:', data.version);
    console.log('📅 Última modificação:', data.lastModified);
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro ao acessar:', error.message);
    return null;
  }
}

async function getFigmaNode(nodeId) {
  try {
    console.log(`\n🎯 Buscando node ${nodeId}...\n`);
    
    // A API do Figma permite buscar nodes específicos
    const response = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}/nodes?ids=${encodeURIComponent(nodeId)}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao buscar node:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Resposta recebida!\n');
    console.log('📊 Estrutura da resposta:', Object.keys(data));
    console.log('📋 Nodes disponíveis:', data.nodes ? Object.keys(data.nodes) : 'Nenhum');
    
    if (data.nodes && data.nodes[nodeId]) {
      console.log(`\n✅ Node ${nodeId} encontrado!`);
      const nodeData = data.nodes[nodeId];
      console.log('📦 Estrutura do node:', Object.keys(nodeData));
      const node = nodeData.document;
      console.log('📋 Nome do node:', node.name);
      console.log('🎨 Tipo:', node.type);
      console.log('📐 Dimensões:', node.absoluteBoundingBox ? 
        `${node.absoluteBoundingBox.width} x ${node.absoluteBoundingBox.height}` : 'N/A');
      
      // Função recursiva para extrair cores de todos os elementos
      const extractColors = (element, depth = 0) => {
        const colors = [];
        const indent = '  '.repeat(depth);
        
        if (element.fills && Array.isArray(element.fills)) {
          element.fills.forEach((fill) => {
            if (fill.type === 'SOLID' && fill.color) {
              const r = Math.round(fill.color.r * 255);
              const g = Math.round(fill.color.g * 255);
              const b = Math.round(fill.color.b * 255);
              const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              colors.push({ name: element.name || 'Elemento', hex, rgb: `rgb(${r}, ${g}, ${b})` });
            }
          });
        }
        
        if (element.children && Array.isArray(element.children)) {
          element.children.forEach(child => {
            colors.push(...extractColors(child, depth + 1));
          });
        }
        
        return colors;
      };
      
      const allColors = extractColors(node);
      if (allColors.length > 0) {
        console.log('\n🎨 Cores encontradas no design:');
        const uniqueColors = [...new Map(allColors.map(c => [c.hex, c])).values()];
        uniqueColors.forEach((color, i) => {
          console.log(`  ${i + 1}. ${color.hex} - ${color.rgb} (${color.name})`);
        });
      }
      
      // Extrair informações de tipografia
      const extractTypography = (element, depth = 0) => {
        const typography = [];
        
        if (element.style) {
          const style = element.style;
          if (style.fontFamily || style.fontSize) {
            typography.push({
              name: element.name || 'Texto',
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeightPx || style.lineHeightPercentFontSize,
              letterSpacing: style.letterSpacing
            });
          }
        }
        
        if (element.children && Array.isArray(element.children)) {
          element.children.forEach(child => {
            typography.push(...extractTypography(child, depth + 1));
          });
        }
        
        return typography;
      };
      
      const allTypography = extractTypography(node);
      if (allTypography.length > 0) {
        console.log('\n📝 Tipografia encontrada:');
        const uniqueTypography = [...new Map(allTypography.map(t => [t.fontSize + t.fontFamily, t])).values()];
        uniqueTypography.forEach((typo, i) => {
          console.log(`  ${i + 1}. ${typo.fontFamily} - ${typo.fontSize}px (${typo.fontWeight || 'normal'})`);
        });
      }
      
      if (node.styles) {
        console.log('\n📝 Estilos aplicados:', Object.keys(node.styles));
      }
      
      // Salvar dados completos em arquivo para análise
      const fs = require('fs');
      const path = require('path');
      const outputPath = path.join(__dirname, '..', 'figma-design-data.json');
      fs.writeFileSync(outputPath, JSON.stringify(data.nodes, null, 2));
      console.log(`\n💾 Dados salvos em: ${outputPath}`);
      
      return node;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao buscar node:', error.message);
    return null;
  }
}

async function getFigmaImages(nodeId) {
  try {
    console.log(`\n🖼️  Buscando imagens do node ${nodeId}...\n`);
    
    const response = await fetch(`https://api.figma.com/v1/images/${FIGMA_FILE_ID}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao buscar imagens:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ URLs de imagens geradas!');
    console.log('🖼️  URLs:', JSON.stringify(data.images, null, 2));
    
    return data.images;
    
  } catch (error) {
    console.error('❌ Erro ao buscar imagens:', error.message);
    return null;
  }
}

// Executar
async function main() {
  console.log('🚀 Iniciando extração do design Figma...\n');
  console.log('📁 File ID:', FIGMA_FILE_ID);
  console.log('🎯 Node ID:', NODE_ID);
  console.log('─'.repeat(50));
  
  const file = await getFigmaFile();
  if (file) {
    const node = await getFigmaNode(NODE_ID);
    if (node) {
      await getFigmaImages(NODE_ID);
    }
  }
  
  console.log('\n✅ Processo concluído!');
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  main();
}

export { getFigmaFile, getFigmaNode, getFigmaImages, FIGMA_TOKEN, FIGMA_FILE_ID, NODE_ID };

