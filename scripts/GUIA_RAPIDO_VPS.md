# 🚀 Guia Rápido: Conectar na VPS e Verificar Logs de Email

## 📍 Informações da VPS
- **IP:** 72.60.56.28
- **Usuário padrão:** `root` (ou o usuário configurado)

## 🔧 Pré-requisitos

### Windows
1. **Instalar OpenSSH Client:**
   ```powershell
   # Abra PowerShell como Administrador
   Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
   ```

2. **Ou usar PuTTY:**
   - Download: https://www.putty.org/
   - Host: `72.60.56.28`
   - Port: `22`

## 🎯 Comandos Rápidos

### 1. Conectar na VPS
```bash
ssh root@72.60.56.28
```

### 2. Ver Logs de Email (Últimas 100 linhas)
```bash
cd /root/Apront  # Ajuste o caminho conforme necessário
docker compose logs --tail=100 backend | grep -i "\[EMAIL\]"
```

### 3. Monitorar Logs em Tempo Real
```bash
cd /root/Apront
docker compose logs -f backend | grep -i "\[EMAIL\]"
```

### 4. Ver Todos os Erros de Email
```bash
cd /root/Apront
docker compose logs backend | grep -i "\[ERRO.*EMAIL\]"
```

### 5. Ver Logs de Segurança
```bash
cd /root/Apront
tail -100 backend/security.log
```

### 6. Verificar Status dos Containers
```bash
cd /root/Apront
docker compose ps
```

### 7. Testar Configuração SMTP
```bash
cd /root/Apront
docker compose exec backend python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('SMTP_SERVER:', os.getenv('SMTP_SERVER'))
print('SMTP_PORT:', os.getenv('SMTP_PORT'))
print('SMTP_USERNAME:', os.getenv('SMTP_USERNAME'))
print('SMTP_PASSWORD:', 'DEFINIDO' if os.getenv('SMTP_PASSWORD') else 'NAO DEFINIDO')
print('FROM_EMAIL:', os.getenv('FROM_EMAIL'))
"
```

### 8. Ver Erros Recentes
```bash
cd /root/Apront
docker compose logs backend | grep -i error | tail -50
```

### 9. Reiniciar Backend
```bash
cd /root/Apront
docker compose restart backend
```

## 📋 O Que Procurar nos Logs

### ✅ Logs de Sucesso
- `[SUCESSO] E-mail de convite enviado com sucesso`
- `[EMAIL] URL do convite gerada: http://72.60.56.28/accept-invite?token=...`
- `[OK] Configuracoes SMTP validadas!`

### ❌ Logs de Erro
- `[ERRO] Erro de conexao ao tentar`
- `[ERRO] ERRO DE AUTENTICACAO: Credenciais invalidas`
- `[ERRO] Configuracoes SMTP nao encontradas!`
- `[ERRO] Falha ao enviar e-mail de convite apos tentar todos os metodos`

### 🔍 Logs de Validação
- `[VALIDACAO] Validando configuracoes SMTP...`
- `SMTP_SERVER: ...`
- `SMTP_USERNAME: ...`
- `SMTP_PASSWORD: DEFINIDO` ou `NAO DEFINIDO`

## 🛠️ Scripts Disponíveis

### Windows (PowerShell)
```powershell
.\scripts\conectar_vps_ver_logs.ps1
```

### Windows (Batch)
```cmd
.\scripts\conectar_vps_ver_logs.bat
```

## 📝 Notas Importantes

1. **Caminho do Projeto:** Ajuste `/root/Apront` conforme o caminho real na sua VPS
2. **Usuário SSH:** Pode ser `root` ou outro usuário configurado
3. **Senha:** Você precisará informar a senha ao conectar via SSH
4. **Chave SSH:** Se tiver chave SSH configurada, não precisará de senha

## 🔐 Problemas Comuns

### Erro: "Connection refused"
- Verifique se o SSH está habilitado na VPS
- Verifique se a porta 22 está aberta no firewall

### Erro: "Permission denied"
- Verifique o usuário e senha
- Verifique se o usuário tem permissões adequadas

### Erro: "docker compose: command not found"
- Use `docker-compose` (com hífen) em vez de `docker compose`
- Ou instale a versão mais recente do Docker

## 📞 Próximos Passos

Após verificar os logs:
1. Identifique o erro específico
2. Verifique as configurações SMTP no `.env`
3. Teste o envio de email manualmente
4. Verifique se as credenciais estão corretas
5. Verifique se o firewall permite conexões SMTP (portas 587/465)

