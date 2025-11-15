import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/config/api';

const AcceptInvitePage = () => {
  const [token, setToken] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Preenche automaticamente o token da URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Cadastro realizado!', description: 'Agora você pode fazer login.' });
        navigate('/login');
      } else {
        toast({ title: 'Erro', description: data.error || 'Não foi possível concluir o cadastro.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro de conexão.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full bg-white/10 p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">🎉 Convite Aceito!</h1>
          <p className="text-gray-300">Complete seu cadastro para acessar a plataforma</p>
        </div>
        
        {token && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="text-green-300 text-sm text-center">
              ✅ Token detectado automaticamente
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium text-white">Token do Convite</label>
            <input 
              type="text" 
              value={token} 
              onChange={e => setToken(e.target.value)} 
              required 
              className="w-full px-4 py-2 rounded bg-white/20 border border-white/20 focus:border-primary outline-none text-center font-mono"
              placeholder="Cole o token aqui"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-white">Seu Nome</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              className="w-full px-4 py-2 rounded bg-white/20 border border-white/20 focus:border-primary outline-none"
              placeholder="Digite seu nome completo"
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-white">Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className="w-full px-4 py-2 rounded bg-white/20 border border-white/20 focus:border-primary outline-none"
              placeholder="Crie uma senha segura"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition disabled:opacity-50" 
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar Conta e Entrar'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <span className="text-gray-400">Já tem conta?</span>
          <button 
            type="button" 
            className="ml-2 text-primary underline hover:text-primary/80" 
            onClick={() => navigate('/login')}
          >
            Fazer Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
