# Hugging Face Space (Docker SDK) Dockerfile: the Space repo holds only this file and a README;
# the app is cloned from GitHub at build time. Same steps as the root Dockerfile.
FROM alpine/git AS src
ARG REF=main
RUN git clone --depth 1 --branch ${REF} https://github.com/loktrishal-05/Solar-Da.git /src

FROM node:20-bookworm-slim AS web
WORKDIR /app
COPY --from=src /src/package.json /src/package-lock.json ./
COPY --from=src /src/packages ./packages
COPY --from=src /src/weiqou ./weiqou
RUN npm ci && npm run build

FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends nginx supervisor curl ca-certificates gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=src /src/services ./services
RUN for s in agents twin vision; do python -m venv /opt/venv-$s && /opt/venv-$s/bin/pip install --no-cache-dir -r services/$s/requirements.lock; done
COPY --from=src /src/deploy/fetch_models.py /tmp/fetch_models.py
RUN python /tmp/fetch_models.py
COPY --from=src /src/data ./data
COPY --from=web /app/node_modules ./node_modules
COPY --from=web /app/packages ./packages
COPY --from=web /app/weiqou/api ./weiqou/api
COPY --from=web /app/weiqou/web/dist ./web
COPY --from=src /src/deploy/nginx.conf /etc/nginx/nginx.conf
COPY --from=src /src/deploy/supervisord.conf /etc/supervisord.conf
RUN mkdir -p data/runtime && chmod -R a+rwX data /app/services
ENV PYTHONUNBUFFERED=1
EXPOSE 7860
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
