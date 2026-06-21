# Agents Dockerfile for containerized task execution
FROM python:3.13-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY apps/agents/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared package and application
COPY packages/memwal-adapter ./packages/memwal-adapter
RUN pip install --no-cache-dir -e ./packages/memwal-adapter
COPY apps/agents/main.py ./main.py
COPY apps/agents/src ./src

# Create data directories
RUN mkdir -p data artifacts logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import httpx; r = httpx.get('http://localhost:8000/health', timeout=5); r.raise_for_status()" || exit 1

ENV PYTHONPATH=/app
ENTRYPOINT ["python", "main.py"]
CMD ["--help"]
