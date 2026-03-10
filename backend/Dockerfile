FROM python:3.12-slim

LABEL org.opencontainers.image.source=https://github.com/LoRa-Wildfire-Alert-Network/Dashboard
LABEL org.opencontainers.image.description="LoRa Wildfire Dashboard backend API"
LABEL org.opencontainers.image.licenses=MIT

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY . /app

EXPOSE 8000

CMD ["uvicorn", "backend_api:app", "--host", "0.0.0.0", "--port", "8000"]
