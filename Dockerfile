# Use a lightweight base image
FROM python:3.11-slim

# Set environment variables for Python to run in optimized mode
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

ENV ALPACA_API_SECRET=$ALPACA_API_SECRET
ENV ALPACA_API_KEY=$ALPACA_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential gcc make && \
    rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Copy only the necessary files for dependency installation
COPY backend/* /app/

# Install dependencies
RUN python -m pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Expose the application port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "app"]