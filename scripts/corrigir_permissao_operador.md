# 🔧 Solução: Operador não consegue ver conteúdo do evento

## ❌ Problema

Usuário foi convidado como apresentador, admin colocou como operador e apresentador (`can_operate = true` e `can_present = true`), mas ao tentar entrar como operador, não aparece nada além do botão de voltar.

## 🔍 Causa Provável

O problema pode ser que:
1. O usuário não está na tabela `RundownMember` para os rundowns criados
2. O rundown não está sendo carregado corretamente no frontend
3. O cache está desatualizado

## ✅ Solução

### 1. Verificar se o usuário está na tabela RundownMember

Execute na VPS:
```bash
docker exec apront-postgres psql -U postgres -d apront_db -c "
SELECT u.id, u.name, u.email, u.role, u.can_operate, u.can_present, 
       rm.rundown_id, r.name as rundown_name
FROM users u
LEFT JOIN rundown_members rm ON u.id = rm.user_id
LEFT JOIN rundowns r ON rm.rundown_id = r.id
WHERE u.email = 'email_do_usuario@exemplo.com';
"
```

### 2. Adicionar usuário como membro de todos os rundowns da empresa

Se o usuário não estiver na tabela `RundownMember`, execute:
```bash
docker exec apront-postgres psql -U postgres -d apront_db -c "
-- Encontrar ID do usuário
SELECT id, name, email, company_id FROM users WHERE email = 'email_do_usuario@exemplo.com';

-- Adicionar usuário como membro de todos os rundowns da empresa
INSERT INTO rundown_members (rundown_id, user_id, role)
SELECT r.id, u.id, 'member'
FROM rundowns r
CROSS JOIN users u
WHERE u.email = 'email_do_usuario@exemplo.com'
  AND r.company_id = u.company_id
  AND NOT EXISTS (
    SELECT 1 FROM rundown_members rm 
    WHERE rm.rundown_id = r.id AND rm.user_id = u.id
  );
"
```

### 3. Verificar permissões do usuário

```bash
docker exec apront-postgres psql -U postgres -d apront_db -c "
UPDATE users 
SET can_operate = TRUE, can_present = TRUE
WHERE email = 'email_do_usuario@exemplo.com';
"
```

### 4. Limpar cache e reiniciar

```bash
# Reiniciar backend
docker restart apront-backend

# Aguardar alguns segundos
sleep 5

# Verificar logs
docker logs apront-backend --tail=50
```

## 🔄 Solução Automática (Script Python)

Crie um script para corrigir automaticamente:

```python
# scripts/corrigir_membro_rundown.py
from models import db, User, Rundown, RundownMember

def corrigir_membro_rundown(email_usuario):
    """Adiciona usuário como membro de todos os rundowns da empresa"""
    user = User.query.filter_by(email=email_usuario).first()
    if not user:
        print(f"❌ Usuário {email_usuario} não encontrado")
        return
    
    print(f"✅ Usuário encontrado: {user.name} (ID: {user.id}, Company: {user.company_id})")
    
    # Buscar todos os rundowns da empresa
    rundowns = Rundown.query.filter_by(company_id=user.company_id).all()
    print(f"📋 Encontrados {len(rundowns)} rundowns na empresa")
    
    # Adicionar usuário como membro de todos os rundowns
    adicionados = 0
    for rundown in rundowns:
        # Verificar se já é membro
        membro = RundownMember.query.filter_by(
            rundown_id=rundown.id, 
            user_id=user.id
        ).first()
        
        if not membro:
            novo_membro = RundownMember(
                rundown_id=rundown.id,
                user_id=user.id,
                role='member'
            )
            db.session.add(novo_membro)
            adicionados += 1
            print(f"  ✅ Adicionado ao rundown: {rundown.name} (ID: {rundown.id})")
        else:
            print(f"  ⏭️  Já é membro do rundown: {rundown.name}")
    
    # Garantir permissões
    if not user.can_operate:
        user.can_operate = True
        print(f"  ✅ Habilitado can_operate")
    
    if not user.can_present:
        user.can_present = True
        print(f"  ✅ Habilitado can_present")
    
    db.session.commit()
    print(f"\n✅ Concluído! {adicionados} rundowns adicionados ao usuário")

# Uso:
# corrigir_membro_rundown('email_do_usuario@exemplo.com')
```

## 📝 Verificação Final

Após corrigir, verifique:

1. **No banco de dados:**
```sql
SELECT u.email, u.can_operate, u.can_present, 
       COUNT(rm.rundown_id) as total_rundowns
FROM users u
LEFT JOIN rundown_members rm ON u.id = rm.user_id
WHERE u.email = 'email_do_usuario@exemplo.com'
GROUP BY u.id, u.email, u.can_operate, u.can_present;
```

2. **No frontend:**
   - Faça logout e login novamente
   - Acesse `/projects`
   - Deve ver todos os rundowns da empresa
   - Ao clicar em um rundown e selecionar "Operador", deve carregar o conteúdo

## 🚀 Próximos Passos

1. Execute os comandos SQL acima na VPS
2. Reinicie o backend
3. Peça para o usuário fazer logout e login novamente
4. Teste acessar um rundown como operador

