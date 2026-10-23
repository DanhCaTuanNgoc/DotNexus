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
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY engine/ ./engine/
COPY contracts/ ./contracts/
COPY dashboards/ ./dashboards/
COPY scripts/ ./scripts/

# Default environment configuration
ENV PYTHONUNBUFFERED=1
ENV PORT=5050

EXPOSE 5050

# Run Flask Gateway API
CMD ["python", "-m", "engine.server"]
