import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from pathlib import Path

# Carrega .env primeiro (sem sobrescrever variáveis já definidas) para detectar FLASK_ENV
backend_dir = Path(__file__).parent.absolute()
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path, override=False)  # override=False: não sobrescreve variáveis já definidas

# Detecta se está em produção (Railway ou VPS/Docker)
IS_PRODUCTION = bool(
    os.getenv('RAILWAY_ENVIRONMENT') or 
    os.getenv('RAILWAY_ENVIRONMENT_NAME') or
    os.getenv('RAILWAY_PROJECT_ID') or 
    os.getenv('RAILWAY_SERVICE_NAME') or
    os.getenv('RAILWAY_SERVICE_ID') or
    os.getenv('FLASK_ENV') == 'production'  # VPS/Docker
)

# Log sobre carregamento
if IS_PRODUCTION:
    if os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RAILWAY_PROJECT_ID'):
        print("[EMAIL] Modo produção Railway: usando variáveis de ambiente do Railway")
    else:
        print("[EMAIL] Modo produção VPS: usando variáveis do .env e docker-compose")
else:
    print("[EMAIL] Modo desenvolvimento: usando variáveis do .env")

SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME')
# Remove espaços da senha (Google App Password vem com espaços a cada 4 caracteres)
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '').replace(' ', '') if os.getenv('SMTP_PASSWORD') else ''
FROM_EMAIL = os.getenv('FROM_EMAIL')

def _validate_smtp_config():
    """Valida se as configurações SMTP estão definidas"""
    print(f"[VALIDACAO] Validando configuracoes SMTP...")
    print(f"   SMTP_SERVER: {SMTP_SERVER if SMTP_SERVER else 'NAO DEFINIDO'}")
    print(f"   SMTP_PORT: {SMTP_PORT}")
    print(f"   SMTP_USERNAME: {SMTP_USERNAME if SMTP_USERNAME else 'NAO DEFINIDO'}")
    print(f"   SMTP_PASSWORD: {'DEFINIDO' if SMTP_PASSWORD else 'NAO DEFINIDO'} ({len(SMTP_PASSWORD) if SMTP_PASSWORD else 0} caracteres)")
    print(f"   FROM_EMAIL: {FROM_EMAIL if FROM_EMAIL else 'NAO DEFINIDO'}")
    
    if not all([SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD]):
        print("[ERRO] Configuracoes SMTP nao encontradas!")
        if IS_PRODUCTION:
            print("   ⚠️  PRODUCAO: Configure as variaveis de ambiente no Railway:")
            print("      - SMTP_SERVER (ex: smtp.gmail.com)")
            print("      - SMTP_PORT (ex: 587)")
            print("      - SMTP_USERNAME (seu email)")
            print("      - SMTP_PASSWORD (senha de app do Google)")
            print("      - FROM_EMAIL (seu email)")
        else:
            print("   Certifique-se de criar um arquivo .env na pasta backend com:")
            print("   SMTP_SERVER=smtp.gmail.com")
            print("   SMTP_PORT=587")
            print("   SMTP_USERNAME=seu_email@gmail.com")
            print("   SMTP_PASSWORD=sua_senha_de_app")
            print("   FROM_EMAIL=seu_email@gmail.com")
        return False
    print("[OK] Configuracoes SMTP validadas!")
    return True

