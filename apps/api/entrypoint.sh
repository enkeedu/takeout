#!/bin/bash
set -e

# Run migrations if alembic config exists
if [ -f alembic.ini ] && [ -d alembic/versions ]; then
    echo "Running database migrations..."
    alembic upgrade head
fi

echo "Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
