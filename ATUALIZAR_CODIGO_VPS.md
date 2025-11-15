# 🔄 Atualizar Código na VPS (Git Pull)

## 📋 Comandos Rápidos

### 1. Atualizar Backend (onde está o script)

```bash
cd /var/www/apront/backend && \
git fetch origin && \
git reset --hard origin/main && \
echo "✅ Backend atualizado!"
```

### 2. Atualizar Frontend

```bash
cd /var/www/apront && \
git fetch origin && \
git reset --hard origin/main && \
echo "✅ Frontend atualizado!"
```

### 3. Atualizar Tudo (Backend + Frontend)

```bash
cd /var/www/apront && \
git fetch origin && \
git reset --hard origin/main && \
cd backend && \
git fetch origin && \
git reset --hard origin/main && \
cd .. && \
echo "✅ Todo o código atualizado!"
```

## 🚀 Comando Completo (Atualizar + Reiniciar Backend)

```bash
cd /var/www/apront && \
git fetch origin && \
git reset --hard origin/main && \
cd backend && \
git fetch origin && \
git reset --hard origin/main && \
cd .. && \
docker compose restart backend && \
echo "✅ Código atualizado e backend reiniciado!"
```

## 📝 Explicação

- `git fetch origin` - Busca as atualizações do repositório remoto
- `git reset --hard origin/main` - Força o código local a ficar igual ao remoto (descartando mudanças locais)
- `docker compose restart backend` - Reinicia o container do backend para aplicar mudanças

## ⚠️ Atenção

O `git reset --hard` **descartará todas as mudanças locais** que não foram commitadas. Se você tiver mudanças importantes que não foram commitadas, faça backup antes!

## 🎯 Para Usar o Script de Deletar Empresa

Depois de atualizar o código:

```bash
# 1. Entre no container
docker compose exec backend bash

# 2. Execute o script
python scripts/delete_company.py "apront"
```

