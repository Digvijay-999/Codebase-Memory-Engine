# Stage 1: Build Frontend
FROM node:26.13.0-alpine@sha256:8996bb5821d62a8fd9bb27c1cb07462f3fdce6e47d640c6a881ead0b064ce216 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:1.31.8-alpine@sha256:713fc2ebfd92e8217db451477182ee91944b123d2b1ee9fd5a8c6e91ca6c3a11

COPY --from=builder /app/dist /usr/share/nginx/html
# The image renders templates/*.template into conf.d/ with envsubst at startup.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_URL=http://backend:8000
# Peer trusted to set X-Forwarded-For; compose.prod.yml sets it to Caddy's IP.
ENV REAL_IP_FROM=127.0.0.1
# The CSP allows the origin of a VITE_API_URL override (see api-origin.envsh).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY --chmod=755 api-origin.envsh /docker-entrypoint.d/16-api-origin.envsh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
