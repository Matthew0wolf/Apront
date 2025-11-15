# ✅ Solução: Permissões do Apresentador Corrigidas

## ❌ Problema

Usuário convidado como apresentador não via as opções de:
- ❌ **Apresentador** na página de seleção de role
- ❌ **Modo Ensaio** na página de seleção de role

## 🔍 Causa

O usuário apresentador tinha `can_present = FALSE` no banco de dados. A página `RoleSelectionView` verifica:
```javascript
{(user?.role === 'admin' || user?.can_present) && (
  // Mostra opção de Apresentador
)}
```

Se `can_present` for `FALSE`, a opção não aparece.

## ✅ Correções Aplicadas

### 1. Criação de Usuários Corrigida

**Ao aceitar convite (`/accept-invite`):**
- ✅ Se role = `presenter` → `can_present = TRUE` automaticamente
- ✅ Se role = `operator` → `can_operate = TRUE` automaticamente
- ✅ Se role = `admin` → `can_operate = TRUE` e `can_present = TRUE`

**Ao criar usuário admin (cadastro):**
- ✅ `can_operate = TRUE` e `can_present = TRUE` automaticamente

### 2. Usuários Existentes Atualizados

Atualizei no banco de dados:
- ✅ Todos os `presenter` → `can_present = TRUE`
- ✅ Todos os `operator` → `can_operate = TRUE`
- ✅ Todos os `admin` → `can_operate = TRUE` e `can_present = TRUE`

---

## 🚀 **IMPORTANTE: Faça Logout e Login Novamente**

**O usuário apresentador precisa fazer logout e login novamente para receber as permissões atualizadas!**

1. **Faça logout** no frontend
2. **Faça login novamente** com o usuário apresentador
3. **Acesse** `/project/1/select-role`
4. **Deve aparecer** as opções de Apresentador e Modo Ensaio

---

## ✅ Teste

Após fazer logout/login:

1. **Acesse** `/project/1/select-role`
2. **Deve aparecer:**
   - ✅ **Apresentador** (se `can_present = TRUE`)
   - ✅ **Modo Ensaio** (se `can_present = TRUE`)
   - ❌ **Operador** (só aparece se `can_operate = TRUE` ou `role = admin`)

---

## 📝 Verificação no Banco

Para verificar as permissões de um usuário:

```sql
SELECT id, name, email, role, can_operate, can_present 
FROM users 
WHERE email = 'email_do_usuario@exemplo.com';
```

**Deve mostrar:**
- `role = 'presenter'` → `can_present = TRUE`
- `role = 'operator'` → `can_operate = TRUE`
- `role = 'admin'` → `can_operate = TRUE` e `can_present = TRUE`

---

## 🔧 Código Atualizado

### `backend/routes/auth.py` - `accept_invite`:
```python
# Define permissões baseadas no role
can_operate = invite.role == UserRole.operator or invite.role == UserRole.admin
can_present = invite.role == UserRole.presenter or invite.role == UserRole.admin

user = User(
    ...
    can_operate=can_operate,
    can_present=can_present
)
```

### `backend/routes/auth.py` - `verify_token` (cadastro):
```python
user = User(
    ...
    can_operate=True,  # Admin tem todas as permissões
    can_present=True   # Admin tem todas as permissões
)
```

---

**Faça logout e login novamente para aplicar as correções!** 🎉

