#!/usr/bin/env python3
"""
Script para restaurar backup do banco de dados PostgreSQL
Sprint 9 - Sistema de Backup Automático

⚠️ ATENÇÃO: Este script irá SOBRESCREVER o banco de dados atual!

Uso:
    python restore_database.py <arquivo_backup>
    
Exemplo:
    python restore_database.py backups/apront_backup_20241015_143000.sql
    python restore_database.py backups/apront_backup_20241015_143000.sql.gz
"""

import os
import subprocess
import sys
import argparse
from datetime import datetime

# Credenciais PostgreSQL
DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')
DB_NAME = os.getenv('POSTGRES_DB', 'apront_db')
DB_USER = os.getenv('POSTGRES_USER', 'apront_user')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'apront_password_2024')


def verify_backup_file(backup_file):
    """Verifica se o arquivo de backup existe"""
    
    if not os.path.exists(backup_file):
        print(f"❌ Erro: Arquivo não encontrado: {backup_file}")
        return False
    
    file_size = os.path.getsize(backup_file)
    
    if file_size == 0:
        print(f"❌ Erro: Arquivo de backup está vazio!")
        return False
    
    print(f"✅ Arquivo de backup encontrado")
    print(f"   Tamanho: {file_size / (1024*1024):.2f} MB")
    print()
    
    return True


def create_safety_backup(output_dir):
    """Cria um backup de segurança antes de restaurar"""
    
    print("🔒 Criando backup de segurança antes de restaurar...")
    
    from backup_database import create_backup
    safety_backup = create_backup(output_dir, compress=False)
    
    if safety_backup:
        print(f"✅ Backup de segurança criado: {safety_backup}")
        print()
        return safety_backup
    else:
        print("⚠️  Não foi possível criar backup de segurança")
        print()
        return None


def restore_backup(backup_file, create_safety=True):
    """Restaura backup do banco de dados"""
    
    print("=" * 60)
    print("⚠️  ATENÇÃO: RESTAURAÇÃO DE BANCO DE DADOS")
    print("=" * 60)
    print()
    print("Esta operação irá:")
    print("  1. SOBRESCREVER todos os dados atuais do banco")
    print("  2. Restaurar dados do arquivo de backup")
    print("  3. Pode levar alguns minutos")
    print()
    
    # Confirmação
    response = input("Digite 'CONFIRMAR' para continuar: ")
    if response != 'CONFIRMAR':
        print("❌ Restauração cancelada")
        return False
    
    print()
    
    # Backup de segurança
    if create_safety:
        safety_dir = os.path.join(os.path.dirname(backup_file), 'safety_backups')
        create_safety_backup(safety_dir)
    
    # Verificar se arquivo está comprimido
    is_compressed = backup_file.endswith('.gz')
    
    print(f"🔄 Restaurando backup...")
    print(f"   Arquivo: {backup_file}")
    print(f"   Banco: {DB_NAME}")
    print()
    
    # Configurar variável de ambiente para senha
    env = os.environ.copy()
    env['PGPASSWORD'] = DB_PASSWORD
    
    try:
        # Comando psql
        cmd = [
            'psql',
            '-h', DB_HOST,
            '-p', DB_PORT,
            '-U', DB_USER,
            '-d', DB_NAME,
            '-v', 'ON_ERROR_STOP=1'
        ]
        
        if is_compressed:
            # Descomprimir e restaurar
            cmd_str = ' '.join(cmd)
            full_cmd = f"gunzip -c {backup_file} | {cmd_str}"
            result = subprocess.run(full_cmd, shell=True, env=env, capture_output=True, text=True)
        else:
            # Restaurar diretamente
            with open(backup_file, 'r') as f:
                result = subprocess.run(cmd, env=env, stdin=f, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Restauração concluída com sucesso!")
            print()
            print("📝 Próximos passos:")
            print("   1. Reinicie o backend: docker-compose restart backend")
            print("   2. Teste a aplicação")
            print("   3. Verifique se os dados estão corretos")
            print()
            return True
        else:
            print("❌ Erro durante a restauração:")
            print(result.stderr)
            print()
            print("💡 Dica: Verifique se o backup é compatível com a versão do PostgreSQL")
            return False
            
    except FileNotFoundError:
        print("❌ Erro: psql não encontrado!")
        print("   Instale o PostgreSQL client")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return False


def verify_restore():
    """Verifica se a restauração foi bem-sucedida"""
    
    print("🔍 Verificando restauração...")
    print()
    
    env = os.environ.copy()
    env['PGPASSWORD'] = DB_PASSWORD
    
    # Contar tabelas
    cmd = [
        'psql',
        '-h', DB_HOST,
        '-p', DB_PORT,
        '-U', DB_USER,
        '-d', DB_NAME,
        '-t',  # tuples only
        '-c', "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
    ]
    
    try:
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        table_count = result.stdout.strip()
        
        print(f"📊 Tabelas encontradas: {table_count}")
        
        # Contar registros em tabelas principais
        tables = ['users', 'companies', 'rundowns', 'items']
        
        for table in tables:
            cmd_count = cmd[:-2] + ['-c', f"SELECT COUNT(*) FROM {table}"]
            result = subprocess.run(cmd_count, env=env, capture_output=True, text=True)
            count = result.stdout.strip() if result.returncode == 0 else 'Erro'
            print(f"   {table}: {count} registros")
        
        print()
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Restaurar backup do banco de dados Apront')
    parser.add_argument('backup_file', help='Arquivo de backup para restaurar')
    parser.add_argument('--no-safety-backup', action='store_true', help='Não criar backup de segurança')
    parser.add_argument('--no-verify', action='store_true', help='Não verificar após restaurar')
    
    args = parser.parse_args()
    
    # Verificar arquivo
    if not verify_backup_file(args.backup_file):
        sys.exit(1)
    
    # Restaurar
    success = restore_backup(args.backup_file, create_safety=not args.no_safety_backup)
    
    if success and not args.no_verify:
        verify_restore()
    
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()

