# 📧 Configurar Email Obrigatório para Cadastro

## ⚠️ Importante

O cadastro **só funciona se o email for enviado com sucesso**. O token de verificação é enviado por email e é obrigatório para completar o cadastro.

## 🔧 Solução: Configurar SMTP no Railway

O erro `[Errno 101] Network is unreachable` indica que o Railway está bloqueando conexões SMTP de saída para Gmail. A solução é usar um serviço de email terceiro.

### **Opção Recomendada: SendGrid (Gratuito até 100 emails/dia)**

#### **Passo 1: Criar Conta SendGrid**

1. Acesse: https://sendgrid.com
2. Clique em **"Start for free"**
3. Preencha o formulário de cadastro
4. Verifique seu email

#### **Passo 2: Criar API Key**

1. No dashboard do SendGrid, vá em **Settings** → **API Keys**
2. Clique em **"Create API Key"**
3. Dê um nome (ex: "Apront Production")
4. Selecione **"Full Access"** ou **"Restricted Access"** (com permissões de Mail Send)
5. Clique em **"Create & View"**
6. **COPIE A API KEY** (ela só aparece uma vez!)

#### **Passo 3: Verificar Remetente**

1. No SendGrid, vá em **Settings** → **Sender Authentication**
2. Clique em **"Verify a Single Sender"**
3. Preencha os dados do remetente
4. Verifique o email enviado pelo SendGrid
5. Anote o email verificado (ex: `noreply@seu_dominio.com`)

#### **Passo 4: Configurar no Railway**

No Railway Dashboard → Serviço "Apront" → Settings → Variables:

**Variável 1:**
- **Name:** `SMTP_SERVER`
- **Value:** `smtp.sendgrid.net`

**Variável 2:**
- **Name:** `SMTP_PORT`
- **Value:** `587`

**Variável 3:**
- **Name:** `SMTP_USERNAME`
- **Value:** `apikey`

**Variável 4:**
- **Name:** `SMTP_PASSWORD`
- **Value:** `SUA_API_KEY_DO_SENDGRID` (cole a API key que você copiou)

**Variável 5:**
- **Name:** `FROM_EMAIL`
- **Value:** `noreply@seu_dominio.com` (o email verificado no SendGrid)

#### **Passo 5: Fazer Redeploy**

1. No Railway, vá em **Deployments**
2. Clique em **"Redeploy"** no último deployment
3. Aguarde o deploy terminar

#### **Passo 6: Testar**

Tente fazer um cadastro. Os logs devem mostrar:

```
[EMAIL] ========================================
[EMAIL] Iniciando envio de email de verificacao
[VALIDACAO] Validando configuracoes SMTP...
   SMTP_SERVER: smtp.sendgrid.net
   SMTP_PORT: 587
   SMTP_USERNAME: apikey
   SMTP_PASSWORD: DEFINIDO (X caracteres)
   FROM_EMAIL: noreply@seu_dominio.com
[OK] Configuracoes SMTP validadas!
[EMAIL] ✅ Validacao SMTP passou - prosseguindo com envio
[EMAIL] Tentando conectar ao servidor SMTP smtp.sendgrid.net:587 usando STARTTLS...
[EMAIL] Iniciando TLS...
[EMAIL] Autenticando com usuario: apikey...
[EMAIL] Enviando e-mail para usuario@gmail.com...
[SUCESSO] E-mail de verificacao enviado com sucesso para usuario@gmail.com usando STARTTLS
```

### **Opção Alternativa: Mailgun**

Se preferir Mailgun (gratuito até 5.000 emails/mês):

1. Crie conta: https://www.mailgun.com
2. Configure no Railway:
   - `SMTP_SERVER` = `smtp.mailgun.org`
   - `SMTP_PORT` = `587`
   - `SMTP_USERNAME` = `postmaster@seu_dominio.mailgun.org`
   - `SMTP_PASSWORD` = `sua_senha_do_mailgun`
   - `FROM_EMAIL` = `noreply@seu_dominio.com`

## 🔍 Verificar Logs

Após configurar, os logs devem mostrar:

- ✅ `[OK] Configuracoes SMTP validadas!` - Variáveis configuradas corretamente
- ✅ `[SUCESSO] E-mail de verificacao enviado` - Email enviado com sucesso
- ❌ `[ERRO] Erro de conexao` - Railway ainda bloqueando (use SendGrid/Mailgun)
- ❌ `[ERRO] ERRO DE AUTENTICACAO` - Credenciais incorretas

## 📋 Checklist

- [ ] Conta SendGrid criada
- [ ] API Key gerada e copiada
- [ ] Remetente verificado no SendGrid
- [ ] 5 variáveis SMTP configuradas no Railway
- [ ] Redeploy feito
- [ ] Logs mostram validação SMTP bem-sucedida
- [ ] Teste de cadastro funciona

## ⚠️ Por Que Gmail Não Funciona?

O Railway bloqueia conexões SMTP de saída para serviços como Gmail por segurança. Serviços como SendGrid e Mailgun são projetados para serem usados em aplicações e têm melhor compatibilidade com plataformas de cloud.

## 🎯 Resultado Esperado

Após configurar corretamente:
- ✅ Email de verificação é enviado
- ✅ Usuário recebe o token por email
- ✅ Cadastro pode ser completado normalmente
- ✅ Sem erros no backend

