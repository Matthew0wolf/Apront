/**
 * Script para testar acesso à API do Figma
 * Usa o token de acesso pessoal para buscar informações do design
 */

const FIGMA_TOKEN = 'figd_Taqwe8KdaY8QZ-WYwRIuWDZhACbHEOWxISDa1o-y';
const FIGMA_FILE_ID = 'a4SKzmlfMaRZbN2zkrrByt'; // Do link: https://www.figma.com/design/a4SKzmlfMaRZbN2zkrrByt/Apront-Branding

async function testFigmaAPI() {
  try {
    // Testar acesso básico
    console.log('🔍 Testando acesso à API do Figma...\n');
    
    const response = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro ao acessar API:', response.status, errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Acesso bem-sucedido!\n');
    console.log('📄 Nome do arquivo:', data.name);
    console.log('📊 Última modificação:', data.lastModified);
    console.log('🎨 Versão:', data.version);
    console.log('\n📋 Documento possui', data.document.children?.length || 0, 'páginas\n');
    
    // Extrair informações de design tokens
    console.log('🎨 Extraindo informações de design...\n');
    
    // Buscar estilos/componentes
    const stylesResponse = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}/styles`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      }
    });
    
    if (stylesResponse.ok) {
      const stylesData = await stylesResponse.json();
      console.log('🎨 Estilos encontrados:', Object.keys(stylesData.meta?.styles || {}).length);
    }
    
    // Buscar imagens/components
    const imagesResponse = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}/images`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      }
    });
    
    if (imagesResponse.ok) {
      const imagesData = await imagesResponse.json();
      console.log('🖼️  Imagens/Componentes encontrados:', imagesData.meta?.images?.length || 0);
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar se for chamado diretamente
if (typeof window === 'undefined') {
  testFigmaAPI();
}

export { testFigmaAPI, FIGMA_TOKEN, FIGMA_FILE_ID };

