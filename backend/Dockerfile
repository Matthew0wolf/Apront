# Dockerfile para Backend Flask
FROM python:3.11-slim

# Configurar diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primeiro (para cache do Docker)
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Adicionar dependências para PostgreSQL
RUN pip install --no-cache-dir psycopg2-binary python-dotenv

# Copiar código da aplicação
COPY . .

# Criar diretório para uploads
RUN mkdir -p uploads/avatars

# Expor porta
EXPOSE 5001

# Variáveis de ambiente padrão
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Comando para iniciar a aplicação
CMD ["python", "app.py"]

