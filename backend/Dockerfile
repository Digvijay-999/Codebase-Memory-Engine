# syntax=docker/dockerfile:1
FROM python:3.11-slim AS builder

WORKDIR /app

# Pre-install CPU-only PyTorch to eliminate multi-GB NVIDIA CUDA/Triton packages
RUN pip install --no-cache-dir --user --index-url https://download.pytorch.org/whl/cpu torch

COPY requirements.txt .
RUN pip install --no-cache-dir --user --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Pre-download SentenceTransformer model for instant offline startup
ENV PATH=/root/.local/bin:$PATH
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Final runtime stage
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages and pre-cached model from builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder /root/.cache /root/.cache

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV HOST=0.0.0.0

# Copy application source
COPY . .

# Create volume directories with proper permissions
RUN mkdir -p /app/chroma_db /app/repos

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "main.py"]
