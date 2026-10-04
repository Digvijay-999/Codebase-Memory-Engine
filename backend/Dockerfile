# syntax=docker/dockerfile:1
FROM python:3.11-slim AS builder

WORKDIR /app

# Install curl and certificates for build-time model download
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install lightweight CPU-only requirements (fastapi, chromadb, onnxruntime, tokenizers)
# Zero PyTorch, zero CUDA, zero NVIDIA packages
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Download official all-MiniLM-L6-v2 ONNX model during build stage
RUN mkdir -p /app/models/all-MiniLM-L6-v2 && \
    curl -fL --retry 3 --retry-all-errors \
      -o /app/models/all-MiniLM-L6-v2/model.onnx \
      https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx

# Final runtime stage
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application source code (including tracked tokenizer/config files)
COPY . .

# Copy pre-downloaded ONNX model from builder stage
COPY --from=builder /app/models/all-MiniLM-L6-v2/model.onnx /app/models/all-MiniLM-L6-v2/model.onnx

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV HOST=0.0.0.0

# Create volume directories with proper permissions
RUN mkdir -p /app/chroma_db /app/repos

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
