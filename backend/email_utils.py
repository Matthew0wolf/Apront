import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from pathlib import Path

# Carrega o arquivo .env da pasta backend
backend_dir = Path(__file__).parent.absolute()
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)

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
    invite_url = f"http://localhost:3000/accept-invite?token={invite_token}"
    
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

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"[SUCESSO] E-mail de convite enviado para {to_email}")
        return True
    except Exception as e:
        print(f"[ERRO] Erro ao enviar e-mail de convite: {e}")
        import traceback
        traceback.print_exc()
        return False

def send_verification_token_email(to_email, verification_token, user_name):
    if not _validate_smtp_config():
        return False
    
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

    try:
        print(f"[EMAIL] Tentando conectar ao servidor SMTP {SMTP_SERVER}:{SMTP_PORT}...")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            print("[EMAIL] Iniciando TLS...")
            server.starttls()
            print(f"[EMAIL] Autenticando com usuario: {SMTP_USERNAME}...")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            print(f"[EMAIL] Enviando e-mail para {to_email}...")
            server.send_message(msg)
        print(f"[SUCESSO] E-mail de verificacao enviado com sucesso para {to_email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"[ERRO] ERRO DE AUTENTICACAO: Credenciais invalidas")
        print(f"   Verifique se o SMTP_USERNAME e SMTP_PASSWORD estao corretos")
        print(f"   Para Gmail, certifique-se de usar uma 'Senha de App' e nao a senha normal")
        print(f"   Detalhes: {e}")
        import traceback
        traceback.print_exc()
        return False
    except smtplib.SMTPException as e:
        print(f"[ERRO] ERRO SMTP: {e}")
        import traceback
        traceback.print_exc()
        return False
    except Exception as e:
        print(f"[ERRO] Erro ao enviar e-mail de verificacao: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
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