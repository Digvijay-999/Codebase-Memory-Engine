# Stage 1: Build Frontend
FROM node:20.20.2-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS builder

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
# The CSP allows the origin of a VITE_API_URL override (see api-origin.envsh).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY --chmod=755 api-origin.envsh /docker-entrypoint.d/16-api-origin.envsh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
