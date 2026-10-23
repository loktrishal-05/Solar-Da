from fastapi import FastAPI

app = FastAPI(title="Solarda agent runtime")


@app.get("/health")
def health():
    return {"status": "ok", "service": "agents"}
