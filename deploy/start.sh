#!/bin/bash
# Lean replacement for supervisord (saves ~30 MB): start every service, exit if any dies so Docker's restart policy recovers.
export MALLOC_ARENA_MAX=2 OMP_NUM_THREADS=1 NUMEXPR_MAX_THREADS=1 PYTHONUNBUFFERED=1
cd /app/weiqou/api && PORT=3001 node dist/server.js &
cd /app/services/twin && /opt/venv-twin/bin/python -m uvicorn app.main:app --port 8100 &
cd /app/services/vision && /opt/venv-vision/bin/python -m uvicorn app.main:app --port 8200 &
cd /app/services/agents && /opt/venv-agents/bin/python -m uvicorn app.main:app --port 8000 &
nginx -g 'daemon off;' &
wait -n
echo "a service exited; stopping container" >&2
exit 1
