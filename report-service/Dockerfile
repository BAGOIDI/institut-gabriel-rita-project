FROM python:3.11-slim

WORKDIR /app

# Dépendances minimales pour WeasyPrint
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code
COPY . .

# Variable d'environnement
ENV FLASK_APP=app.py
ENV PYTHONPATH=/app

EXPOSE 5000

# Commande par défaut (sera écrasée par docker-compose mais sert de fallback)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]


