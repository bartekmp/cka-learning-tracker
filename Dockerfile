# Server-backed variant of the CKA tracker. The official site is fully static
# and needs none of this — see "Choose a deployment" in README.md.

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY build.mjs ./
COPY src ./src
COPY cluster ./cluster
RUN npm run build:server

FROM node:24-alpine
WORKDIR /app
COPY server/server.mjs ./server/server.mjs
COPY --from=build /app/dist ./dist
RUN mkdir /data && chown node:node /data
ENV PORT=8080 DATA_DIR=/data
VOLUME /data
EXPOSE 8080
USER node
CMD ["node", "server/server.mjs"]
