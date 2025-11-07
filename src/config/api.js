// Configuração da API
// Detecta automaticamente o endereço IP do backend baseado no frontend
const getApiUrl = () => {
  // Se estiver rodando em localhost, usa localhost:5001
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🏠 Detectado acesso local, usando localhost:5001');
    return 'http://localhost:5001';
  }
  
  // Se estiver rodando em um IP da rede (ex: 192.168.0.100), usa o mesmo IP com porta 5001
  const apiUrl = `http://${window.location.hostname}:5001`;
  console.log('🌐 Detectado acesso via rede:', window.location.hostname, '-> Backend:', apiUrl);
  return apiUrl;
};

export const API_BASE_URL = getApiUrl();

// URL para WebSocket (usa o mesmo host mas com protocolo ws)
export const WS_URL = API_BASE_URL.replace('http', 'ws');

console.log('🔧 API configurada:', { 
  frontend: window.location.href,
  hostname: window.location.hostname,
  API_BASE_URL, 
  WS_URL 
});

// Testa conectividade com o backend
fetch(`${API_BASE_URL}/`)
  .then(res => {
    console.log('✅ Backend respondeu:', res.status, res.statusText);
    return res.json();
  })
  .then(data => {
    console.log('✅ Backend ativo:', data);
  })
  .catch(err => {
    console.error('❌ ERRO: Não foi possível conectar ao backend!');
    console.error('❌ URL tentada:', `${API_BASE_URL}/`);
    console.error('❌ Erro:', err.message);
    console.error('⚠️ Verifique se o backend está rodando e acessível no IP:', window.location.hostname);
    console.error('⚠️ Comando para iniciar backend: python backend/app.py');
  });

