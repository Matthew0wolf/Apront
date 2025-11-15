# 🔧 Forçar Atualização do Código

## ✅ Volume Detectado

Há volume montado: `./backend:/app` - código no container = código no host.

## 🔍 Verificar se código foi atualizado no host:

```bash
grep -n "FRONTEND_URL lido" /var/www/apront/backend/email_utils.py
```

**Se não aparecer, o código não foi atualizado!**

## ✅ Forçar Atualização Completa:

```bash
cd /var/www/apront && \
git fetch origin && \
git reset --hard origin/main && \
echo "✅ Código atualizado no host" && \
echo "" && \
echo "=== Verificando se código tem a correção ===" && \
grep -n "FRONTEND_URL lido" backend/email_utils.py && \
echo "" && \
echo "=== Limpando cache Python ===" && \
find backend -name "*.pyc" -delete && \
find backend -name "__pycache__" -type d -exec rm -r {} + 2>/dev/null || true && \
echo "" && \
echo "=== Reiniciando backend ===" && \
docker compose restart backend && \
echo "" && \
echo "✅ Tudo atualizado! Agora envie um convite e veja TODOS os logs:"
echo "docker compose logs -f backend"
```

## 📋 Depois de executar:

1. **Envie um novo convite**
2. **Veja TODOS os logs (sem filtro):**
   ```bash
   docker compose logs -f backend
   ```
3. **Procure por QUALQUER linha com:**
   - `[EMAIL]`
   - `FRONTEND_URL`
   - `invite`
   - `localhost`

**Copie TODAS as linhas relevantes aqui.**

