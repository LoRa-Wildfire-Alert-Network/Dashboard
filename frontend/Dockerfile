FROM node:20-alpine

LABEL org.opencontainers.image.source=https://github.com/LoRa-Wildfire-Alert-Network/Dashboard
LABEL org.opencontainers.image.description="LoRa Wildfire Dashboard frontend"
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /app

COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
WORKDIR /app
COPY docs-site/package.json docs-site/package-lock.json ./docs-site/
WORKDIR /app/docs-site
RUN npm install
WORKDIR /app
COPY frontend ./frontend
COPY docs-site ./docs-site
WORKDIR /app/frontend
EXPOSE 8001

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8001"]
