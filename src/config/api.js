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
  
  // Detecta se é IP numérico (VPS) ou domínio de produção
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  
  // Verifica se é um IP numérico (ex: 72.60.56.28) ou domínio de produção
  const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
  const isProductionDomain = !hostname.includes('localhost') && 
                             !hostname.includes('127.0.0.1') && 
                             !hostname.includes('192.168.') &&
                             !hostname.includes('10.0.') &&
                             !hostname.includes('172.16.');
  
  // Se for IP (VPS) ou domínio de produção, usa o mesmo host (Nginx faz proxy)
  if (isIP || isProductionDomain) {
    const apiUrl = `${protocol}//${hostname}${window.location.port ? ':' + window.location.port : ''}`;
    console.log('🌐 Detectado acesso em produção/VPS:', hostname, '-> Backend via Nginx:', apiUrl);
    console.log('🔧 window.location:', {
      hostname: hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      href: window.location.href,
      isIP: isIP,
      isProductionDomain: isProductionDomain
    });
    return apiUrl;
  }
  
  // Se estiver rodando em localhost, verifica se há URL de desenvolvimento configurada
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Permite configurar URL do backend para desenvolvimento via variável de ambiente
    // Útil quando backend está em VPS mas frontend roda localmente
    if (import.meta.env.VITE_API_BASE_URL_DEV) {
      const devUrl = import.meta.env.VITE_API_BASE_URL_DEV;
      console.log('🏠 Desenvolvimento local detectado, usando backend configurado:', devUrl);
      return devUrl;
    }
    // Se não tiver configuração, tenta localhost:5001 (backend local)
    console.log('🏠 Detectado acesso local, usando localhost:5001 (backend local)');
    console.log('💡 Dica: Se backend está na VPS, configure VITE_API_BASE_URL_DEV=http://72.60.56.28 no .env');
    return 'http://localhost:5001';
  }
  
  // Fallback: usa o mesmo host
  const apiUrl = `${protocol}//${hostname}${window.location.port ? ':' + window.location.port : ''}`;
  console.log('🌐 Fallback: usando mesmo host:', apiUrl);
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

