FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /app/

# Port 7860 is required by Hugging Face Spaces
EXPOSE 7860

WORKDIR /app/belajara_backend

CMD python manage.py migrate && python manage.py collectstatic --noinput && celery -A belajara_backend worker -l info --detach && gunicorn belajara_backend.wsgi:application --bind 0.0.0.0:7860 --timeout 180

