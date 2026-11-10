# syntax=docker/dockerfile:1
FROM python:3.11.18-slim@sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535 AS builder

WORKDIR /app

# Install curl and certificates for build-time model download
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install lightweight CPU-only requirements (fastapi, chromadb, onnxruntime, tokenizers)
# Zero PyTorch, zero CUDA, zero NVIDIA packages
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Download official all-MiniLM-L6-v2 ONNX model during build stage
RUN mkdir -p /app/models/all-MiniLM-L6-v2 && \
    curl -fL --retry 3 --retry-all-errors \
      -o /app/models/all-MiniLM-L6-v2/model.onnx \
      https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx

# Final runtime stage
FROM python:3.11.18-slim@sha256:07d4824036af339fa1b6ef769cc99d9c10a141769538b52b3b597c84f7a7b535

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder (root-owned, readable by the app user)
COPY --from=builder /install /usr/local

# Copy application source code (including tracked tokenizer/config files)
COPY . .

# Copy pre-downloaded ONNX model from builder stage
COPY --from=builder /app/models/all-MiniLM-L6-v2/model.onnx /app/models/all-MiniLM-L6-v2/model.onnx

ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV HOST=0.0.0.0

# Run as a non-root user that owns only the data volumes (existing volumes need a one-time chown to 10001)
RUN groupadd --gid 10001 app && useradd --uid 10001 --gid 10001 --create-home app \
    && mkdir -p /app/chroma_db /app/repos && chown 10001:10001 /app/chroma_db /app/repos
USER 10001:10001

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "main.py"]
