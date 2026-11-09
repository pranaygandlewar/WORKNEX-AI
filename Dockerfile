FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Astral uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy configuration files
COPY pyproject.toml uv.lock ./

# Install project dependencies
RUN uv pip install --system -e .

# Copy application source code
COPY . .

# Environment settings
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV MCP_HOST=0.0.0.0

EXPOSE 8000

# Default entrypoint: Run WORKNEX AI enterprise backend
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
