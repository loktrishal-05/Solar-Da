# Solarda local stack (Linux/macOS). Windows: scripts/start_all.ps1.
#   make setup   once: node deps + build, three Python 3.11 venvs (uv), model weights, local secrets
#   make dev     start api :3001, agents :8000, twin :8100, vision :8200, web :3000 (logs in data/runtime/logs)
#   make stop | make health | make test | make docker
#   make reset   clear runs, approvals, audit and outbox before a demo (keeps accounts and secrets)
SHELL := /bin/bash
RT    := data/runtime
SVCS  := agents twin vision
PY     = services/$(1)/.venv/bin/python
# Every service sees .env (optional) plus the two generated secrets.
ENV   := set -a; [ -f .env ] && . ./.env; SESSION_SECRET=$$(cat $(RT)/.session_secret); SOLARDA_INTERNAL_KEY=$$(cat $(RT)/.internal_key); set +a

.PHONY: setup secrets dev stop health test docker logs reset

setup:
	npm ci
	npm run build
	@for s in $(SVCS); do \
	  [ -x services/$$s/.venv/bin/python ] || uv venv -q --python 3.11 services/$$s/.venv; \
	  sed '1s/^\xEF\xBB\xBF//' services/$$s/requirements.lock | uv pip install -q --python services/$$s/.venv/bin/python -r /dev/stdin; \
	done
	python3 deploy/fetch_models.py
	@$(MAKE) -s secrets
	@echo "setup done -> make dev"

define start
	@$(ENV); (cd $(2) && exec $(3)) > $(RT)/logs/$(1).log 2>&1 < /dev/null & echo $$! > $(RT)/pids/$(1).pid
	@echo "started $(1)"
endef

# Without these the approval key gate would be silently off.
secrets:
	@mkdir -p $(RT)/logs $(RT)/pids
	@for f in .session_secret .internal_key; do [ -s $(RT)/$$f ] || (umask 077; openssl rand -hex 32 > $(RT)/$$f); done

# Rebuilds the API (a few seconds) so a git pull never runs stale code; web is served live by Vite.
dev: stop secrets
	@npm run -s build:engine && npm run -s build:contracts && npm run -s build -w @terrasub-solarda/api
	$(call start,api,weiqou/api,env PORT=3001 node dist/server.js)
	$(call start,twin,services/twin,.venv/bin/python -m uvicorn app.main:app --port 8100)
	$(call start,vision,services/vision,.venv/bin/python -m uvicorn app.main:app --port 8200)
	$(call start,agents,services/agents,.venv/bin/python -m uvicorn app.main:app --port 8000)
	$(call start,web,weiqou/web,npx vite --port 3000 --strictPort)
	@sleep 8; $(MAKE) -s health; echo "open http://localhost:3000"

stop:
	@for p in $(RT)/pids/*.pid; do [ -f "$$p" ] && { pkill -P $$(cat $$p) 2>/dev/null; kill $$(cat $$p) 2>/dev/null; rm -f $$p; }; done; true

health:
	@for u in localhost:3001/api/health localhost:8000/health localhost:8100/health localhost:8200/health localhost:3000; do \
	  curl -sf -m 5 -o /dev/null http://$$u && echo "OK   $$u" || echo "DOWN $$u (see $(RT)/logs)"; done

reset: stop
	rm -f $(RT)/actions.jsonl $(RT)/audit.jsonl $(RT)/runs.json $(RT)/sms_outbox.jsonl $(RT)/checkpoints.sqlite*
	@echo "demo state cleared (accounts kept) -> make dev"

logs:
	@tail -n 20 $(RT)/logs/*.log

test:
	npm run build:engine && npm run build:contracts
	npm run test:engine
	npm test -w @terrasub-solarda/api
	@for s in $(SVCS); do echo "== $$s"; (cd services/$$s && .venv/bin/python -m pytest -q) || exit 1; done

docker:
	docker build -t solarda .
	docker run --rm -p 7860:7860 solarda
