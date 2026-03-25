FROM python:3.11-slim-bookworm

WORKDIR /app

# Dépendances minimales pour WeasyPrint
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code (copie ciblée pour éviter les fichiers spéciaux Windows)
COPY app ./app
COPY config ./config
COPY static ./static
COPY app.py ./app.py

# Variable d'environnement
ENV FLASK_APP=app.py
ENV PYTHONPATH=/app

EXPOSE 5000

# Commande par défaut (sera écrasée par docker-compose mais sert de fallback)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]


