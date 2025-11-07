#!/usr/bin/env python3
"""
Script para backup do banco de dados PostgreSQL
Sprint 9 - Sistema de Backup Automático

Uso:
    python backup_database.py
    
Opções:
    --output-dir DIR    Diretório de saída (padrão: ./backups)
    --keep-days DAYS    Manter backups dos últimos N dias (padrão: 30)
    --compress          Comprimir backup com gzip
"""

import os
import subprocess
import argparse
from datetime import datetime, timedelta
import glob

# Configurações padrão
DEFAULT_BACKUP_DIR = os.path.join(os.path.dirname(__file__), 'backups')
DEFAULT_KEEP_DAYS = 30

# Credenciais PostgreSQL (de variáveis de ambiente ou padrão Docker)
DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')
DB_NAME = os.getenv('POSTGRES_DB', 'apront_db')
DB_USER = os.getenv('POSTGRES_USER', 'apront_user')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'apront_password_2024')


def create_backup(output_dir, compress=False):
    """Cria backup do banco de dados"""
    
    # Criar diretório se não existir
    os.makedirs(output_dir, exist_ok=True)
    
    # Nome do arquivo com timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"apront_backup_{timestamp}.sql"
    
    if compress:
        filename += ".gz"
    
    filepath = os.path.join(output_dir, filename)
    
    print(f"🔄 Iniciando backup...")
    print(f"   Banco: {DB_NAME}")
    print(f"   Host: {DB_HOST}:{DB_PORT}")
    print(f"   Arquivo: {filename}")
    print()
    
    # Configurar variável de ambiente para senha
    env = os.environ.copy()
    env['PGPASSWORD'] = DB_PASSWORD
    
    # Comando pg_dump
    cmd = [
        'pg_dump',
        '-h', DB_HOST,
        '-p', DB_PORT,
        '-U', DB_USER,
        '-d', DB_NAME,
        '--no-owner',
        '--no-acl',
        '-v'  # verbose
    ]
    
    try:
        # Executar backup
        if compress:
            # Com compressão
            cmd_str = ' '.join(cmd)
            full_cmd = f"{cmd_str} | gzip > {filepath}"
            result = subprocess.run(full_cmd, shell=True, env=env, capture_output=True, text=True)
        else:
            # Sem compressão
            with open(filepath, 'w') as f:
                result = subprocess.run(cmd, env=env, stdout=f, stderr=subprocess.PIPE, text=True)
        
        if result.returncode == 0:
            # Obter tamanho do arquivo
            size_mb = os.path.getsize(filepath) / (1024 * 1024)
            
            print(f"✅ Backup criado com sucesso!")
            print(f"   Arquivo: {filepath}")
            print(f"   Tamanho: {size_mb:.2f} MB")
            print()
            
            return filepath
        else:
            print(f"❌ Erro ao criar backup:")
            print(result.stderr)
            return None
            
    except FileNotFoundError:
        print("❌ Erro: pg_dump não encontrado!")
        print("   Instale o PostgreSQL client:")
        print("   - Ubuntu/Debian: sudo apt-get install postgresql-client")
        print("   - Windows: Inclua o PostgreSQL no PATH")
        print("   - macOS: brew install postgresql")
        return None
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return None


def cleanup_old_backups(backup_dir, keep_days):
    """Remove backups antigos"""
    
    print(f"🧹 Limpando backups antigos (mais de {keep_days} dias)...")
    
    cutoff_date = datetime.now() - timedelta(days=keep_days)
    pattern = os.path.join(backup_dir, 'apront_backup_*.sql*')
    
    removed_count = 0
    removed_size = 0
    
    for backup_file in glob.glob(pattern):
        # Obter data de modificação
        mtime = datetime.fromtimestamp(os.path.getmtime(backup_file))
        
        if mtime < cutoff_date:
            size = os.path.getsize(backup_file)
            os.remove(backup_file)
            removed_count += 1
            removed_size += size
            print(f"   🗑️  Removido: {os.path.basename(backup_file)}")
    
    if removed_count > 0:
        print(f"✅ {removed_count} backup(s) removido(s) ({removed_size / (1024*1024):.2f} MB liberados)")
    else:
        print(f"   Nenhum backup antigo para remover")
    
    print()


def list_backups(backup_dir):
    """Lista backups disponíveis"""
    
    pattern = os.path.join(backup_dir, 'apront_backup_*.sql*')
    backups = sorted(glob.glob(pattern), reverse=True)
    
    if not backups:
        print("📦 Nenhum backup encontrado")
        return
    
    print(f"📦 Backups disponíveis ({len(backups)}):")
    print()
    
    total_size = 0
    
    for backup_file in backups[:10]:  # Mostrar últimos 10
        size = os.path.getsize(backup_file)
        total_size += size
        mtime = datetime.fromtimestamp(os.path.getmtime(backup_file))
        
        print(f"   📄 {os.path.basename(backup_file)}")
        print(f"      Data: {mtime.strftime('%d/%m/%Y %H:%M:%S')}")
        print(f"      Tamanho: {size / (1024*1024):.2f} MB")
        print()
    
    if len(backups) > 10:
        print(f"   ... e mais {len(backups) - 10} backup(s)")
        print()
    
    print(f"💾 Espaço total usado: {total_size / (1024*1024):.2f} MB")
    print()


def main():
    parser = argparse.ArgumentParser(description='Backup do banco de dados Apront')
    parser.add_argument('--output-dir', default=DEFAULT_BACKUP_DIR, help='Diretório de saída')
    parser.add_argument('--keep-days', type=int, default=DEFAULT_KEEP_DAYS, help='Dias para manter backups')
    parser.add_argument('--compress', action='store_true', help='Comprimir backup com gzip')
    parser.add_argument('--list', action='store_true', help='Listar backups disponíveis')
    parser.add_argument('--no-cleanup', action='store_true', help='Não remover backups antigos')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("💾 SISTEMA DE BACKUP - APRONT")
    print("=" * 60)
    print()
    
    # Listar backups
    if args.list:
        list_backups(args.output_dir)
        return
    
    # Criar backup
    backup_file = create_backup(args.output_dir, args.compress)
    
    if backup_file:
        # Limpar backups antigos
        if not args.no_cleanup:
            cleanup_old_backups(args.output_dir, args.keep_days)
        
        print("=" * 60)
        print("✅ BACKUP CONCLUÍDO COM SUCESSO!")
        print("=" * 60)
        print()
        print("📝 Próximos passos:")
        print(f"   1. Backup salvo em: {backup_file}")
        print(f"   2. Para restaurar: python restore_database.py {backup_file}")
        print(f"   3. Backups são mantidos por {args.keep_days} dias")
        print()
    else:
        print("=" * 60)
        print("❌ BACKUP FALHOU!")
        print("=" * 60)
        print()


if __name__ == '__main__':
    main()

