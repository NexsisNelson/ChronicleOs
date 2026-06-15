# Agents Dockerfile for containerized task execution
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY apps/agents/requirements.txt ./apps/agents/requirements.txt
COPY packages/memwal-adapter ./packages/memwal-adapter
COPY apps/agents ./apps/agents

WORKDIR /app/apps/agents
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app
ENTRYPOINT ["python", "main.py"]
CMD ["--help"]
