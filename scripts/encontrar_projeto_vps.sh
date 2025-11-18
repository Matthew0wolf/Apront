#!/bin/bash
# Script para encontrar o projeto e containers Docker na VPS

echo "========================================"
echo "Procurando projeto e containers Docker"
echo "========================================"
echo ""

echo "1. Verificando containers Docker em execucao:"
docker ps
echo ""

echo "2. Verificando todos os containers (incluindo parados):"
docker ps -a
echo ""

echo "3. Procurando arquivo docker-compose.yml:"
find /root -name "docker-compose.yml" 2>/dev/null
find /home -name "docker-compose.yml" 2>/dev/null
find /opt -name "docker-compose.yml" 2>/dev/null
echo ""

echo "4. Procurando diretorio Apront:"
find /root -type d -name "Apront" 2>/dev/null
find /home -type d -name "Apront" 2>/dev/null
find /opt -type d -name "Apront" 2>/dev/null
echo ""

echo "5. Verificando volumes Docker:"
docker volume ls
echo ""

echo "6. Verificando imagens Docker:"
docker images | grep -i apront
echo ""

echo "7. Verificando processos Python/Flask:"
ps aux | grep -i python | grep -v grep
echo ""

echo "========================================"
echo "Comandos para ver logs diretamente:"
echo "========================================"
echo ""
echo "Se encontrar um container chamado 'backend' ou similar:"
echo "  docker logs <nome_do_container> --tail=100 | grep -i email"
echo ""
echo "Ou ver todos os containers:"
echo "  docker logs \$(docker ps -q) --tail=100 | grep -i email"
echo ""

