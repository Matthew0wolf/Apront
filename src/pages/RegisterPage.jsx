import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/config/api';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [step, setStep] = useState(1); // 1: formulário inicial, 2: verificação de token
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receivedToken, setReceivedToken] = useState('');
  const navigate = useNavigate();

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, company })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro ao enviar token' }));
        throw new Error(data.error || 'Erro ao enviar token');
      }
      
      const data = await res.json();
      
      // Se o email foi enviado com sucesso, não mostra o token
      // Se falhou o envio, mostra o token para debug
      if (data.debug && data.token) {
        setReceivedToken(data.token);
      }
      
      setStep(2);
      setSuccess(true);
    } catch (err) {
      console.error('❌ Erro no cadastro inicial:', err);
      if (err.message === 'Failed to fetch' || err.message.includes('fetch') || err.message.includes('NetworkError')) {
        const errorMsg = `Não foi possível conectar ao servidor em ${API_BASE_URL}. ` +
          `Verifique: 1) Backend está rodando, 2) CORS está configurado, 3) URL está correta. ` +
          `Erro: ${err.message}`;
        setError(errorMsg);
        console.error('❌ URL tentada:', `${API_BASE_URL}/api/auth/register`);
        console.error('❌ Erro completo:', err);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTokenVerification = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          company, 
          token: verificationToken 
        })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erro ao verificar token' }));
        throw new Error(data.error || 'Erro ao verificar token');
      }
      
      const data = await res.json();
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error('❌ Erro na verificação de token:', err);
      if (err.message === 'Failed to fetch' || err.message.includes('fetch') || err.message.includes('NetworkError')) {
        const errorMsg = `Não foi possível conectar ao servidor em ${API_BASE_URL}. ` +
          `Verifique: 1) Backend está rodando, 2) CORS está configurado, 3) URL está correta. ` +
          `Erro: ${err.message}`;
        setError(errorMsg);
        console.error('❌ URL tentada:', `${API_BASE_URL}/api/auth/verify-token`);
        console.error('❌ Erro completo:', err);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={step === 1 ? handleInitialSubmit : handleTokenVerification} className="bg-white/10 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {step === 1 ? 'Cadastro' : 'Verificação de Email'}
        </h2>
        
        {error && <div className="mb-4 text-red-500 text-center">{error}</div>}
        {success && step === 1 && (
          <div className="mb-4 text-green-600 text-center">
            {receivedToken ? 'Erro ao enviar email. Use o token abaixo:' : 'Token enviado! Verifique seu email.'}
          </div>
        )}
        {success && step === 2 && <div className="mb-4 text-green-600 text-center">Cadastro realizado! Redirecionando...</div>}
        
        {step === 1 ? (
          <>
            <input
              type="text"
              placeholder="Nome"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full mb-4 px-4 py-2 rounded bg-white/20 border border-white/20 focus:border-primary outline-none"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mb-4 px-4 py-2 rounded bg-white/20 border border-white/20 focus:border-primary outline-none"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full mb-4 px-4 py-2 rounded bg-white/20 border border-white/20 focus:border-primary outline-none"
              required
            />
            <input
              type="text"
              placeholder="Empresa"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full mb-6 px-4 py-2 rounded bg-white/20 border border-white/20 focus:border-primary outline-none"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Token de Verificação'}
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 text-center text-sm text-gray-300">
              Digite o token de 6 dígitos enviado para <strong>{email}</strong>
            </div>
            
            {/* Mostra o token recebido para debug */}
            {receivedToken && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <div className="text-yellow-300 text-sm text-center mb-2">
                  🔧 <strong>Modo Debug:</strong> Token gerado:
                </div>
                <div className="text-2xl font-mono text-center text-yellow-200 tracking-widest">
                  {receivedToken}
                </div>
                <div className="text-yellow-300 text-xs text-center mt-1">
                  (Em produção, este token seria enviado por email)
                </div>
              </div>
            )}
            
            <input
              type="text"
              placeholder="Token de verificação (6 dígitos)"
              value={verificationToken}
              onChange={e => setVerificationToken(e.target.value)}
              className="w-full mb-6 px-4 py-2 rounded bg-white/20 border border-white/20 focus:border-primary outline-none text-center text-2xl tracking-widest"
              maxLength="6"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Verificar e Cadastrar'}
            </button>
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="w-full mt-2 text-gray-300 hover:text-white transition"
            >
              ← Voltar
            </button>
          </>
        )}
        
        <div className="mt-4 text-center">
          <span className="text-muted-foreground">Já tem conta?</span>
          <button type="button" className="ml-2 text-primary underline" onClick={() => navigate('/login')}>Entrar</button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
