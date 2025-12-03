import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { Mail, Twitter, Youtube, Instagram, Globe } from 'lucide-react';

const Footer = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    // TODO: Implementar lógica de inscrição
    console.log('Inscrição:', email);
    setEmail('');
  };

  return (
    <footer 
      className="w-full mt-16 border"
      style={{
        backgroundColor: isLight ? 'rgba(229,229,229,0.5)' : '#0e0e0e',
        borderColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)',
        fontFamily: "'Darker Grotesque', sans-serif"
      }}
    >
      <div className="container mx-auto px-3 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 mb-12">
          {/* Logo e Texto Inspiracional */}
          <div className="md:col-span-4">
            <div className="mb-6">
              <img
                src={isLight ? "/apront-logo-dark.svg" : "/apront-logo-light.svg"}
                alt="Apront"
                className="h-[49px] w-auto mb-6"
              />
            </div>
            <p 
              className="text-lg sm:text-xl md:text-[27px] leading-[1.07] font-light"
              style={{ color: isLight ? '#080808' : '#ffffff' }}
            >
              Pare de torcer para dar certo, comece a ter certeza que vai dar.
            </p>
          </div>

          {/* Links Empresa */}
          <div className="md:col-span-2">
            <h3 
              className="text-2xl sm:text-3xl md:text-[36px] leading-[1.07] font-semibold mb-6"
              style={{ color: isLight ? '#080808' : '#ffffff' }}
            >
              Empresa
            </h3>
            <ul className="space-y-4">
              {[
                'Funcionalidades',
                'Recursos',
                'Planos',
                'Blog',
                'Contato'
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-base sm:text-lg md:text-[27px] leading-[1.07] font-medium hover:underline"
                    style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Plataforma */}
          <div className="md:col-span-3">
            <h3 
              className="text-2xl sm:text-3xl md:text-[36px] leading-[1.07] font-semibold mb-6"
              style={{ color: isLight ? '#080808' : '#ffffff' }}
            >
              Plataforma
            </h3>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-base sm:text-lg md:text-[27px] leading-[1.07] font-medium hover:underline text-left"
                  style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }}
                >
                  Meus Projetos
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/templates')}
                  className="text-base sm:text-lg md:text-[27px] leading-[1.07] font-medium hover:underline text-left"
                  style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }}
                >
                  Modelos
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/team')}
                  className="text-base sm:text-lg md:text-[27px] leading-[1.07] font-medium hover:underline text-left"
                  style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }}
                >
                  Equipe
                </button>
              </li>
              <li>
                <a
                  href="#"
                  className="text-base sm:text-lg md:text-[27px] leading-[1.07] font-medium hover:underline"
                  style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }}
                >
                  Perfil
                </a>
              </li>
              <li>
                <button
                  onClick={() => navigate('/settings')}
                  className="text-base sm:text-lg md:text-[27px] leading-[1.07] font-medium hover:underline text-left"
                  style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }}
                >
                  Configurações
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-3">
            <p 
              className="text-lg sm:text-xl md:text-[30px] leading-[1.07] font-medium mb-6"
              style={{ color: isLight ? '#080808' : '#ffffff' }}
            >
              Inscreva-se para receber atualizações, lançamentos e descontos especiais.
            </p>
            
            <form onSubmit={handleSubscribe} className="mb-8">
              <div 
                className="relative flex items-center gap-3 p-4"
                style={{
                  backgroundColor: isLight ? 'rgba(255,255,255,0.8)' : '#0C0C0C',
                  border: isLight ? '1px solid rgba(8,8,8,0.2)' : '1px solid rgba(255, 255, 255, 0.2)',
                  height: '65px'
                }}
              >
                <Mail className="w-6 h-6 flex-shrink-0" style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu email aqui"
                  className="flex-1 bg-transparent outline-none text-base sm:text-lg md:text-[28px] placeholder:opacity-50"
                  style={{ 
                    color: isLight ? '#080808' : '#ffffff',
                    fontFamily: "'Darker Grotesque', sans-serif"
                  }}
                />
                <button
                  type="submit"
                  className="px-4 sm:px-5 py-2 bg-white text-black font-bold text-sm sm:text-base md:text-[18px] hover:bg-gray-100 transition-colors whitespace-nowrap"
                  style={{ fontFamily: "'Darker Grotesque', sans-serif", height: '29px' }}
                >
                  Inscrever-se
                </button>
              </div>
            </form>

            <p 
              className="text-base sm:text-lg md:text-[27px] leading-[1.07] font-medium mb-4"
              style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }}
            >
              Siga-nos nas redes sociais
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-6 h-6 hover:opacity-80 transition-opacity"
                aria-label="Twitter"
              >
                <Twitter className="w-full h-full" style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }} />
              </a>
              <a
                href="#"
                className="w-6 h-6 hover:opacity-80 transition-opacity"
                aria-label="Instagram"
              >
                <Instagram className="w-full h-full" style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }} />
              </a>
              <a
                href="#"
                className="w-6 h-6 hover:opacity-80 transition-opacity"
                aria-label="YouTube"
              >
                <Youtube className="w-full h-full" style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }} />
              </a>
              <a
                href="#"
                className="w-6 h-6 hover:opacity-80 transition-opacity"
                aria-label="Website"
              >
                <Globe className="w-full h-full" style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }} />
              </a>
            </div>
          </div>
        </div>

        {/* Linha Divisória */}
        <div 
          className="w-full h-[0.5px] mb-8"
          style={{ backgroundColor: isLight ? 'rgba(8,8,8,0.2)' : 'rgba(255, 255, 255, 0.2)' }}
        />

        {/* Copyright e Links Legais */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
          <p 
            className="text-sm sm:text-base md:text-[27px] leading-[1.07] font-medium"
            style={{ color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)' }}
          >
            © 2025 - 2026 · Apront Software LTDA
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {[
              'Termos de Uso',
              'Política de Privacidade',
              'Licenciamento',
              'Contato'
            ].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm sm:text-base md:text-[27px] leading-[1.07] font-medium underline decoration-dotted hover:opacity-80 transition-opacity"
                style={{ 
                  color: isLight ? 'rgba(8,8,8,0.5)' : 'rgba(255, 255, 255, 0.5)',
                  textUnderlineOffset: '25%'
                }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

