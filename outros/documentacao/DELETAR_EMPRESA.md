# 🗑️ Como Deletar uma Empresa e Seus Usuários

## ⚠️ ATENÇÃO

**Esta operação é IRREVERSÍVEL!** Todos os dados da empresa serão permanentemente deletados:
- ✅ Todos os usuários
- ✅ Todos os rundowns
- ✅ Todos os convites
- ✅ Todas as assinaturas
- ✅ Todas as notificações
- ✅ Todos os logs e eventos

## 🚀 Como Usar

### Opção 1: Executar no Container Docker (Recomendado)

```bash
# 1. Entre no container do backend
docker compose exec backend bash

# 2. Execute o script
python scripts/delete_company.py "apront"
```

### Opção 2: Executar Localmente (se estiver rodando localmente)

```bash
cd backend
python scripts/delete_company.py "apront"
```

## 📋 Passo a Passo

1. **Execute o script** com o nome da empresa:
   ```bash
   python scripts/delete_company.py "apront"
   ```

2. **O script mostrará:**
   - ✅ Empresa encontrada
   - ✅ Lista de dados que serão deletados
   - ⚠️ Confirmação necessária

3. **Digite `SIM` (em maiúsculas)** para confirmar a deleção

4. **O script deletará:**
   - Dados relacionados aos usuários (likes, ratings, ensaios, etc)
   - Todos os rundowns
   - Todos os convites
   - Todas as assinaturas
   - Todas as notificações
   - Todos os logs
   - Todos os usuários
   - A empresa

## 🔍 Verificar Empresas Disponíveis

Se você não souber o nome exato da empresa, o script mostrará todas as empresas disponíveis se a empresa não for encontrada.

## 📝 Exemplo de Execução

```bash
$ python scripts/delete_company.py "apront"

🔍 Empresa encontrada: apront (ID: 1)

📊 Dados que serão deletados:
   - Usuários: 3
   - Rundowns: 5
   - Convites: 2
   - Assinaturas: 1
   - Notificações: 10
   - Logs de uso: 25
   - Eventos do sistema: 15
   - Limites da empresa: Sim

⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!

❓ Tem certeza que deseja deletar a empresa 'apront'? (digite 'SIM' para confirmar): SIM

🗑️  Iniciando deleção...
   🗑️  Deletando dados relacionados aos 3 usuários...
      ✅ Template likes/ratings deletados
      ✅ Ensaios deletados
      ✅ Preferências de notificação deletadas
      ✅ Notificações dos usuários deletadas
      ✅ Eventos do sistema dos usuários deletados
      ✅ Membros de rundowns deletados
   🗑️  Deletando 5 rundowns...
      ✅ Rundowns deletados
   🗑️  Deletando 2 convites...
      ✅ Convites deletados
   🗑️  Deletando 1 assinaturas...
      ✅ Assinaturas deletadas
   🗑️  Deletando 10 notificações...
      ✅ Notificações deletadas
   🗑️  Deletando 25 logs de uso...
      ✅ Logs de uso deletados
   🗑️  Deletando 15 eventos do sistema...
      ✅ Eventos do sistema deletados
   🗑️  Deletando limites da empresa...
      ✅ Limites deletados
   🗑️  Deletando 3 usuários...
      ✅ Usuários deletados
   🗑️  Deletando empresa...

✅ Empresa 'apront' e todos os seus dados foram deletados com sucesso!
```

## 🛡️ Segurança

- ✅ O script exige confirmação explícita (`SIM`)
- ✅ Mostra todos os dados que serão deletados antes de confirmar
- ✅ Usa transações do banco de dados (rollback em caso de erro)
- ✅ Deleta dados na ordem correta (respeitando foreign keys)

## ❌ Cancelar

Se você digitar qualquer coisa diferente de `SIM`, a operação será cancelada e nada será deletado.

