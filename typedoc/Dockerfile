FROM node:20-bookworm-slim as base

WORKDIR /app
COPY . .
RUN npm ci
RUN npx tsc
RUN npx typedoc

FROM nginx:1.25-bookworm as runner

COPY --from=base /app/docs /usr/share/nginx/html
EXPOSE 80