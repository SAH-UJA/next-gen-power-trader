# 1. Base image for Python
FROM python:3.11-slim AS backend

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV ALPACA_BASE_URL=https://paper-api.alpaca.markets

# System deps for python packages (e.g. numpy, pandas, etc)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    make \
    && rm -rf /var/lib/apt/lists/*

# Copy backend code (with built frontend inside backend/frontend/build)
WORKDIR /app

# Copy backend code (including requirements.txt, src/, etc.) into /backend
COPY backend/ /app/backend/

# Copy ONLY the React build output into /backend/frontend/build/
COPY frontend/build/ /app/frontend/build/

# Install backend dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

WORKDIR /app/backend

CMD ["python", "-m", "app"]