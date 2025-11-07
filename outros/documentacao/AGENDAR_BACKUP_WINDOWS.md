# 📅 Como Agendar Backup Automático no Windows

## 🎯 Objetivo

Configurar o Windows Task Scheduler para executar backup automático do banco de dados PostgreSQL.

---

## 📋 Pré-requisitos

- ✅ PostgreSQL instalado (com pg_dump no PATH)
- ✅ Python 3 instalado
- ✅ Variáveis de ambiente configuradas (opcional)

---

## 🚀 Passo a Passo

### **1. Testar Backup Manual**

Antes de agendar, teste o backup manualmente:

```cmd
cd backend
BACKUP_AUTOMATICO.bat
```

Se funcionar, você verá "BACKUP CONCLUÍDO COM SUCESSO!".

---

### **2. Abrir o Agendador de Tarefas**

**Opção A:**
1. Pressione `Windows + R`
2. Digite: `taskschd.msc`
3. Pressione Enter

**Opção B:**
1. Menu Iniciar
2. Pesquise: "Agendador de Tarefas"
3. Clique para abrir

---

### **3. Criar Nova Tarefa**

1. No painel direito, clique em **"Criar Tarefa..."** (não "Criar Tarefa Básica")

2. **Aba Geral:**
   - Nome: `Apront - Backup Automático`
   - Descrição: `Backup diário do banco de dados PostgreSQL`
   - ✅ Executar estando o usuário conectado ou não
   - ✅ Executar com privilégios mais altos

3. **Aba Disparadores:**
   - Clique em **"Novo..."**
   - Configuração sugerida:
     - **Iniciar tarefa:** Diariamente
     - **Horário:** 02:00:00 (2 da manhã)
     - **Repetir a tarefa a cada:** (opcional) 12 horas
     - **Por um período de:** 1 dia
   - Clique em **OK**

4. **Aba Ações:**
   - Clique em **"Novo..."**
   - **Ação:** Iniciar um programa
   - **Programa/script:** 
     ```
     C:\caminho\completo\para\backend\BACKUP_AUTOMATICO.bat
     ```
   - **Iniciar em:** 
     ```
     C:\caminho\completo\para\backend
     ```
   - Clique em **OK**

5. **Aba Condições:**
   - ❌ Desmarque "Iniciar a tarefa apenas se o computador estiver conectado à energia CA"
   - ✅ Marque "Ativar tarefa caso tenha sido perdida"

6. **Aba Configurações:**
   - ✅ Permitir que a tarefa seja executada sob demanda
   - ✅ Executar tarefa assim que possível depois de uma execução agendada perdida
   - Se a tarefa já estiver sendo executada: **Não iniciar uma nova instância**

7. Clique em **OK** para criar a tarefa

---

## ✅ Testar a Tarefa

Para testar sem aguardar o horário agendado:

1. No Agendador de Tarefas, encontre a tarefa "Apront - Backup Automático"
2. Clique com botão direito
3. Selecione **"Executar"**
4. Verifique se o backup foi criado em `backend/backups/`

---

## 📁 Localização dos Backups

Os backups são salvos em:
```
backend/backups/apront_backup_YYYYMMDD_HHMMSS.sql.gz
```

Exemplo:
```
backend/backups/apront_backup_20241015_020000.sql.gz
```

---

## 🔍 Verificar Logs

Para ver o histórico de execução:

1. Agendador de Tarefas
2. Clique na tarefa "Apront - Backup Automático"
3. Na aba inferior, veja **"Histórico"**

Ou veja o arquivo de log:
```
backend/backup.log
```

---

## 📊 Gerenciamento de Backups

### **Listar Backups Disponíveis:**

```cmd
cd backend
python backup_database.py --list
```

### **Limpar Backups Antigos (manualmente):**

```cmd
cd backend
python backup_database.py --keep-days 7
```

Isso remove backups com mais de 7 dias.

---

## 🔄 Restaurar um Backup

```cmd
cd backend
python restore_database.py backups\apront_backup_20241015_020000.sql.gz
```

⚠️ **ATENÇÃO:** Isso irá sobrescrever o banco atual!

---

## 🐛 Resolução de Problemas

### **Erro: "pg_dump não reconhecido"**

Adicione PostgreSQL ao PATH:

1. Painel de Controle → Sistema → Configurações avançadas
2. Variáveis de Ambiente
3. Editar variável PATH
4. Adicionar: `C:\Program Files\PostgreSQL\15\bin`
5. Reiniciar terminal

### **Erro: "Acesso negado"**

Execute o Agendador de Tarefas como Administrador:
1. Clique com botão direito no ícone
2. "Executar como administrador"

### **Backup não está sendo criado**

Verifique:
1. Tarefa está habilitada?
2. Horário está correto?
3. Computador estava ligado no horário?
4. Veja o histórico da tarefa para erros

---

## 💡 Dicas

### **Backup para Nuvem**

Adicione ao final do `BACKUP_AUTOMATICO.bat`:

```batch
REM Copiar para OneDrive/Dropbox
xcopy /Y backups\*.sql.gz "C:\Users\%USERNAME%\OneDrive\Backups\Apront\"
```

### **Notificação de Backup**

Adicione ao final do script:

```batch
REM Enviar email de confirmação (requer configuração de SMTP)
python send_backup_notification.py
```

### **Rotação de Backups**

O script já mantém backups por 30 dias (padrão).  
Para mudar:

```batch
python backup_database.py --compress --keep-days 7
```

---

**Documentação criada em:** Sprint 9  
**Sistema:** Windows Task Scheduler  
**Testado em:** Windows 10/11

