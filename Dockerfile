# --- build ---
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime ---
FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY package*.json ./
# --ignore-scripts evita el postinstall de esbuild (conflicto de versiones del
# binario en una dep transitiva); en runtime no se necesita ningún build script.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
EXPOSE 3000
# Aplica migraciones + seed (idempotente) y arranca el server SSR.
CMD ["sh", "-c", "node scripts/db-setup.mjs && node ./dist/server/entry.mjs"]
