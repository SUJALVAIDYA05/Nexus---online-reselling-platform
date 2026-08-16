#!/usr/bin/env bash
set -e

echo "==> Installing frontend dependencies (with devDeps)..."
cd frontend
NODE_ENV=development npm install

echo "==> Verifying vite is installed..."
ls node_modules/.bin/vite

echo "==> Building frontend..."
./node_modules/.bin/vite build
cd ..

echo "==> Installing backend dependencies..."
cd backend
npm install --omit=dev

echo "==> Build complete!"
