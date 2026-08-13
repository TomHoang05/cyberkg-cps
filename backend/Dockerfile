FROM python:3.11-slim
# /app/backend mirrors the local backend/ directory so the loader script's
# ROOT / "backend" path resolves correctly when run via docker compose exec.
WORKDIR /app/backend
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src/
EXPOSE 8000
CMD ["uvicorn", "src.main_v2:app", "--host", "0.0.0.0", "--port", "8000"]
