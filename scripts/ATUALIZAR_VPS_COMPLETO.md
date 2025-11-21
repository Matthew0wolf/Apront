# 🚀 Guia Completo: Atualizar VPS com Código do Git

## 📋 Passo a Passo Completo

### **PASSO 1: Conectar na VPS**

No terminal do Windows (PowerShell ou CMD):

```bash
ssh root@72.60.56.28
```

Digite a senha quando solicitado.

---

### **PASSO 2: Encontrar o Diretório do Projeto**

Após conectar, execute para encontrar onde está o projeto:

```bash
# Opção 1: Verificar volumes do container Docker
docker inspect apront-backend | grep -A 10 "Mounts"

# Opção 2: Procurar diretório Apront
find /root -type d -name "Apront" 2>/dev/null
find /home -type d -name "Apront" 2>/dev/null
find /opt -type d -name "Apront" 2>/dev/null

# Opção 3: Procurar arquivo .git
find /root -name ".git" -type d 2>/dev/null
find /home -name ".git" -type d 2>/dev/null
```

**Anote o caminho encontrado** (exemplo: `/root/Apront` ou `/home/user/Apront`)

---

### **PASSO 3: Navegar até o Diretório**

```bash
# Substitua /caminho/encontrado pelo caminho real encontrado no passo 2
cd /caminho/encontrado

# Verificar se está no lugar certo
pwd
ls -la
```

---

### **PASSO 4: Verificar Status do Git**

```bash
# Verificar se é um repositório Git
git status

# Se der erro "not a git repository", o código pode estar em outro lugar
# Volte ao PASSO 2 e procure novamente
```

---

### **PASSO 5: Fazer Backup (Opcional mas Recomendado)**

```bash
# Criar backup do código atual
cp -r . ../Apront_backup_$(date +%Y%m%d_%H%M%S)

# Ou apenas do diretório backend
cp -r backend backend_backup_$(date +%Y%m%d_%H%M%S)
```

---

### **PASSO 6: Buscar Atualizações do Git**

```bash
# Buscar atualizações do repositório remoto
git fetch origin

# Ver o que será atualizado (últimos commits)
git log HEAD..origin/main --oneline

# Ver diferenças
git diff HEAD origin/main --stat
```

---

### **PASSO 7: Atualizar o Código**

```bash
# Fazer pull das atualizações
git pull origin main
```

**Se houver conflitos:**
```bash
# Ver status
git status

# Opção 1: Descartar mudanças locais e usar remoto (CUIDADO!)
git reset --hard origin/main
git pull origin main

# Opção 2: Fazer stash das mudanças locais
git stash
git pull origin main
git stash pop
```

---

### **PASSO 8: Verificar Atualização**

```bash
# Ver último commit
git log -1

# Verificar arquivos atualizados
git diff HEAD~1 --name-only
```

---

### **PASSO 9: Reiniciar o Container Backend**

```bash
# Reiniciar o container
docker restart apront-backend

# Aguardar alguns segundos para iniciar
sleep 5

# Verificar se está rodando
docker ps | grep apront-backend
```

---

### **PASSO 10: Verificar Logs**

```bash
# Ver logs recentes do backend
docker logs apront-backend --tail=50

# Verificar se há erros
docker logs apront-backend --tail=100 | grep -i error

# Monitorar logs em tempo real (opcional)
docker logs -f apront-backend
```

---

## 🔄 **Comandos em Sequência (Copiar e Colar)**

Execute todos de uma vez (ajuste o caminho conforme necessário):

```bash
# 1. Conectar
ssh root@72.60.56.28

# 2. Encontrar projeto (execute e anote o caminho)
docker inspect apront-backend | grep -A 10 "Mounts"

# 3. Navegar (AJUSTE O CAMINHO)
cd /root/Apront  # ou o caminho encontrado

# 4. Verificar Git
git status

# 5. Fazer backup (opcional)
cp -r backend backend_backup_$(date +%Y%m%d_%H%M%S)

# 6. Buscar atualizações
git fetch origin

# 7. Ver o que será atualizado
git log HEAD..origin/main --oneline

# 8. Atualizar
git pull origin main

# 9. Reiniciar container
docker restart apront-backend

# 10. Aguardar e verificar
sleep 5
docker ps | grep apront-backend
docker logs apront-backend --tail=30
```

