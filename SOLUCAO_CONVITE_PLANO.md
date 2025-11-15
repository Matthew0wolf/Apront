# ✅ Solução: Erro "Empresa ou plano não encontrado" ao Enviar Convite

## ❌ Problema

Ao tentar enviar convite para um usuário:
- **Erro:** "Empresa ou plano não encontrado"
- **Causa:** Empresas não tinham planos associados (`plan_id` era NULL)

## ✅ Correções Aplicadas

### 1. Planos Criados

Criei 3 planos padrão no banco:
- ✅ **Starter** - R$ 850/mês - 5 membros, 10 rundowns, 1GB
- ✅ **Professional** - R$ 1.500/mês - 20 membros, 50 rundowns, 10GB
- ✅ **Enterprise** - R$ 3.000/mês - 100 membros, 200 rundowns, 100GB

### 2. Empresas Atualizadas

Todas as empresas existentes foram associadas ao plano **Starter**:
- ✅ Empresa ID 1: GestAuto → Starter
- ✅ Empresa ID 2: GestAuto → Starter
- ✅ Empresa ID 3: GestAuto → Starter
- ✅ Empresa ID 4: GestAuto → Starter

### 3. Criação Automática de Plano

Agora, quando uma nova empresa é criada:
- ✅ Automaticamente associa ao plano **Starter**
- ✅ Se não houver planos, cria um plano básico automaticamente

### 4. Campos de Data Corrigidos

- ✅ `plans.created_at` e `updated_at` → VARCHAR(50)
- ✅ `company_limits.last_updated` → VARCHAR(50)

---

## 🚀 **IMPORTANTE: Reinicie o Backend**

**As correções só funcionarão após reiniciar o backend!**

1. **Pare o backend atual:**
   - Vá no terminal onde o backend está rodando
   - Pressione `Ctrl+C`

2. **Inicie novamente:**
   ```powershell
   cd "C:\Users\mathe\Downloads\horizons-export-4626fa91-413b-4b5e-82c2-f483f8d88af5 (1)\Apront"
   python main.py
   ```

3. **Aguarde aparecer:**
   ```
   Usando PostgreSQL: localhost:5433/apront_db
   OK: Seguranca e rate limiting ativados
   * Running on http://0.0.0.0:5001
   ```

---

## ✅ Teste o Convite

Após reiniciar o backend:

1. **Acesse a página de convites** no frontend
2. **Preencha o email** do usuário a ser convidado
3. **Selecione o role** (operator ou presenter)
4. **Clique em "Enviar Convite"**

Deve funcionar agora! ✅

---

## 📝 Sobre o Erro 403 FORBIDDEN

O erro `403 FORBIDDEN` em `/api/admin/invites` pode ser causado por:

1. **Token JWT inválido ou expirado** → Faça login novamente
2. **Usuário não é admin** → Apenas admins podem enviar convites
3. **CORS ainda não corrigido** → Reinicie o backend

---

## 🔍 Verificação

Para verificar se está tudo certo:

```sql
-- Ver empresas e planos
SELECT c.id, c.name, c.plan_id, p.name as plan_name 
FROM companies c 
LEFT JOIN plans p ON c.plan_id = p.id;

-- Ver planos disponíveis
SELECT id, name, max_members, max_rundowns 
FROM plans;
```

---

**Reinicie o backend e teste o convite novamente!** 🎉

