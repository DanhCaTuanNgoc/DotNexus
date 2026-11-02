# Production Container for DotNexus Backend Engine
# Network: Portaldot Network V3.0 (Substrate + EVM Dual-VM)

FROM python:3.11-slim

WORKDIR /app

# Install build dependencies for Substrate cryptographic extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libssl-dev \
    libffi-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Create runtime directories for validator session locks and keystore isolation
RUN mkdir -p /var/lib/portaldot/chains/portaldot_v3/keystore /app/.dotnexus_data

# Copy application source code
COPY engine/ ./engine/
COPY contracts/ ./contracts/
COPY dashboards/ ./dashboards/
COPY scripts/ ./scripts/

# Default environment configuration & Linux Glibc memory tuning for 512MB RAM container
ENV PYTHONUNBUFFERED=1
ENV MALLOC_ARENA_MAX=2
ENV PYTHONMALLOC=malloc
ENV PORT=10000

EXPOSE 10000 5050

# Gunicorn WSGI: 1 worker, 2 threads (balanced for 512MB ceiling) with auto-recycle every 500 requests to purge fragmentation
CMD ["sh", "-c", "gunicorn -w 1 --threads 4 --max-requests 500 --max-requests-jitter 50 -b 0.0.0.0:${PORT:-10000} --timeout 120 engine.server:app"]
