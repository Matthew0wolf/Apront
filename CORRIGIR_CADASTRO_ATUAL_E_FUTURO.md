# ✅ Correção Aplicada - Cadastro com payment_verified

## ✅ O que foi corrigido:

O código de cadastro agora define `payment_verified = True` automaticamente para novos cadastros.

## 🔧 Corrigir Cadastro Atual:

### **1. Verificar nome da empresa do usuário:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "SELECT u.email, u.name, c.name as company_name, c.payment_verified FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.email = 'matheuselpidio5@gmail.com';"
```

**Anote o nome da empresa** (provavelmente "GestAuto").

### **2. Corrigir payment_verified da empresa:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "UPDATE companies SET payment_verified = true WHERE id IN (SELECT company_id FROM users WHERE email = 'matheuselpidio5@gmail.com');"
```

**OU se preferir usar o nome da empresa diretamente:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "UPDATE companies SET payment_verified = true WHERE name = 'GestAuto';"
```

### **3. Verificar se funcionou:**

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "SELECT name, payment_verified FROM companies WHERE name = 'GestAuto';"
```

**Deve mostrar `payment_verified = t` (true).**

### **4. Testar:**

1. **Faça logout e login novamente**
2. **Acesse o dashboard**
3. **Os erros 403 devem desaparecer**

## ✅ Futuros Cadastros:

Agora **todos os novos cadastros** terão `payment_verified = True` automaticamente. Não será necessário corrigir manualmente.

## 📋 Comando Rápido (usando nome da empresa):

```bash
docker compose exec postgres psql -U apront_user -d apront_db -c "UPDATE companies SET payment_verified = true WHERE name = 'GestAuto';"
```

Depois, **faça logout e login novamente**.

