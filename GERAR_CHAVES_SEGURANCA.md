# 🔐 Como Gerar Chaves de Segurança (SECRET_KEY e JWT_SECRET_KEY)

## 🎯 O que são essas chaves?

- **SECRET_KEY**: Usada pelo Flask para assinar sessões e cookies
- **JWT_SECRET_KEY**: Usada para assinar tokens JWT de autenticação

**⚠️ IMPORTANTE:** Essas chaves devem ser:
- ✅ Únicas e aleatórias
- ✅ Longas (pelo menos 32 caracteres)
- ✅ Secretas (não compartilhar publicamente)
- ✅ Diferentes uma da outra

---

## ✅ Método 1: Usando Python (Recomendado)

### No Terminal/CMD/PowerShell:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Execute 2 vezes** para gerar 2 chaves diferentes:
1. Primeira execução → use para `SECRET_KEY`
2. Segunda execução → use para `JWT_SECRET_KEY`

### Exemplo de saída:
```
SECRET_KEY: xK9mP2vQ7wR4tY8uI0oP3aS6dF9gH2jK5lM8nQ1rT4vW7xY0zA3bC6eF9hI2j
JWT_SECRET_KEY: mN8bV5cX2zA9qW6eR3tY7uI1oP4aS8dF2gH5jK9lM3nQ6rT1vW4xY7zA0b
```

---

## ✅ Método 2: Usando Python Interativo

### Abra o Python:

```bash
python
```

### Execute:

```python
import secrets

# Gerar SECRET_KEY
print("SECRET_KEY:")
print(secrets.token_urlsafe(32))

# Gerar JWT_SECRET_KEY
print("\nJWT_SECRET_KEY:")
print(secrets.token_urlsafe(32))
```

### Saia do Python:
```python
exit()
```

---

## ✅ Método 3: Usando Gerador Online (Alternativa)

Se não tiver Python disponível, você pode usar:

1. **Online UUID Generator:**
   - Acesse: https://www.uuidgenerator.net/
   - Gere 2 UUIDs diferentes
   - Use cada um como chave

2. **Random.org:**
   - Acesse: https://www.random.org/strings/
   - Configure:
     - Length: 64
     - Characters: Letters and Digits
   - Gere 2 strings diferentes

**⚠️ Nota:** Métodos online são menos seguros. Prefira usar Python local.

---

## ✅ Método 4: Usando Node.js (Se tiver instalado)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Execute 2 vezes para gerar 2 chaves diferentes.

---

## 📝 Como Usar no Railway

Após gerar as chaves:

1. Vá em **Backend → Variables**
2. Adicione:

**Variável 1:**
- **Name:** `SECRET_KEY`
- **Value:** `[PRIMEIRA_CHAVE_GERADA]`

**Variável 2:**
- **Name:** `JWT_SECRET_KEY`
- **Value:** `[SEGUNDA_CHAVE_GERADA]`

---

## 🔒 Exemplo Completo

### 1. Gerar as chaves:

```bash
# Primeira chave (SECRET_KEY)
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Saída: xK9mP2vQ7wR4tY8uI0oP3aS6dF9gH2jK5lM8nQ1rT4vW7xY0zA3bC6eF9hI2j

# Segunda chave (JWT_SECRET_KEY)
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Saída: mN8bV5cX2zA9qW6eR3tY7uI1oP4aS8dF2gH5jK9lM3nQ6rT1vW4xY7zA0b
```

### 2. Adicionar no Railway:

**Backend → Variables:**

```env
SECRET_KEY=xK9mP2vQ7wR4tY8uI0oP3aS6dF9gH2jK5lM8nQ1rT4vW7xY0zA3bC6eF9hI2j
JWT_SECRET_KEY=mN8bV5cX2zA9qW6eR3tY7uI1oP4aS8dF2gH5jK9lM3nQ6rT1vW4xY7zA0b
```

---

## ⚠️ Importante

1. **NÃO use as chaves do exemplo acima** - gere suas próprias!
2. **NÃO compartilhe** essas chaves publicamente
3. **NÃO use a mesma chave** para SECRET_KEY e JWT_SECRET_KEY
4. **Mantenha as chaves seguras** - se vazar, gere novas

---

## 🆘 Se Não Tiver Python

### Windows (PowerShell):
```powershell
# Instalar Python (se não tiver)
# Baixe de: https://www.python.org/downloads/

# Depois use:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Alternativa Rápida (sem Python):
Use um gerador online e copie 2 strings aleatórias de 64 caracteres.

---

## ✅ Checklist

- [ ] Gerei 2 chaves diferentes
- [ ] Cada chave tem pelo menos 32 caracteres
- [ ] Adicionei `SECRET_KEY` no Railway
- [ ] Adicionei `JWT_SECRET_KEY` no Railway
- [ ] As chaves são diferentes uma da outra
- [ ] Não compartilhei as chaves publicamente

---

**Última atualização:** 2025-01-15

