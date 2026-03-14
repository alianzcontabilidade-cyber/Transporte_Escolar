#!/bin/sh
echo "Running db:push..."
npx drizzle-kit push || echo "db:push failed or tables already exist, continuing..."
echo "Starting server..."
node dist/index.js
