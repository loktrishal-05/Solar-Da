# One container, five processes (nginx :7860 -> API :3001, agents :8000, twin :8100, vision :8200).
# Port 7860 is what Hugging Face Spaces (Docker SDK) expects; any host can map it.
FROM node:20-bookworm-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
COPY weiqou ./weiqou
RUN npm ci && npm run build

FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends nginx curl ca-certificates gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY services ./services
RUN for s in agents twin vision; do python -m venv /opt/venv-$s && /opt/venv-$s/bin/pip install --no-cache-dir -r services/$s/requirements.lock; done
# Model weights are not in git: used from the build context if present, else fetched from the GitHub releases.
COPY deploy/fetch_models.py /tmp/fetch_models.py
RUN python /tmp/fetch_models.py
COPY data ./data
COPY --from=web /app/node_modules ./node_modules
COPY --from=web /app/packages ./packages
COPY --from=web /app/weiqou/api ./weiqou/api
COPY --from=web /app/weiqou/web/dist ./web
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/start.sh /start.sh
# The demo store is written at runtime; keep it writable for any uid.
RUN mkdir -p data/runtime && chmod -R a+rwX data /app/services
RUN chmod +x /start.sh
ENV PYTHONUNBUFFERED=1
EXPOSE 7860
CMD ["/start.sh"]
