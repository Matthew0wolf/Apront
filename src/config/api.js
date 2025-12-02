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
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  
  // Função para detectar se é IP privado (desenvolvimento local/rede local)
  const isPrivateIP = (ip) => {
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return false;
    
    const parts = ip.split('.').map(Number);
    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 10.0.0.0 - 10.255.255.255
    if (parts[0] === 10) return true;
    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 127.0.0.0 - 127.255.255.255 (localhost)
    if (parts[0] === 127) return true;
    // 169.254.0.0 - 169.254.255.255 (link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;
    
    return false;
  };
  
  // Verifica se é IP numérico
  const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
  
  // Se for localhost ou IP privado → DESENVOLVIMENTO
  if (hostname === 'localhost' || hostname === '127.0.0.1' || (isIP && isPrivateIP(hostname))) {
    // Permite configurar URL do backend para desenvolvimento via variável de ambiente
    if (import.meta.env.VITE_API_BASE_URL_DEV) {
      const devUrl = import.meta.env.VITE_API_BASE_URL_DEV;
      console.log('🏠 Desenvolvimento detectado (IP privado/rede local), usando backend configurado:', devUrl);
      return devUrl;
    }
    // Se não tiver configuração, usa o mesmo IP mas na porta 5001 (backend local)
    const backendUrl = `${protocol}//${hostname}:5001`;
    console.log('🏠 Desenvolvimento detectado (IP privado/rede local), usando backend na porta 5001:', backendUrl);
    console.log('💡 Dica: Configure VITE_API_BASE_URL_DEV no .env se o backend estiver em outro IP/porta');
    return backendUrl;
  }
  
  // Se for IP público ou domínio de produção → PRODUÇÃO (usa mesmo host com proxy Nginx)
  if (isIP || (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
    const apiUrl = `${protocol}//${hostname}${window.location.port ? ':' + window.location.port : ''}`;
    console.log('🌐 Detectado acesso em produção/VPS:', hostname, '-> Backend via Nginx:', apiUrl);
    console.log('🔧 window.location:', {
      hostname: hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      href: window.location.href,
      isIP: isIP,
      isPrivateIP: isIP ? isPrivateIP(hostname) : false
    });
    return apiUrl;
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
// Detecta se é desenvolvimento (localhost ou IP privado)
const isDev = window.location.hostname === 'localhost' || 
              window.location.hostname === '127.0.0.1' ||
              /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname);

const testUrl = isDev
  ? `${API_BASE_URL}/`  // Em desenvolvimento, backend está na raiz
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