---

## 🎯 **Script Automatizado**

Crie um script na VPS para facilitar:

```bash
# Conectar na VPS primeiro
ssh root@72.60.56.28

# Criar script
cat > /root/atualizar_apront.sh << 'EOF'
#!/bin/bash
echo "========================================"
echo "Atualizando Apront na VPS"
echo "========================================"

# Encontrar diretório do projeto
PROJECT_DIR=$(find /root /home /opt -type d -name "Apront" 2>/dev/null | head -1)

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ Diretório do projeto não encontrado!"
    echo "Verificando volumes do Docker..."
    docker inspect apront-backend | grep -A 10 "Mounts"
    exit 1
fi

echo "📁 Diretório encontrado: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo ""
echo "📋 Status atual:"
git status

echo ""
echo "🔄 Buscando atualizações..."
git fetch origin

echo ""
echo "📝 Últimos commits a serem aplicados:"
git log HEAD..origin/main --oneline

echo ""
read -p "Deseja continuar com a atualização? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Atualização cancelada"
    exit 1
fi

echo ""
echo "⬇️  Fazendo pull..."
git pull origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Código atualizado com sucesso!"
    echo ""
    echo "🔄 Reiniciando container..."
    docker restart apront-backend
    
    echo ""
    echo "⏳ Aguardando 5 segundos..."
    sleep 5
    
    echo ""
    echo "📊 Status dos containers:"
    docker ps | grep apront
    
    echo ""
    echo "📋 Últimos logs:"
    docker logs apront-backend --tail=20
    
    echo ""
    echo "========================================"
    echo "✅ Atualização concluída!"
    echo "========================================"
else
    echo ""
    echo "❌ Erro ao fazer pull. Verifique os logs acima."
    exit 1
fi
EOF

# Dar permissão de execução
chmod +x /root/atualizar_apront.sh

# Executar
/root/atualizar_apront.sh
```

---

## 🔍 **Verificar se Funcionou**

Após atualizar, verifique:

```bash
# 1. Ver último commit aplicado
cd /caminho/do/projeto
git log -1

# 2. Verificar se container está rodando
docker ps | grep apront-backend

# 3. Ver logs para verificar se iniciou corretamente
docker logs apront-backend --tail=50 | grep -i "modo\|production\|started"

# 4. Testar endpoint (do seu PC)
curl http://72.60.56.28:5001/api/health
# ou
curl http://72.60.56.28:5001/
```

---

## ⚠️ **Problemas Comuns e Soluções**

### Problema 1: "not a git repository"
```bash
# Verificar se está no diretório certo
pwd
ls -la .git

# Se não houver .git, o código pode estar em volume Docker
docker inspect apront-backend | grep -A 20 "Mounts"
```

### Problema 2: "Permission denied"
```bash
# Verificar permissões
ls -la

# Dar permissão se necessário
chmod -R 755 .
```

### Problema 3: Conflitos no Git
```bash
# Ver conflitos
git status

# Resolver: descartar mudanças locais
git reset --hard origin/main
git pull origin main
```

### Problema 4: Container não inicia
```bash
# Ver logs de erro
docker logs apront-backend --tail=100

# Verificar se há erros de sintaxe
docker exec apront-backend python -m py_compile app.py

# Verificar variáveis de ambiente
docker exec apront-backend env | grep -i flask
```

---

## 📝 **Checklist de Atualização**

- [ ] Conectado na VPS
- [ ] Encontrado diretório do projeto
- [ ] Backup criado (opcional)
- [ ] Git fetch executado
- [ ] Git pull executado com sucesso
- [ ] Container reiniciado
- [ ] Container rodando (docker ps)
- [ ] Logs verificados (sem erros críticos)
- [ ] Sistema testado (acessar frontend)

---

## 🚀 **Comando Único (Tudo de Uma Vez)**

Se souber o caminho do projeto:

```bash
ssh root@72.60.56.28 "cd /root/Apront && git fetch origin && git pull origin main && docker restart apront-backend && sleep 5 && docker logs apront-backend --tail=30"
```

**Substitua `/root/Apront` pelo caminho real encontrado!**

