// Configuração da API
// Detecta automaticamente o endereço do backend baseado no ambiente
const getApiUrl = () => {
  // Em produção: usa variável de ambiente VITE_API_BASE_URL (configurada no build)
  // Funciona para Railway, VPS, Vercel, Netlify, Render, etc.
  if (import.meta.env.VITE_API_BASE_URL) {
    const prodUrl = import.meta.env.VITE_API_BASE_URL;
    console.log('🚀 Ambiente de produção detectado, usando:', prodUrl);
    return prodUrl;
  }
  
  // Fallback: detecta automaticamente se estiver em plataformas conhecidas
  if (window.location.hostname.includes('railway.app')) {
    // Se não tiver VITE_API_BASE_URL configurado, usa a URL conhecida do backend
    // (não recomendado para produção, mas útil para testes rápidos)
    console.warn('⚠️ VITE_API_BASE_URL não configurado. Usando URL padrão do backend.');
    console.warn('⚠️ Configure a variável VITE_API_BASE_URL no Railway para produção!');
    // URL padrão do backend no Railway
    return 'https://apront-production.up.railway.app';
  }
  
  if (window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('netlify.app') ||
      window.location.hostname.includes('render.com')) {
    // Para outras plataformas, tenta inferir do hostname
    console.warn('⚠️ VITE_API_BASE_URL não configurado. Configure a variável de ambiente no build.');
    return `https://${window.location.hostname.replace(/^[^.]+/, 'backend')}`;
  }
  
  // Se estiver rodando em localhost, usa localhost:5001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🏠 Detectado acesso local, usando localhost:5001');
    return 'http://localhost:5001';
  }
  
  // Se estiver rodando em produção/VPS (não localhost), usa o mesmo domínio
  // O Nginx faz proxy para o backend na porta 5001
  // Isso permite que WebSocket funcione através do Nginx
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const apiUrl = `${protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
  console.log('🌐 Detectado acesso em produção/VPS:', window.location.hostname, '-> Backend via Nginx:', apiUrl);
  return apiUrl;
};

export const API_BASE_URL = getApiUrl();

// URL para WebSocket (usa o mesmo host mas com protocolo ws/wss)
export const WS_URL = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

console.log('🔧 API configurada:', { 
  frontend: window.location.href,
  hostname: window.location.hostname,
  API_BASE_URL, 
  WS_URL 
});

// Testa conectividade com o backend
// Em produção/VPS, usa rota pública do backend (através do proxy /api)
const testUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? `${API_BASE_URL}/`  // Em localhost, backend está na raiz
  : `${API_BASE_URL}/api/auth/login`;  // Em produção, usa rota pública através do proxy

fetch(testUrl, { method: 'OPTIONS' })
  .then(res => {
    // OPTIONS retorna 200 se backend está respondendo
    if (res.status === 200 || res.status === 405) {
      console.log('✅ Backend respondeu:', res.status, res.statusText);
      return { message: 'Backend ativo' };
    }
    return res.json();
  })
  .then(data => {
    console.log('✅ Backend ativo:', data);
  })
  .catch(err => {
    // 401 ou outros erros podem indicar que backend está respondendo
    if (err.message.includes('401') || err.message.includes('UNAUTHORIZED')) {
      console.log('✅ Backend está respondendo (401 é esperado para rota protegida)');
    } else {
      console.error('❌ ERRO: Não foi possível conectar ao backend!');
      console.error('❌ URL tentada:', testUrl);
      console.error('❌ Erro:', err.message);
      console.error('⚠️ Verifique se o backend está rodando e acessível no IP:', window.location.hostname);
    }
  });

