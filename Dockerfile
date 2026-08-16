# ── Stage 1: Build the React frontend ──────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production runtime ───────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Install only production backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source, public assets, and the built frontend
COPY backend/ ./backend/
COPY public/ ./public/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 3000

WORKDIR /app/backend
CMD ["node", "server.js"]