def send_invite_email(to_email, invite_token):
    if not _validate_smtp_config():
        return False
    
    subject = 'Convite para cadastro na plataforma Apront'
    # URL direta para aceitar convite com token preenchido
    # Detecta ambiente: produção (VPS) ou desenvolvimento
    
    # Debug: mostra detecção de ambiente
    print(f"[EMAIL] IS_PRODUCTION: {IS_PRODUCTION}")
    print(f"[EMAIL] FLASK_ENV: {os.getenv('FLASK_ENV')}")
    print(f"[EMAIL] RAILWAY_ENVIRONMENT: {os.getenv('RAILWAY_ENVIRONMENT')}")
    
    # Verifica se há FRONTEND_URL configurado explicitamente
    # Recarrega .env para garantir que FRONTEND_URL está disponível
    load_dotenv(dotenv_path=env_path, override=False)
    frontend_url_env = os.getenv('FRONTEND_URL')
    print(f"[EMAIL] FRONTEND_URL lido do .env: {frontend_url_env}")
    if frontend_url_env:
        base_url = frontend_url_env
        print(f"[EMAIL] Usando FRONTEND_URL do ambiente: {base_url}")
    elif IS_PRODUCTION and not (os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RAILWAY_PROJECT_ID')):
        # VPS: usa IP ou domínio configurado
        base_url = 'http://72.60.56.28'
        print(f"[EMAIL] Ambiente VPS detectado, usando: {base_url}")
    elif IS_PRODUCTION:
        # Railway: usa domínio do Railway
        base_url = 'https://react-frontend-production-4c4d.up.railway.app'
        print(f"[EMAIL] Ambiente Railway detectado, usando: {base_url}")
    else:
        # Desenvolvimento local
        base_url = 'http://localhost:3000'
        print(f"[EMAIL] Ambiente desenvolvimento detectado, usando: {base_url}")
    
    invite_url = f"{base_url}/accept-invite?token={invite_token}"
    print(f"[EMAIL] URL do convite gerada: {invite_url}")
    
    body = f"""
Olá!

Você foi convidado para participar da plataforma Apront.

🔗 CLIQUE AQUI PARA ACEITAR O CONVITE:
{invite_url}

Ou use o token manualmente:
Token: {invite_token}

Se não foi você quem solicitou, ignore este e-mail.

Atenciosamente,
Equipe Apront
"""
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = FROM_EMAIL or SMTP_USERNAME
    msg['To'] = to_email
    msg.set_content(body)

    # Tenta primeiro com STARTTLS (porta 587), depois com SSL (porta 465)
    methods = []
    if SMTP_PORT == 587:
        methods.append(('STARTTLS', SMTP_SERVER, 587))
        methods.append(('SSL', SMTP_SERVER, 465))  # Fallback para SSL
    elif SMTP_PORT == 465:
        methods.append(('SSL', SMTP_SERVER, 465))
        methods.append(('STARTTLS', SMTP_SERVER, 587))  # Fallback para STARTTLS
    else:
        methods.append(('STARTTLS', SMTP_SERVER, SMTP_PORT))
        methods.append(('SSL', SMTP_SERVER, 465))  # Fallback para SSL

    for method_name, server_host, server_port in methods:
        try:
            print(f"[EMAIL] Tentando conectar ao servidor SMTP {server_host}:{server_port} usando {method_name}...")
            
            if method_name == 'SSL':
                # Usa SMTP_SSL para conexão SSL direta (porta 465)
                with smtplib.SMTP_SSL(server_host, server_port, timeout=30) as server:
                    print(f"[EMAIL] Autenticando com usuario: {SMTP_USERNAME}...")
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                    print(f"[EMAIL] Enviando e-mail de convite para {to_email}...")
                    server.send_message(msg)
            else:
                # Usa SMTP com STARTTLS (porta 587)
                with smtplib.SMTP(server_host, server_port, timeout=30) as server:
                    print("[EMAIL] Iniciando TLS...")
                    server.starttls()
                    print(f"[EMAIL] Autenticando com usuario: {SMTP_USERNAME}...")
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                    print(f"[EMAIL] Enviando e-mail de convite para {to_email}...")
                    server.send_message(msg)
            
            print(f"[SUCESSO] E-mail de convite enviado com sucesso para {to_email} usando {method_name}")
            return True
            
        except (OSError, ConnectionError) as e:
            error_msg = str(e)
            print(f"[ERRO] Erro de conexao ao tentar {method_name} em {server_host}:{server_port}: {error_msg}")
            if "Network is unreachable" in error_msg or "Connection refused" in error_msg:
                print(f"   ⚠️  Tentando metodo alternativo...")
                continue  # Tenta o próximo método
            else:
                import traceback
                traceback.print_exc()
                continue  # Tenta o próximo método
                
        except smtplib.SMTPAuthenticationError as e:
            print(f"[ERRO] ERRO DE AUTENTICACAO: Credenciais invalidas")
            print(f"   Detalhes: {e}")
            print(f"   Verifique SMTP_USERNAME e SMTP_PASSWORD no .env")
            import traceback
            traceback.print_exc()
            return False  # Não tenta outro método se for erro de autenticação
            
        except Exception as e:
            error_msg = str(e)
            print(f"[ERRO] Erro ao enviar e-mail de convite usando {method_name}: {error_msg}")
            if "535" in error_msg or "authentication" in error_msg.lower():
                print(f"   ⚠️  Erro de autenticacao - verifique credenciais SMTP")
                return False  # Não tenta outro método se for erro de autenticação
            import traceback
            traceback.print_exc()
            continue  # Tenta o próximo método
    
    print(f"[ERRO] Falha ao enviar e-mail de convite apos tentar todos os metodos")
    return False

def send_verification_token_email(to_email, verification_token, user_name):
    print(f"[EMAIL] ========================================")
    print(f"[EMAIL] Iniciando envio de email de verificacao")
    print(f"[EMAIL] Destinatario: {to_email}")
    print(f"[EMAIL] ========================================")
    
    if not _validate_smtp_config():
        print(f"[EMAIL] ❌ Validacao SMTP falhou - abortando envio")
        return False
    
    print(f"[EMAIL] ✅ Validacao SMTP passou - prosseguindo com envio")
    
    subject = 'Token de Verificação - Cadastro Apront'
    body = f"""
Olá {user_name}!

Você está se cadastrando na plataforma Apront.

Use o token abaixo para verificar seu email e concluir o cadastro:

🔐 TOKEN: {verification_token}

Este token expira em 10 minutos.

Se não foi você quem solicitou este cadastro, ignore este e-mail.

Atenciosamente,
Equipe Apront
"""
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = FROM_EMAIL or SMTP_USERNAME
    msg['To'] = to_email
    msg.set_content(body)

    # Tenta primeiro com STARTTLS (porta 587), depois com SSL (porta 465)
    methods = []
    if SMTP_PORT == 587:
        methods.append(('STARTTLS', SMTP_SERVER, 587))
        methods.append(('SSL', SMTP_SERVER, 465))  # Fallback para SSL
    elif SMTP_PORT == 465:
        methods.append(('SSL', SMTP_SERVER, 465))
        methods.append(('STARTTLS', SMTP_SERVER, 587))  # Fallback para STARTTLS
    else:
        methods.append(('STARTTLS', SMTP_SERVER, SMTP_PORT))
        methods.append(('SSL', SMTP_SERVER, 465))  # Fallback para SSL

    for method_name, server_host, server_port in methods:
        try:
            print(f"[EMAIL] Tentando conectar ao servidor SMTP {server_host}:{server_port} usando {method_name}...")
            
            if method_name == 'SSL':
                # Usa SMTP_SSL para conexão SSL direta (porta 465)
                with smtplib.SMTP_SSL(server_host, server_port, timeout=30) as server:
                    print(f"[EMAIL] Autenticando com usuario: {SMTP_USERNAME}...")
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                    print(f"[EMAIL] Enviando e-mail para {to_email}...")
                    server.send_message(msg)
            else:
                # Usa SMTP com STARTTLS (porta 587)
                with smtplib.SMTP(server_host, server_port, timeout=30) as server:
                    print("[EMAIL] Iniciando TLS...")
                    server.starttls()
                    print(f"[EMAIL] Autenticando com usuario: {SMTP_USERNAME}...")
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                    print(f"[EMAIL] Enviando e-mail para {to_email}...")
                    server.send_message(msg)
            
            print(f"[SUCESSO] E-mail de verificacao enviado com sucesso para {to_email} usando {method_name}")
            return True
            
        except (OSError, ConnectionError) as e:
            error_msg = str(e)
            print(f"[ERRO] Erro de conexao ao tentar {method_name} em {server_host}:{server_port}: {error_msg}")
            if "Network is unreachable" in error_msg or "Connection refused" in error_msg:
                print(f"   ⚠️  Railway pode estar bloqueando conexoes SMTP de saida")
                print(f"   ⚠️  Tentando metodo alternativo...")
                continue  # Tenta o próximo método
            else:
                import traceback
                traceback.print_exc()
                continue  # Tenta o próximo método
                
        except smtplib.SMTPAuthenticationError as e:
            print(f"[ERRO] ERRO DE AUTENTICACAO: Credenciais invalidas")
            print(f"   Verifique se o SMTP_USERNAME e SMTP_PASSWORD estao corretos")
            print(f"   Para Gmail, certifique-se de usar uma 'Senha de App' e nao a senha normal")
            print(f"   Detalhes: {e}")
            import traceback
            traceback.print_exc()
            return False  # Não tenta outro método se for erro de autenticação
            
        except smtplib.SMTPException as e:
            print(f"[ERRO] ERRO SMTP com {method_name}: {e}")
            import traceback
            traceback.print_exc()
            continue  # Tenta o próximo método
            
        except Exception as e:
            print(f"[ERRO] Erro ao enviar e-mail de verificacao usando {method_name}: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            continue  # Tenta o próximo método
    
    # Se chegou aqui, todos os métodos falharam
    print(f"[ERRO CRITICO] Nao foi possivel enviar e-mail apos tentar todos os metodos")
    print(f"   Verifique:")
    print(f"   1. Se as variaveis SMTP estao configuradas no Railway")
    print(f"   2. Se o Railway permite conexoes SMTP de saida")
    print(f"   3. Se o firewall do Railway nao esta bloqueando as portas 587 e 465")
    return False

def send_email(to_email, subject, body):
    """
    Função genérica para enviar e-mails
    
    Args:
        to_email: Email do destinatário
        subject: Assunto do e-mail
        body: Corpo do e-mail (texto)
    
    Returns:
        bool: True se enviado com sucesso, False caso contrário
    """
    if not _validate_smtp_config():
        return False
    
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = FROM_EMAIL or SMTP_USERNAME
    msg['To'] = to_email
    msg.set_content(body)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"[SUCESSO] E-mail enviado para {to_email}")
        return True
    except Exception as e:
        print(f"[ERRO] Erro ao enviar e-mail: {e}")
        import traceback
        traceback.print_exc()
        return False