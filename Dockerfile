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

# Set workdir (inside backend directory)
WORKDIR /app

# Copy backend code (with built frontend inside backend/frontend/build)
COPY backend /app

COPY frontend/build/ /app/frontend/build/

# Install backend dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

# Entry point for FastAPI, assuming your FastAPI app is in `src/main.py`,
# and __init__.py in src: `python -m src.main` will run it.
CMD ["python", "-m", "app"]