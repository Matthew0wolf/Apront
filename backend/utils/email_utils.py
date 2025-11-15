import os
import smtplib
from email.message import EmailMessage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
FROM_EMAIL = os.getenv('FROM_EMAIL')


def send_email(to_email, subject, html_body, text_body=None):
    """
    Função genérica para enviar emails
    
    Args:
        to_email: Email do destinatário
        subject: Assunto do email
        html_body: Corpo do email em HTML
        text_body: Corpo do email em texto (opcional, será gerado do HTML se não fornecido)
    """
    if not SMTP_SERVER or not SMTP_USERNAME or not SMTP_PASSWORD:
        print("AVISO: Configuracoes de email nao encontradas - email nao enviado")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL or SMTP_USERNAME
        msg['To'] = to_email
        
        # Adicionar versão HTML
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Adicionar versão texto se fornecida
        if text_body:
            text_part = MIMEText(text_body, 'plain', 'utf-8')
            msg.attach(text_part)
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False

def send_invite_email(to_email, invite_token):
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
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg.set_content(body)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Erro ao enviar e-mail de convite: {e}")
        return False

def send_verification_token_email(to_email, verification_token, user_name):
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
    msg['From'] = FROM_EMAIL
    msg['To'] = to_email
    msg.set_content(body)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Erro ao enviar e-mail de verificação: {e}")
        return False