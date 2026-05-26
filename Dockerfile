# syntax=docker/dockerfile:1
ARG BASE_IMAGE=ghcr.io/meta-pytorch/openenv-base:latest

# --------------------------------------------------------------------------- #
# Stage 1: build the React/TypeScript frontend -> /fe/dist
# --------------------------------------------------------------------------- #
FROM node:20-slim AS frontend
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

# --------------------------------------------------------------------------- #
# Stage 2: install python deps for the meverse environment (uv + openenv base)
# --------------------------------------------------------------------------- #
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

COPY . /app/env
WORKDIR /app/env/meverse

RUN if ! command -v uv >/dev/null 2>&1; then \
        curl -LsSf https://astral.sh/uv/install.sh | sh && \
        mv /root/.local/bin/uv /usr/local/bin/uv && \
        mv /root/.local/bin/uvx /usr/local/bin/uvx; \
    fi

RUN --mount=type=cache,target=/root/.cache/uv \
    if [ -f uv.lock ]; then \
        uv sync --frozen --no-install-project --no-editable; \
    else \
        uv sync --no-install-project --no-editable; \
    fi

RUN --mount=type=cache,target=/root/.cache/uv \
    if [ -f uv.lock ]; then \
        uv sync --frozen --no-editable; \
    else \
        uv sync --no-editable; \
    fi

# Root-level runtime deps (fastapi, uvicorn, python-multipart, numpy, ...)
RUN --mount=type=cache,target=/root/.cache/uv \
    VIRTUAL_ENV=/app/env/meverse/.venv \
    uv pip install --python /app/env/meverse/.venv/bin/python -r /app/env/requirements.txt

# --------------------------------------------------------------------------- #
# Stage 3: runtime image
# --------------------------------------------------------------------------- #
FROM ${BASE_IMAGE}
WORKDIR /app

COPY --from=builder /app/env/meverse/.venv /app/.venv
COPY --from=builder /app/env /app/env
# Built static assets the FastAPI app serves at "/".
COPY --from=frontend /fe/dist /app/env/frontend/dist
COPY --from=builder /app/env/README.md /app/README.md

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app/env:/app/env/meverse:$PYTHONPATH"
ENV TRADEX_DIST="/app/env/frontend/dist"
# Demo-friendly: random seeds available, but episodes are deterministic per seed.
ENV EVAL_MODE="1"

EXPOSE 7860

CMD ["sh", "-c", "cd /app/env && python -m uvicorn server.api:app --host 0.0.0.0 --port 7860"]
