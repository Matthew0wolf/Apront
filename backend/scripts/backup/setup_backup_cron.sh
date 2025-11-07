#!/bin/bash
# Script para configurar backup automático com cron (Linux/Mac)
# Sprint 9 - Backup Automático

echo "=================================================="
echo "CONFIGURAÇÃO DE BACKUP AUTOMÁTICO - APRONT"
echo "=================================================="
echo ""

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKUP_SCRIPT="$SCRIPT_DIR/backup_database.py"

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado!"
    echo "   Instale Python 3 antes de continuar"
    exit 1
fi

# Verificar se pg_dump está instalado
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump não encontrado!"
    echo "   Instale PostgreSQL client:"
    echo "   - Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   - macOS: brew install postgresql"
    exit 1
fi

echo "✅ Dependências verificadas"
echo ""

# Opções de agendamento
echo "Escolha a frequência do backup:"
echo "  1) Diário (às 2:00 AM)"
echo "  2) A cada 12 horas"
echo "  3) A cada 6 horas"
echo "  4) A cada hora"
echo "  5) Personalizado"
echo ""
read -p "Opção [1-5]: " FREQ_OPTION

case $FREQ_OPTION in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="Diário às 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 */12 * * *"
        DESCRIPTION="A cada 12 horas"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="A cada 6 horas"
        ;;
    4)
        CRON_SCHEDULE="0 * * * *"
        DESCRIPTION="A cada hora"
        ;;
    5)
        echo ""
        echo "Formato cron: MIN HORA DIA MÊS DIA_SEMANA"
        echo "Exemplo: '0 2 * * *' = Todo dia às 2:00 AM"
        read -p "Digite o cron: " CRON_SCHEDULE
        DESCRIPTION="Personalizado: $CRON_SCHEDULE"
        ;;
    *)
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "📅 Agendamento: $DESCRIPTION"
echo "   Cron: $CRON_SCHEDULE"
echo ""

# Criar entrada do cron
CRON_JOB="$CRON_SCHEDULE cd $SCRIPT_DIR && python3 backup_database.py --compress >> $SCRIPT_DIR/backup.log 2>&1"

# Adicionar ao crontab
(crontab -l 2>/dev/null | grep -v "backup_database.py"; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Backup automático configurado com sucesso!"
    echo ""
    echo "📝 Detalhes:"
    echo "   Script: $BACKUP_SCRIPT"
    echo "   Frequência: $DESCRIPTION"
    echo "   Log: $SCRIPT_DIR/backup.log"
    echo ""
    echo "Para verificar cron jobs:"
    echo "   crontab -l"
    echo ""
    echo "Para remover backup automático:"
    echo "   crontab -e"
    echo "   (remova a linha que contém 'backup_database.py')"
    echo ""
else
    echo "❌ Erro ao configurar cron!"
    echo "   Configure manualmente com: crontab -e"
    echo "   E adicione a linha:"
    echo "   $CRON_JOB"
fi

