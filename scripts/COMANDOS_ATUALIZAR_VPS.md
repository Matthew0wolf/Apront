# 🚀 Comandos para Atualizar Código na VPS do Git

## 📍 Conectar na VPS

```bash
ssh root@72.60.56.28
```

## 🔄 Atualizar Código do Git

### Opção 1: Se o projeto está em um diretório Git

```bash
# 1. Navegar até o diretório do projeto
cd /caminho/do/projeto

# 2. Verificar status atual
git status

# 3. Buscar atualizações do repositório remoto
git fetch origin

# 4. Ver diferenças antes de atualizar
git log HEAD..origin/main --oneline

# 5. Fazer pull das atualizações
git pull origin main

# 6. Reiniciar o container do backend
docker restart apront-backend

# 7. Verificar se está rodando
docker ps | grep apront-backend
```

### Opção 2: Se o código está dentro do container

```bash
# 1. Entrar no container
docker exec -it apront-backend bash

# 2. Dentro do container, navegar até o diretório
cd /app

# 3. Verificar se há .git
ls -la .git

# 4. Se houver, fazer pull
git pull origin main

# 5. Sair do container
exit

# 6. Reiniciar o container
docker restart apront-backend
```

### Opção 3: Se o código está montado como volume

```bash
# 1. Encontrar onde está o volume montado
docker inspect apront-backend | grep -A 10 "Mounts"

# 2. Navegar até o diretório no host
cd /caminho/do/volume

# 3. Fazer pull
git pull origin main

# 4. Reiniciar container
docker restart apront-backend
```

## 🔍 Encontrar o Diretório do Projeto

Se não souber onde está o projeto:

```bash
# Procurar diretório .git
find /root -name ".git" -type d 2>/dev/null
find /home -name ".git" -type d 2>/dev/null
find /opt -name ".git" -type d 2>/dev/null

# Ou procurar pelo nome do projeto
find /root -type d -name "Apront" 2>/dev/null
find /home -type d -name "Apront" 2>/dev/null
```

## 📋 Comandos Completos (Passo a Passo)

### Passo 1: Conectar na VPS
```bash
ssh root@72.60.56.28
```

### Passo 2: Encontrar o projeto
```bash
# Verificar volumes do container
docker inspect apront-backend | grep -A 10 "Mounts"

# Ou procurar diretório
find /root -type d -name "Apront" 2>/dev/null
```

### Passo 3: Atualizar código
```bash
# Navegar até o diretório (ajuste o caminho)
cd /caminho/encontrado

# Verificar se é um repositório Git
git status

# Se for, fazer pull
git pull origin main
```

### Passo 4: Reiniciar serviços
```bash
# Reiniciar backend
docker restart apront-backend

# Aguardar alguns segundos
sleep 5

# Verificar logs
docker logs apront-backend --tail=50
```

## 🔄 Atualização Automática (Script)

Execute o script criado:

```bash
# Copiar script para VPS (se necessário)
# Ou criar diretamente na VPS:

cat > /root/atualizar_projeto.sh << 'EOF'
#!/bin/bash
cd /caminho/do/projeto
git pull origin main
docker restart apront-backend
echo "✅ Atualização concluída!"
EOF

chmod +x /root/atualizar_projeto.sh

# Executar
/root/atualizar_projeto.sh
```

## ⚠️ Resolver Conflitos (Se Houver)

Se houver conflitos ao fazer pull:

```bash
# Ver status
git status

# Ver conflitos
git diff

# Opção 1: Descartar mudanças locais e usar remoto
git reset --hard origin/main

# Opção 2: Fazer stash das mudanças locais
git stash
git pull origin main
git stash pop

# Opção 3: Resolver manualmente
# Editar arquivos com conflitos
# Depois: git add . && git commit
```

## 🔍 Verificar Atualização

```bash
# Ver último commit
git log -1

# Ver diferenças
git diff HEAD~1

# Verificar se container está rodando
docker ps | grep apront-backend

# Ver logs recentes
docker logs apront-backend --tail=50
```

## 📝 Notas Importantes

1. **Backup antes de atualizar:**
   ```bash
   # Fazer backup do código atual
   cp -r /caminho/do/projeto /caminho/do/projeto.backup
   ```

2. **Se o código estiver em volume Docker:**
   - Atualize no host (fora do container)
   - O container verá as mudanças automaticamente
   - Pode precisar reiniciar o container

3. **Se o código estiver dentro do container:**
   - Entre no container e faça pull lá
   - Ou reconstrua a imagem Docker

4. **Verificar variáveis de ambiente:**
   - Após atualizar, verifique se o `.env` ainda está correto
   - Especialmente as configurações SMTP

## 🚨 Problemas Comuns

### Erro: "not a git repository"
```bash
# Verificar se está no diretório correto
pwd
ls -la .git

# Se não houver .git, o código pode estar em outro lugar
# Verificar volumes do Docker
docker inspect apront-backend | grep Mounts
```

### Erro: "Permission denied"
```bash
# Verificar permissões
ls -la

# Dar permissão se necessário
chmod -R 755 /caminho/do/projeto
```

### Container não reinicia
```bash
# Ver logs de erro
docker logs apront-backend --tail=100

# Verificar se há erros no código
docker exec apront-backend python -m py_compile app.py
```

