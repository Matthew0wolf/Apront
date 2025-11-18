# 🔧 Solução: Erro 535 - Credenciais SMTP Inválidas

## ❌ Problema Identificado

```
Erro ao enviar e-mail de convite: (535, b'5.7.8 Username and Password not accepted...')
```

O erro **535** indica que o Gmail está rejeitando as credenciais de autenticação SMTP.

## ✅ Solução

### Para Gmail, você precisa usar uma **Senha de App** (App Password), não a senha normal da conta.

### Passo 1: Verificar Configurações Atuais

Execute na VPS:
```bash
docker exec apront-backend python -c "
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

### Passo 2: Criar Senha de App do Gmail

1. **Acesse:** https://myaccount.google.com/apppasswords
   - Ou: Google Account > Segurança > Verificação em duas etapas > Senhas de app

2. **Se a verificação em duas etapas não estiver ativada:**
   - Ative primeiro em: https://myaccount.google.com/security
   - Depois acesse as Senhas de app

3. **Criar Senha de App:**
   - Selecione "Aplicativo": `Email`
   - Selecione "Dispositivo": `Outro (nome personalizado)`
   - Digite: `Apront Backend`
   - Clique em "Gerar"
   - **Copie a senha de 16 caracteres** (ex: `abcd efgh ijkl mnop`)

### Passo 3: Atualizar Credenciais na VPS

#### Opção A: Se o .env está no container

1. **Encontrar onde está o .env:**
```bash
docker exec apront-backend find /app -name ".env" -type f
```

2. **Editar o .env:**
```bash
# Se estiver em /app/.env
docker exec -it apront-backend nano /app/.env
# ou
docker exec -it apront-backend vi /app/.env
```

3. **Atualizar as variáveis:**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop  # Senha de App (sem espaços)
FROM_EMAIL=seu_email@gmail.com
```

4. **Reiniciar o container:**
```bash
docker restart apront-backend
```

#### Opção B: Se o .env está no host (fora do container)

1. **Encontrar o arquivo .env no host:**
```bash
find /root -name ".env" -type f 2>/dev/null
find /home -name ".env" -type f 2>/dev/null
```

2. **Editar o arquivo:**
```bash
nano /caminho/para/.env
# ou
vi /caminho/para/.env
```

3. **Atualizar as variáveis** (mesmo formato acima)

4. **Reiniciar o container:**
```bash
docker restart apront-backend
```

#### Opção C: Usar variáveis de ambiente do Docker

Se o container foi criado com variáveis de ambiente, você pode:

1. **Ver como o container foi criado:**
```bash
docker inspect apront-backend | grep -A 20 "Env"
```

2. **Recriar o container com as novas variáveis:**
```bash
# Parar o container
docker stop apront-backend

# Recriar com novas variáveis (ajuste conforme necessário)
docker run -d \
  --name apront-backend \
  -e SMTP_SERVER=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_USERNAME=seu_email@gmail.com \
  -e SMTP_PASSWORD=abcdefghijklmnop \
  -e FROM_EMAIL=seu_email@gmail.com \
  # ... outras variáveis ...
  apront-backend
```

### Passo 4: Testar o Envio

Execute na VPS:
```bash
docker exec apront-backend python -c "
import sys
sys.path.insert(0, '/app')
from email_utils import _validate_smtp_config, send_invite_email

print('=== Testando validacao SMTP ===')
result = _validate_smtp_config()
print(f'Validacao: {result}')

if result:
    print('\\n=== Testando envio de convite ===')
    result = send_invite_email('teste@teste.com', 'TOKEN_TESTE_123')
    print(f'Envio: {result}')
else:
    print('\\n❌ Validacao SMTP falhou')
"
```

### Passo 5: Verificar Logs

Monitore os logs em tempo real:
```bash
docker logs -f apront-backend 2>&1 | grep -i -E "\[EMAIL\]|\[ERRO\]|\[VALIDACAO\]"
```

## 🔍 Verificações Adicionais

### Se ainda não funcionar:

1. **Verificar se a senha de app está correta:**
   - Deve ter exatamente 16 caracteres
   - Sem espaços (remova espaços se houver)
   - Exemplo: `abcdefghijklmnop` (não `abcd efgh ijkl mnop`)

2. **Verificar se a verificação em duas etapas está ativa:**
   - https://myaccount.google.com/security

3. **Verificar se "Permitir aplicativos menos seguros" está desabilitado:**
   - Isso não é mais necessário com Senha de App
   - Senha de App é o método correto

4. **Testar conexão SMTP manualmente:**
```bash
docker exec apront-backend python -c "
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
try:
    server.login('seu_email@gmail.com', 'sua_senha_app')
    print('✅ Login bem-sucedido!')
    server.quit()
except Exception as e:
    print(f'❌ Erro: {e}')
"
```

## 📝 Notas Importantes

- **NUNCA** use a senha normal do Gmail
- **SEMPRE** use Senha de App para aplicações
- A Senha de App tem 16 caracteres, sem espaços
- Se mudar a senha de app, atualize no .env e reinicie o container

## ✅ Após Corrigir

1. Reinicie o container: `docker restart apront-backend`
2. Teste enviando um convite pelo frontend
3. Verifique os logs para confirmar sucesso

